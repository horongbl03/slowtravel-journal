'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface JourneySession {
  id: string;
  created_at: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

const ArchivePage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<JourneySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        if (!user) {
          router.push('/');
          return;
        }

        // 서브쿼리를 사용하여 각 id별로 가장 최근 레코드만 가져오기
        const { data, error } = await supabase
          .from('journey_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // id를 기준으로 중복 제거하고 가장 최근 상태만 유지
        const uniqueSessions = data?.reduce((acc: JourneySession[], current) => {
          const existingSession = acc.find(session => session.id === current.id);
          if (!existingSession) {
            acc.push(current);
          } else if (new Date(current.created_at) > new Date(existingSession.created_at)) {
            // 같은 id를 가진 세션이 있다면, 더 최근의 상태로 업데이트
            const index = acc.findIndex(session => session.id === current.id);
            acc[index] = current;
          }
          return acc;
        }, []) || [];

        setSessions(uniqueSessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user, router]);

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedSessions(new Set());
  };

  const toggleSessionSelection = (sessionId: string) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const selectAll = () => {
    if (selectedSessions.size === sessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(sessions.map(session => session.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedSessions.size === 0) return;

    if (!confirm(`선택한 ${selectedSessions.size}개의 기록을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      
      // 관련된 모든 레코드 삭제
      const tables = [
        'pre_journey_records',
        'during_journey_records',
        'post_journey_records',
        'emotion_reports'
      ];

      for (const sessionId of selectedSessions) {
        for (const table of tables) {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('session_id', sessionId);
          
          if (error) throw error;
        }

        // journey_sessions 테이블에서 삭제
        const { error } = await supabase
          .from('journey_sessions')
          .delete()
          .eq('id', sessionId);

        if (error) throw error;
      }

      // 성공적으로 삭제되면 목록에서 제거
      setSessions(sessions.filter(session => !selectedSessions.has(session.id)));
      setSelectedSessions(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Error deleting sessions:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto min-h-screen max-w-lg bg-white">
        {/* Navigation Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700">
              <Home className="w-4 h-4 mr-1.5" />
              <span className="text-sm">홈으로</span>
            </Link>
            <div className="flex items-center gap-4">
              {isSelectionMode ? (
                <>
                  <button
                    onClick={selectAll}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {selectedSessions.size === sessions.length ? '전체 해제' : '전체 선택'}
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={selectedSessions.size === 0 || isDeleting}
                    className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
                  >
                    삭제 ({selectedSessions.size})
                  </button>
                  <button
                    onClick={toggleSelectionMode}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleSelectionMode}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  삭제선택
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">아직 기록된 여행이 없습니다.</p>
              <Link
                href="/pre-journey"
                className="inline-block px-4 py-2 bg-[#2C2C2C] text-white rounded-lg hover:bg-[#3C3C3C] transition-colors"
              >
                첫 여행 시작하기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`relative p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors ${
                    isSelectionMode ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => isSelectionMode && toggleSessionSelection(session.id)}
                >
                  {isSelectionMode && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <input
                        type="checkbox"
                        checked={selectedSessions.has(session.id)}
                        onChange={() => toggleSessionSelection(session.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div className={`flex justify-between items-center ${isSelectionMode ? 'pl-8' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {`${sessions.length - sessions.indexOf(session)}번째 거북이 아트여행 기록`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.created_at).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isSelectionMode && (
                        <Link
                          href={`/archive/${session.id}`}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          보기
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchivePage; 