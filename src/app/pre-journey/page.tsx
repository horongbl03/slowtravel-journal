'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import SimpleNavigation from '@/components/SimpleNavigation';

const PreJourneyPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [physicalCondition, setPhysicalCondition] = useState('');
  const [currentMood, setCurrentMood] = useState('');
  const [moodDetails, setMoodDetails] = useState('');
  const [showEmotionList, setShowEmotionList] = useState(false);
  const [resolutions, setResolutions] = useState([
    { id: 'phone', text: '휴대폰은 최소한으로 사용한다', checked: false },
    { id: 'sns', text: '여행 중 SNS 기록은 하지 않는다', checked: false },
    { id: 'rush', text: '서두르지 않는다', checked: false },
    { id: 'focus', text: '내 마음과 쉼에 집중한다', checked: false },
    { id: 'list', text: '하고 싶은 건 욕심리스트에 따로 적는다', checked: false },
    { id: 'target', text: '여행 중에는 기억할 하나의 대상만 찾는다', checked: false },
  ]);
  const [desires, setDesires] = useState('');

  // 페이지 로드 시 localStorage에서 데이터 불러오기
  useEffect(() => {
    const savedPhysicalCondition = localStorage.getItem('physicalCondition');
    const savedCurrentMood = localStorage.getItem('currentMood');
    const savedMoodDetails = localStorage.getItem('moodDetails');
    const savedResolutions = localStorage.getItem('resolutions');
    const savedDesires = localStorage.getItem('desires');

    if (savedPhysicalCondition) setPhysicalCondition(savedPhysicalCondition);
    if (savedCurrentMood) setCurrentMood(savedCurrentMood);
    if (savedMoodDetails) setMoodDetails(savedMoodDetails);
    if (savedResolutions) {
      try {
        const parsedResolutions = JSON.parse(savedResolutions);
        if (Array.isArray(parsedResolutions)) {
          setResolutions(parsedResolutions);
        }
      } catch (error) {
        console.error('Error parsing resolutions:', error);
      }
    }
    if (savedDesires) setDesires(savedDesires);
  }, []);

  // 데이터 변경 시 자동 저장
  useEffect(() => {
    localStorage.setItem('physicalCondition', physicalCondition);
    localStorage.setItem('currentMood', currentMood);
    localStorage.setItem('moodDetails', moodDetails);
    try {
      localStorage.setItem('resolutions', JSON.stringify(resolutions));
    } catch (error) {
      console.error('Error saving resolutions:', error);
    }
    localStorage.setItem('desires', desires);
  }, [physicalCondition, currentMood, moodDetails, resolutions, desires]);

  // 페이지 로드 시 인증 상태 확인
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleNext = async () => {
    try {
      if (!user) {
        console.error('User not authenticated');
        router.push('/');
        return;
      }

      // 새로운 기록 시작 시 during/post-journey 관련 localStorage 초기화
      const duringAndPostKeys = [
        'focusObject', 'focusReason', 'emotions', 'exploration', 'currentState',
        'bestSensation', 'bodyConditionAfter', 'imagery', 'restMoments', 'notableSensations',
        'beforeState', 'duringState', 'afterState', 'longestPlace', 'longestEmotion', 'journeyMessage'
      ];
      duringAndPostKeys.forEach(key => localStorage.removeItem(key));

      // 1. 세션이 이미 있으면 새로 만들지 않음
      let sessionId = localStorage.getItem('currentSessionId') as string;
      if (!sessionId) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('journey_sessions')
          .insert([
            {
              user_id: user.id,
              status: 'in_progress'
            }
          ])
          .select()
          .single();

        if (sessionError) {
          console.error('Error creating session:', sessionError);
          throw new Error(`세션 생성 중 오류: ${sessionError.message}`);
        }

        if (!sessionData?.id) {
          throw new Error('세션 ID가 생성되지 않았습니다.');
        }
        sessionId = sessionData.id;
        localStorage.setItem('currentSessionId', sessionId);
      }
      // sessionId는 이제 string임이 보장됨
      // 2. pre_journey_records에 이미 session_id가 있는지 확인
      const { data: existing, error: fetchError } = await supabase
        .from('pre_journey_records')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116: No rows found (즉, 없는 건 정상)
        throw fetchError;
      }

      if (existing) {
        // 이미 있으면 update
        const { error: updateError } = await supabase
          .from('pre_journey_records')
          .update({
            physical_condition: physicalCondition,
            current_mood: currentMood,
            mood_details: moodDetails,
            resolutions: resolutions,
            desires: desires
          })
          .eq('session_id', sessionId);

        if (updateError) {
          console.error('Error updating pre-journey data:', updateError);
          throw new Error(`여행 전 기록 수정 중 오류: ${updateError.message}`);
        }
      } else {
        // 없으면 insert
        const { error: preJourneyError } = await supabase
          .from('pre_journey_records')
          .insert([
            {
              session_id: sessionId,
              physical_condition: physicalCondition,
              current_mood: currentMood,
              mood_details: moodDetails,
              resolutions: resolutions,
              desires: desires
            }
          ]);

        if (preJourneyError) {
          console.error('Error saving pre-journey data:', preJourneyError);
          throw new Error(`여행 전 기록 저장 중 오류: ${preJourneyError.message}`);
        }
      }

      // 3. during-journey 페이지로 이동
      router.push('/during-journey');
    } catch (error) {
      console.error('Error in handleNext:', error);
      alert(`데이터 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleResolutionChange = (index: number) => {
    setResolutions(prev => {
      const newResolutions = [...prev];
      newResolutions[index] = {
        ...newResolutions[index],
        checked: !newResolutions[index].checked
      };
      return newResolutions;
    });
  };

  // 로딩 중일 때 표시할 UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우 빈 페이지 반환 (useEffect에서 리디렉션 처리)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto min-h-screen max-w-lg bg-white">
        <SimpleNavigation />
        
        {/* Stepper */}
        <div className="px-8 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-blue-500 bg-white">
                <span className="text-sm text-blue-500">1</span>
              </div>
              <span className="mt-2 text-xs text-blue-500 font-medium">여행 전</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-300 bg-white">
                <span className="text-sm text-gray-400">2</span>
              </div>
              <span className="mt-2 text-xs text-gray-500">여행 중</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-300 bg-white">
                <span className="text-sm text-gray-400">3</span>
              </div>
              <span className="mt-2 text-xs text-gray-500">여행 후</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          {/* Physical Condition */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              지금 내 몸 상태
            </label>
            <input
              type="text"
              placeholder="예시) 피곤 / 무기력 / 들뜸 / 멍함 / 기대됨"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={physicalCondition}
              onChange={(e) => setPhysicalCondition(e.target.value)}
            />
          </div>

          {/* Current Mood */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              지금 내 기분
            </label>
            <input
              type="text"
              placeholder="예시) 느끼는 감정을 단어 또는 문장으로 적어보세요"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={currentMood}
              onChange={(e) => setCurrentMood(e.target.value)}
            />
            
            {/* Emotion List Toggle */}
            <button
              onClick={() => setShowEmotionList(!showEmotionList)}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600"
            >
              {showEmotionList ? '감정 예시 닫기' : '감정 예시 보기'}
            </button>

            {showEmotionList && (
              <div className="mt-2 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                <div className="mb-2 text-sm">
                  <span className="text-yellow-500">🌞</span> 긍정적 감정: 행복, 기쁨, 설렘, 평온, 감사
                </div>
                <div className="mb-2 text-sm">
                  <span className="text-gray-500">🌫</span> 중립적 감정: 무감정, 평범, 보통, 차분
                </div>
                <div className="mb-2 text-sm">
                  <span className="text-blue-500">🌧</span> 부정적 감정: 슬픔, 걱정, 불안, 피로
                </div>
                <div className="text-sm">
                  <span className="text-purple-500">🧩</span> 섞인 감정: 복잡, 혼란, 애매, 미묘
                </div>
              </div>
            )}
          </div>

          {/* Mood Details */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              기분 세부 설명
            </label>
            <input
              type="text"
              placeholder="예시) 기분이 어떤지 조금 더 자세히 적어보세요"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={moodDetails}
              onChange={(e) => setMoodDetails(e.target.value)}
            />
          </div>

          {/* Resolutions Checklist */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              오늘의 최소 다짐
            </label>
            <div className="space-y-3">
              {resolutions.map((resolution, index) => (
                <label key={resolution.id} className="flex items-start space-x-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                  <input
                    type="checkbox"
                    checked={resolution.checked}
                    onChange={() => handleResolutionChange(index)}
                    className="mt-1 w-4 h-4 text-blue-500 rounded focus:ring-blue-200 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{resolution.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Desires List */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              욕심 리스트
            </label>
            <input
              type="text"
              placeholder="예시) 하고 싶은 것들을 자유롭게 적어보세요"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={desires}
              onChange={(e) => setDesires(e.target.value)}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-end mt-12 mb-8">
            <button
              onClick={handleNext}
              className="flex items-center justify-center w-32 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreJourneyPage; 