'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Home, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import SimpleNavigation from '@/components/SimpleNavigation';
import { generateEmotionReport } from '@/lib/openai';

interface Resolution {
  id: string;
  text: string;
  checked: boolean;
}

const PostJourneyPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [beforeState, setBeforeState] = useState('');
  const [duringState, setDuringState] = useState('');
  const [afterState, setAfterState] = useState('');
  const [longestPlace, setLongestPlace] = useState('');
  const [longestEmotion, setLongestEmotion] = useState('');
  const [journeyMessage, setJourneyMessage] = useState('');

  // 페이지 로드 시 localStorage에서 데이터 불러오기
  useEffect(() => {
    const savedBeforeState = localStorage.getItem('beforeState');
    const savedDuringState = localStorage.getItem('duringState');
    const savedAfterState = localStorage.getItem('afterState');
    const savedLongestPlace = localStorage.getItem('longestPlace');
    const savedLongestEmotion = localStorage.getItem('longestEmotion');
    const savedJourneyMessage = localStorage.getItem('journeyMessage');

    if (savedBeforeState) setBeforeState(savedBeforeState);
    if (savedDuringState) setDuringState(savedDuringState);
    if (savedAfterState) setAfterState(savedAfterState);
    if (savedLongestPlace) setLongestPlace(savedLongestPlace);
    if (savedLongestEmotion) setLongestEmotion(savedLongestEmotion);
    if (savedJourneyMessage) setJourneyMessage(savedJourneyMessage);
  }, []);

  // 데이터 변경 시 자동 저장
  useEffect(() => {
    localStorage.setItem('beforeState', beforeState);
    localStorage.setItem('duringState', duringState);
    localStorage.setItem('afterState', afterState);
    localStorage.setItem('longestPlace', longestPlace);
    localStorage.setItem('longestEmotion', longestEmotion);
    localStorage.setItem('journeyMessage', journeyMessage);
  }, [beforeState, duringState, afterState, longestPlace, longestEmotion, journeyMessage]);

  const handleComplete = async () => {
    try {
      if (!user) {
        alert('로그인이 필요합니다.');
        router.push('/login');
        return;
      }

      // Validate required fields
      if (!beforeState || !duringState || !afterState) {
        alert('모든 상태 비교 항목을 입력해주세요.');
        return;
      }

      if (!longestPlace || !longestEmotion) {
        alert('가장 오래 머문 장소와 감정을 입력해주세요.');
        return;
      }

      // Load and validate pre-journey data
      const preJourneyData = {
        physical_condition: localStorage.getItem('physicalCondition') || '',
        current_mood: localStorage.getItem('currentMood') || '',
        mood_details: localStorage.getItem('moodDetails') || '',
        resolutions: [] as Resolution[],
        desires: localStorage.getItem('desires') || ''
      };

      try {
        const savedResolutions = localStorage.getItem('resolutions');
        if (savedResolutions) {
          const parsedResolutions = JSON.parse(savedResolutions) as Resolution[];
          if (Array.isArray(parsedResolutions)) {
            preJourneyData.resolutions = parsedResolutions;
          }
        }
      } catch (error) {
        console.error('Error parsing resolutions:', error);
        preJourneyData.resolutions = [];
      }

      if (!preJourneyData.physical_condition || !preJourneyData.current_mood) {
        alert('여행 전 기록이 누락되었습니다. 처음부터 다시 시작해주세요.');
        router.push('/pre-journey');
        return;
      }

      // Create session first
      const { data: sessionData, error: sessionError } = await supabase
        .from('journey_sessions')
        .insert([
          {
            user_id: user.id,
            status: 'completed',
            completed_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (sessionError || !sessionData?.id) {
        throw new Error('세션을 생성할 수 없습니다. 잠시 후 다시 시도해주세요.');
      }

      const session_id = sessionData.id;

      // Save pre-journey data
      const { error: preError } = await supabase
        .from('pre_journey_records')
        .insert([{ ...preJourneyData, session_id }]);

      if (preError) throw new Error('여행 전 기록 저장에 실패했습니다.');

      // Load and validate during-journey data
      const emotions = localStorage.getItem('emotions');
      const emotionsArray = emotions ? emotions.split(',').map(e => e.trim()) : [];

      const duringJourneyData = {
        session_id,
        focus_object: localStorage.getItem('focusObject') || '',
        focus_reason: localStorage.getItem('focusReason') || '',
        emotions: emotionsArray
      };

      console.log('During journey data to be saved:', duringJourneyData);

      // Validate required fields
      if (!duringJourneyData.focus_object || !duringJourneyData.focus_reason) {
        console.error('Validation failed:', {
          focus_object: duringJourneyData.focus_object,
          focus_reason: duringJourneyData.focus_reason
        });
        throw new Error('여행 중 기록이 누락되었습니다. 처음부터 다시 시작해주세요.');
      }

      const { data: duringJourneyResult, error: duringJourneyError } = await supabase
        .from('during_journey_records')
        .insert([duringJourneyData])
        .select();

      if (duringJourneyError) {
        console.error('During journey error details:', duringJourneyError);
        throw new Error(`During journey save failed: ${JSON.stringify(duringJourneyError)}`);
      }

      console.log('Supabase during journey response:', duringJourneyResult);

      // Prepare post journey data
      const postJourneyPayload = {
        session_id,
        state_comparison: `출발 전: ${beforeState}\n여행 중: ${duringState}\n돌아온 지금: ${afterState}`,
        longest_emotion: longestEmotion,
        longest_place: longestPlace,
        journey_message: journeyMessage
      };

      console.log('Attempting to save post journey data:', postJourneyPayload);

      // Save post-journey data
      const postJourneyResponse = await supabase
        .from('post_journey_records')
        .insert([postJourneyPayload])
        .select();

      console.log('Post journey complete response:', postJourneyResponse);

      if (postJourneyResponse.error) {
        console.error('Post journey save failed:', {
          error: postJourneyResponse.error,
          details: postJourneyResponse.error.details,
          message: postJourneyResponse.error.message
        });
        throw new Error(`여행 후 기록 저장에 실패했습니다: ${postJourneyResponse.error.message}`);
      }

      // Prepare emotion report data
      try {
        const aiReport = await generateEmotionReport({
          preJourney: {
            physicalCondition: preJourneyData.physical_condition,
            currentMood: preJourneyData.current_mood,
            moodDetails: preJourneyData.mood_details,
            desires: preJourneyData.desires
          },
          duringJourney: {
            focusObject: duringJourneyData.focus_object,
            focusReason: duringJourneyData.focus_reason,
            emotions: duringJourneyData.emotions,
            exploration: localStorage.getItem('exploration') || ''
          },
          postJourney: {
            beforeState: beforeState,
            duringState: duringState,
            afterState: afterState,
            longestPlace: longestPlace,
            longestEmotion: longestEmotion,
            journeyMessage: journeyMessage
          }
        });

        const emotionReportPayload = {
          session_id,
          emotion_flow: aiReport.emotion_flow,
          recurring_themes: aiReport.recurring_themes,
          sensory_elements: aiReport.sensory_elements,
          ai_feedback: aiReport.ai_feedback,
          is_latest: true
        };

        console.log('Attempting to save emotion report:', emotionReportPayload);

        // Save emotion report
        const emotionReportResponse = await supabase
          .from('emotion_reports')
          .insert([emotionReportPayload])
          .select();

        console.log('Emotion report complete response:', emotionReportResponse);

        if (emotionReportResponse.error) {
          console.error('Emotion report save failed:', {
            error: emotionReportResponse.error,
            details: emotionReportResponse.error.details,
            message: emotionReportResponse.error.message
          });
          throw new Error(`감정 보고서 저장에 실패했습니다: ${emotionReportResponse.error.message}`);
        }
      } catch (error) {
        console.error('Error generating/saving emotion report:', error);
        throw new Error('AI 감정 분석 리포트 생성에 실패했습니다.');
      }

      // All operations succeeded, clear localStorage
      const keysToRemove = [
        'physicalCondition', 'currentMood', 'moodDetails', 'resolutions', 'desires',
        'focusObject', 'focusReason', 'emotions', 'exploration', 'currentState',
        'beforeState', 'duringState', 'afterState', 'longestPlace', 'longestEmotion',
        'journeyMessage', 'currentSessionId'
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('Successfully cleared localStorage');

      // Navigate to emotion report page
      router.push('/emotion-report');

    } catch (error) {
      console.error('Error in handleComplete:', error);
      alert(error instanceof Error ? error.message : '데이터 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto min-h-screen max-w-lg bg-white">
        <SimpleNavigation />
        
        {/* Stepper */}
        <div className="px-8 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 bg-blue-500 border-blue-500">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="mt-2 text-xs text-gray-500">여행 전</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 bg-blue-500 border-blue-500">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="mt-2 text-xs text-gray-500">여행 중</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-blue-500 bg-white">
                <span className="text-sm text-blue-500">3</span>
              </div>
              <span className="mt-2 text-xs text-blue-500 font-medium">여행 후</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          {/* Today's State Section */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              출발 전 나의 상태
            </label>
            <input
              type="text"
              placeholder="예시) 무기력했고, 마음이 좀 불편했음"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={beforeState}
              onChange={(e) => setBeforeState(e.target.value)}
            />
          </div>

          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              여행 중의 나
            </label>
            <input
              type="text"
              placeholder="예시) 생각보다 집중했고, 나를 많이 느꼈음"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={duringState}
              onChange={(e) => setDuringState(e.target.value)}
            />
          </div>

          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              돌아온 지금의 나
            </label>
            <input
              type="text"
              placeholder="예시) 조용하지만 단단한 느낌"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={afterState}
              onChange={(e) => setAfterState(e.target.value)}
            />
          </div>

          {/* Longest Stay Section */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              가장 오래 머문 공간
            </label>
            <input
              type="text"
              placeholder="예시) 전시실 앞 조용한 유리 벤치"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={longestPlace}
              onChange={(e) => setLongestPlace(e.target.value)}
            />
          </div>

          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              가장 오래 머문 감정
            </label>
            <input
              type="text"
              placeholder="예시) 멍한 고요함"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={longestEmotion}
              onChange={(e) => setLongestEmotion(e.target.value)}
            />
          </div>

          {/* Journey Message Section */}
          <div className="mb-8">
            <label className="block text-gray-600 text-sm mb-2">
              오늘의 여행이 나에게 말해준 것
            </label>
            <input
              type="text"
              placeholder="예시) 빠르게 가야 할 이유가 없는 하루였다."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-200 bg-gray-50/50"
              value={journeyMessage}
              onChange={(e) => setJourneyMessage(e.target.value)}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 mb-8">
            <Link
              href="/during-journey"
              className="flex items-center justify-center w-32 px-6 py-3 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm">이전</span>
            </Link>
            <button
              onClick={handleComplete}
              className="flex items-center justify-center w-32 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
            >
              작성완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJourneyPage; 