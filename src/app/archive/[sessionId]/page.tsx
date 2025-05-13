'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Pencil } from 'lucide-react';
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
    bodyConditionAfter: string;
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
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<SessionData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        if (!user) {
          router.push('/');
          return;
        }

        const sessionId = params.sessionId;

        // Fetch journey session
        const { data: journeySession } = await supabase
          .from('journey_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (!journeySession) throw new Error('Session not found');

        // Fetch pre journey records
        const { data: preJourney } = await supabase
          .from('pre_journey_records')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        // Fetch during journey records
        const { data: duringJourney } = await supabase
          .from('during_journey_records')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        // Fetch post journey records
        const { data: postJourney } = await supabase
          .from('post_journey_records')
          .select('*')
          .eq('session_id', sessionId)
          .single();

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
            bodyConditionAfter: duringJourney.body_condition_after || '',
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
        setEditData(combinedData);
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

  const getEditDataWithDefaults = (data: SessionData | null): SessionData => ({
    id: data?.id || '',
    title: data?.title || '나의 여행 기록',
    createdAt: data?.createdAt || '',
    status: data?.status || 'not_started',
    preJourney: data?.preJourney || {
      physicalCondition: '',
      currentMood: '',
      moodDetails: '',
      resolutions: {},
      desires: '',
    },
    duringJourney: data?.duringJourney || {
      focusObject: '',
      focusReason: '',
      emotions: '',
      exploration: '',
      currentState: '',
      bestSensation: '',
      bodyConditionAfter: '',
    },
    postJourney: data?.postJourney || {
      beforeState: '',
      duringState: '',
      afterState: '',
      longestPlace: '',
      longestEmotion: '',
      journeyMessage: '',
    },
    emotionReport: null,
  });

  const handleEditClick = () => {
    setEditMode(true);
    setEditData(getEditDataWithDefaults(sessionData));
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditData(sessionData);
  };

  const handleInputChange = (section: string, field: string, value: string) => {
    if (!editData) return;
    setEditData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (section === 'preJourney' && updated.preJourney) {
        updated.preJourney = { ...updated.preJourney, [field]: value };
      } else if (section === 'duringJourney' && updated.duringJourney) {
        updated.duringJourney = { ...updated.duringJourney, [field]: value };
      } else if (section === 'postJourney' && updated.postJourney) {
        updated.postJourney = { ...updated.postJourney, [field]: value };
      }
      return updated;
    });
  };

  const handleSaveEdit = async () => {
    if (!editData) return;
    setSaving(true);
    try {
      // preJourney
      if (editData.preJourney) {
        const { data: existing } = await supabase
          .from('pre_journey_records')
          .select('id')
          .eq('session_id', editData.id)
          .single();
        if (existing) {
          await supabase.from('pre_journey_records').update({
            physical_condition: editData.preJourney.physicalCondition,
            current_mood: editData.preJourney.currentMood,
            mood_details: editData.preJourney.moodDetails,
            desires: editData.preJourney.desires,
          }).eq('session_id', editData.id);
        } else {
          await supabase.from('pre_journey_records').insert({
            session_id: editData.id,
            physical_condition: editData.preJourney.physicalCondition,
            current_mood: editData.preJourney.currentMood,
            mood_details: editData.preJourney.moodDetails,
            resolutions: [],
            desires: editData.preJourney.desires,
          });
        }
      }
      // duringJourney
      if (editData.duringJourney) {
        const { data: existingDuringJourney } = await supabase
          .from('during_journey_records')
          .select('id')
          .eq('session_id', editData.id)
          .single();
        if (existingDuringJourney) {
          await supabase.from('during_journey_records').update({
            focus_object: editData.duringJourney.focusObject,
            focus_reason: editData.duringJourney.focusReason,
            emotions: editData.duringJourney.emotions,
            exploration: editData.duringJourney.exploration,
            body_condition_after: editData.duringJourney.bodyConditionAfter,
            best_sensation: editData.duringJourney.bestSensation,
          }).eq('session_id', editData.id);
        } else {
          await supabase.from('during_journey_records').insert({
            session_id: editData.id,
            focus_object: editData.duringJourney.focusObject,
            focus_reason: editData.duringJourney.focusReason,
            emotions: editData.duringJourney.emotions,
            exploration: editData.duringJourney.exploration,
            body_condition_after: editData.duringJourney.bodyConditionAfter,
            best_sensation: editData.duringJourney.bestSensation,
          });
        }
      }
      // postJourney
      if (editData.postJourney) {
        const { data: existingPostJourney } = await supabase
          .from('post_journey_records')
          .select('id')
          .eq('session_id', editData.id)
          .single();
        if (existingPostJourney) {
          await supabase.from('post_journey_records').update({
            state_comparison: `출발 전: ${editData.postJourney.beforeState}\n여행 중: ${editData.postJourney.duringState}\n돌아온 지금: ${editData.postJourney.afterState}`,
            longest_place: editData.postJourney.longestPlace,
            longest_emotion: editData.postJourney.longestEmotion,
            journey_message: editData.postJourney.journeyMessage,
          }).eq('session_id', editData.id);
        } else {
          await supabase.from('post_journey_records').insert({
            session_id: editData.id,
            state_comparison: `출발 전: ${editData.postJourney.beforeState}\n여행 중: ${editData.postJourney.duringState}\n돌아온 지금: ${editData.postJourney.afterState}`,
            longest_place: editData.postJourney.longestPlace,
            longest_emotion: editData.postJourney.longestEmotion,
            journey_message: editData.postJourney.journeyMessage,
          });
        }
      }
      setEditMode(false);
      setSessionData(editData);
      alert('수정이 저장되었습니다.');
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
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
                disabled={editMode}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {!editMode ? (
                <button
                  onClick={handleEditClick}
                  className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 rounded bg-blue-500 text-white text-xs mr-1"
                    disabled={saving}
                  >
                    저장
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-xs"
                    disabled={saving}
                  >
                    취소
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Pre Journey Section */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-400 mb-3">여행 전</h2>
            {(editMode || sessionData.preJourney) && (
              <div className="space-y-4">
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">지금 내 몸 상태</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.preJourney?.physicalCondition}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.preJourney?.physicalCondition || ''}
                      onChange={e => handleInputChange('preJourney', 'physicalCondition', e.target.value)}
                    />
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">지금 내 기분</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.preJourney?.currentMood}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.preJourney?.currentMood || ''}
                      onChange={e => handleInputChange('preJourney', 'currentMood', e.target.value)}
                    />
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">오늘 하루 중 기대하는 것</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.preJourney?.moodDetails}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.preJourney?.moodDetails || ''}
                      onChange={e => handleInputChange('preJourney', 'moodDetails', e.target.value)}
                    />
                  )}
                </div>
                {Object.keys(sessionData.preJourney?.resolutions || {}).length > 0 && (
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">오늘의 최소 다짐</p>
                    <div className="space-y-2">
                      {Object.entries(sessionData.preJourney?.resolutions || {}).map(([key, checked]) => {
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
                {/* 욕심 리스트 항목 개선 */}
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">욕심 리스트</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.preJourney?.desires}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.preJourney?.desires || ''}
                      onChange={e => handleInputChange('preJourney', 'desires', e.target.value)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* During Journey Section */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-400 mb-3">여행 중</h2>
            {(editMode || sessionData.duringJourney) && (
              <div className="space-y-4">
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">지금 내 시선이 머무는 곳</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.duringJourney?.focusObject}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.duringJourney?.focusObject || ''}
                      onChange={e => handleInputChange('duringJourney', 'focusObject', e.target.value)}
                    />
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">이곳에 시선이 머무는 이유</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.duringJourney?.focusReason}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.duringJourney?.focusReason || ''}
                      onChange={e => handleInputChange('duringJourney', 'focusReason', e.target.value)}
                    />
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">떠오르는 감정이나 이미지</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.duringJourney?.emotions}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.duringJourney?.emotions || ''}
                      onChange={e => handleInputChange('duringJourney', 'emotions', e.target.value)}
                    />
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">더 탐구하고 싶은지 여부</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.duringJourney?.exploration}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.duringJourney?.exploration || ''}
                      onChange={e => handleInputChange('duringJourney', 'exploration', e.target.value)}
                    />
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">전시 감상 직후 내 몸 상태</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.duringJourney?.bodyConditionAfter}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.duringJourney?.bodyConditionAfter || ''}
                      onChange={e => handleInputChange('duringJourney', 'bodyConditionAfter', e.target.value)}
                    />
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">지금 가장 좋은 감각</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.duringJourney?.bestSensation}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.duringJourney?.bestSensation || ''}
                      onChange={e => handleInputChange('duringJourney', 'bestSensation', e.target.value)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Post Journey Section */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-400 mb-3">여행 후</h2>
            {(editMode || sessionData.postJourney) && (
              <div className="space-y-4">
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">출발 전 나의 상태</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.postJourney?.beforeState}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.postJourney?.beforeState || ''}
                      onChange={e => handleInputChange('postJourney', 'beforeState', e.target.value)}
                    />
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">여행 중의 나</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.postJourney?.duringState}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.postJourney?.duringState || ''}
                      onChange={e => handleInputChange('postJourney', 'duringState', e.target.value)}
                    />
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">돌아온 지금의 나</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.postJourney?.afterState}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.postJourney?.afterState || ''}
                      onChange={e => handleInputChange('postJourney', 'afterState', e.target.value)}
                    />
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">가장 오래 머문 공간</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.postJourney?.longestPlace}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.postJourney?.longestPlace || ''}
                      onChange={e => handleInputChange('postJourney', 'longestPlace', e.target.value)}
                    />
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">가장 오래 머문 감정</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.postJourney?.longestEmotion}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.postJourney?.longestEmotion || ''}
                      onChange={e => handleInputChange('postJourney', 'longestEmotion', e.target.value)}
                    />
                  )}
                </div>
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">오늘의 여행이 나에게 말해준 것</p>
                  {!editMode ? (
                    <p className="text-gray-800">{sessionData.postJourney?.journeyMessage}</p>
                  ) : (
                    <input
                      className="w-full border rounded px-2 py-1 text-gray-800"
                      value={editData?.postJourney?.journeyMessage || ''}
                      onChange={e => handleInputChange('postJourney', 'journeyMessage', e.target.value)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Emotion Report Link */}
          <Link
            href={`/emotion-report/${sessionData.id}`}
            className={`block w-full text-center px-4 py-3 rounded-xl transition-colors text-sm ${editMode ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : 'bg-[#2C2C2C] text-white hover:bg-[#3C3C3C]'}`}
            tabIndex={editMode ? -1 : 0}
            aria-disabled={editMode}
            onClick={e => { if (editMode) e.preventDefault(); }}
          >
            AI 감정 분석 보기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailPage; 