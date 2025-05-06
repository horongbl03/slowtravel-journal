'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Home, ArrowLeft, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Resolution {
  id: string;
  text: string;
  checked: boolean;
}

interface SessionData {
  id: string;
  title: string;
  createdAt: string;
  status: 'not_started' | 'in_progress' | 'completed';
  preJourney: {
    physicalCondition: string;
    currentMood: string;
    moodDetails: string;
    resolutions: Record<string, boolean>;
    desires: string;
  } | null;
  duringJourney: {
    focusObject: string;
    focusReason: string;
    emotions: string;
    exploration: string;
    currentState: string;
    bestSensation: string;
  } | null;
  postJourney: {
    beforeState: string;
    duringState: string;
    afterState: string;
    longestPlace: string;
    longestEmotion: string;
    journeyMessage: string;
  } | null;
  emotionReport: {
    emotionFlow: {
      before: string[];
      during: string[];
      after: string[];
    };
    explicitEmotions: string[];
    sensoryElements: string[];
    comments: string[];
  } | null;
}

const SessionDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        if (!user) {
          router.push('/');
          return;
        }

        const sessionId = params.sessionId;

        // Fetch journey session
        const { data: journeySession, error: sessionError } = await supabase
          .from('journey_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError) throw sessionError;

        // Fetch pre journey records
        const { data: preJourney, error: preError } = await supabase
          .from('pre_journey_records')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (preError && preError.code !== 'PGRST116') throw preError;

        // Fetch during journey records
        const { data: duringJourney, error: duringError } = await supabase
          .from('during_journey_records')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (duringError && duringError.code !== 'PGRST116') throw duringError;

        // Fetch post journey records
        const { data: postJourney, error: postError } = await supabase
          .from('post_journey_records')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (postError && postError.code !== 'PGRST116') throw postError;

        console.log('Raw data:', { preJourney, duringJourney, postJourney });

        // Combine all data
        const combinedData: SessionData = {
          id: journeySession.id,
          title: '나의 여행 기록',
          createdAt: new Date(journeySession.created_at).toLocaleDateString(),
          status: journeySession.status,
          preJourney: preJourney ? {
            physicalCondition: preJourney.physical_condition || '',
            currentMood: preJourney.current_mood || '',
            moodDetails: preJourney.mood_details || '',
            resolutions: Array.isArray(preJourney.resolutions) ? 
              preJourney.resolutions.reduce((acc: Record<string, boolean>, curr: Resolution) => {
                if (curr && typeof curr === 'object' && 'id' in curr && 'checked' in curr) {
                  acc[curr.id] = curr.checked;
                }
                return acc;
              }, {}) : {},
            desires: preJourney.desires || '',
          } : null,
          duringJourney: duringJourney ? {
            focusObject: duringJourney.focus_object || '',
            focusReason: duringJourney.focus_reason || '',
            emotions: duringJourney.emotions || '',
            exploration: duringJourney.exploration || '',
            currentState: duringJourney.current_state || '',
            bestSensation: duringJourney.best_sensation || '',
          } : null,
          postJourney: postJourney ? {
            beforeState: postJourney.state_comparison?.split('\n')[0]?.replace('출발 전: ', '') || '',
            duringState: postJourney.state_comparison?.split('\n')[1]?.replace('여행 중: ', '') || '',
            afterState: postJourney.state_comparison?.split('\n')[2]?.replace('돌아온 지금: ', '') || '',
            longestPlace: postJourney.longest_place || '',
            longestEmotion: postJourney.longest_emotion || '',
            journeyMessage: postJourney.journey_message || '',
          } : null,
          emotionReport: null, // 감정 리포트는 별도 페이지에서 처리
        };

        console.log('Fetched data:', {
          preJourney,
          duringJourney,
          postJourney,
        });

        setSessionData(combinedData);
      } catch (error) {
        console.error('Error fetching session data:', error);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [params.sessionId, user, router]);

  const handleDeleteSession = async () => {
    if (!confirm('정말 이 기록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('journey_sessions')
        .delete()
        .eq('id', params.sessionId);

      if (error) throw error;

      router.push('/archive');
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('삭제 중 오류가 발생했습니다.');
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

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">데이터를 찾을 수 없습니다.</p>
          <Link href="/archive" className="mt-4 text-blue-500 hover:text-blue-600">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto min-h-screen max-w-lg bg-white">
        {/* Navigation Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
          <Link href="/archive" className="flex items-center text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="text-sm">목록으로</span>
          </Link>
        </div>

        <div className="px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-lg font-medium text-gray-800">{sessionData.title}</h1>
              <p className="text-sm text-gray-500 mt-1">{sessionData.createdAt}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteSession}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pre Journey Section */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-400 mb-3">여행 전</h2>
            {sessionData.preJourney && (
              <div className="space-y-4">
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">지금 내 몸 상태</p>
                  <p className="text-gray-800">{sessionData.preJourney.physicalCondition}</p>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">지금 내 기분</p>
                  <p className="text-gray-800">{sessionData.preJourney.currentMood}</p>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">오늘 하루 중 기대하는 것</p>
                  <p className="text-gray-800">{sessionData.preJourney.moodDetails}</p>
                </div>
                {Object.keys(sessionData.preJourney.resolutions).length > 0 && (
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">오늘의 최소 다짐</p>
                    <div className="space-y-2">
                      {Object.entries(sessionData.preJourney.resolutions).map(([key, checked]) => {
                        const resolutionTexts: Record<string, string> = {
                          phone: '휴대폰은 최소한으로 사용한다',
                          sns: '여행 중 SNS 기록은 하지 않는다',
                          rush: '서두르지 않는다',
                          focus: '내 마음과 쉼에 집중한다',
                          list: '하고 싶은 건 욕심리스트에 따로 적는다',
                          target: '여행 중에는 기억할 하나의 대상만 찾는다'
                        };
                        return (
                          <div key={key} className="flex items-start gap-2">
                            <div className="flex-shrink-0 mt-1">
                              {checked ? (
                                <div className="w-4 h-4 rounded-full bg-blue-500" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-gray-300" />
                              )}
                            </div>
                            <span className="text-sm text-gray-700">{resolutionTexts[key]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {sessionData.preJourney.desires && (
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">욕심 리스트</p>
                    <p className="text-gray-800">{sessionData.preJourney.desires}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* During Journey Section */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-400 mb-3">여행 중</h2>
            {sessionData.duringJourney && (
              <div className="space-y-4">
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">지금 내 시선이 머무는 곳</p>
                  <p className="text-gray-800">{sessionData.duringJourney.focusObject}</p>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">이곳에 시선이 머무는 이유</p>
                  <p className="text-gray-800">{sessionData.duringJourney.focusReason}</p>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">떠오르는 감정이나 이미지</p>
                  <p className="text-gray-800">{sessionData.duringJourney.emotions}</p>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">더 탐구하고 싶은지 여부</p>
                  <p className="text-gray-800">{sessionData.duringJourney.exploration}</p>
                </div>
              </div>
            )}
          </div>

          {/* Post Journey Section */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-400 mb-3">여행 후</h2>
            {sessionData.postJourney && (
              <div className="space-y-4">
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">출발 전 나의 상태</p>
                  <p className="text-gray-800">{sessionData.postJourney.beforeState}</p>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">여행 중의 나</p>
                  <p className="text-gray-800">{sessionData.postJourney.duringState}</p>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">돌아온 지금의 나</p>
                  <p className="text-gray-800">{sessionData.postJourney.afterState}</p>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">가장 오래 머문 공간</p>
                  <p className="text-gray-800">{sessionData.postJourney.longestPlace}</p>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">가장 오래 머문 감정</p>
                  <p className="text-gray-800">{sessionData.postJourney.longestEmotion}</p>
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">오늘의 여행이 나에게 말해준 것</p>
                  <p className="text-gray-800">{sessionData.postJourney.journeyMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Emotion Report Link */}
          <Link
            href={`/archive/${sessionData.id}/emotion-report`}
            className="block w-full text-center px-4 py-3 bg-[#2C2C2C] text-white rounded-xl hover:bg-[#3C3C3C] transition-colors text-sm"
          >
            AI 감정 분석 보기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailPage; 