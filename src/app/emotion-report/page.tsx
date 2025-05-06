'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import SimpleNavigation from '@/components/SimpleNavigation';
import { EmotionReport, generateEmotionReport, saveEmotionReportToDB } from '@/lib/emotion-report';

const EmotionReportPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<EmotionReport | null>(null);

  useEffect(() => {
    const fetchDataAndGenerateReport = async () => {
      try {
        if (!user) {
          router.push('/login');
          return;
        }

        // 1. 여행 기록 데이터 가져오기
        const { data: journeyData, error: journeyError } = await supabase
          .from('journey_sessions')
          .select(`
            id,
            pre_journey_records (
              physical_condition,
              current_mood,
              mood_details,
              desires
            ),
            during_journey_records (
              focus_object,
              focus_reason,
              emotions
            ),
            post_journey_records (
              state_comparison,
              longest_place,
              longest_emotion,
              journey_message
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (journeyError) throw journeyError;
        if (!journeyData) throw new Error('여행 기록을 찾을 수 없습니다.');

        // 2. 데이터 구조화
        const preJourney = journeyData.pre_journey_records;
        const duringJourney = journeyData.during_journey_records;
        const postJourney = journeyData.post_journey_records;

        if (!preJourney || !duringJourney || !postJourney) {
          throw new Error('여행 기록이 완성되지 않았습니다.');
        }

        // 3. OpenAI API 호출
        const aiReport = await generateEmotionReport({
          before: `신체 상태: ${preJourney.physical_condition}\n현재 감정: ${preJourney.current_mood}\n감정 상세: ${preJourney.mood_details}\n바라는 점: ${preJourney.desires}`,
          during: `주목한 대상: ${duringJourney.focus_object}\n주목한 이유: ${duringJourney.focus_reason}\n감정: ${duringJourney.emotions.join(', ')}`,
          after: `출발 전: ${postJourney.state_comparison?.split('\n')[0]?.replace('출발 전: ', '')}\n여행 중: ${postJourney.state_comparison?.split('\n')[1]?.replace('여행 중: ', '')}\n돌아온 지금: ${postJourney.state_comparison?.split('\n')[2]?.replace('돌아온 지금: ', '')}\n가장 오래 머문 장소: ${postJourney.longest_place}\n가장 오래 느낀 감정: ${postJourney.longest_emotion}\n여행 메시지: ${postJourney.journey_message}`
        });

        // 4. 리포트 저장
        await saveEmotionReportToDB(user.id, aiReport);
        setReport(aiReport);
      } catch (error) {
        console.error('Error generating emotion report:', error);
        setError(error instanceof Error ? error.message : '감정 분석 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDataAndGenerateReport();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto min-h-screen max-w-lg bg-white">
          <SimpleNavigation />
          <div className="flex items-center justify-center h-[calc(100vh-64px)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">감정 분석 리포트를 생성하고 있습니다...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto min-h-screen max-w-lg bg-white">
          <SimpleNavigation />
          <div className="flex items-center justify-center h-[calc(100vh-64px)]">
            <div className="text-center">
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
              >
                홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto min-h-screen max-w-lg bg-white">
        <SimpleNavigation />
        
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">감정 분석 리포트</h1>

          {/* 감정의 흐름 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">감정의 흐름</h2>
            <p className="text-gray-600 whitespace-pre-line">{report?.emotion_flow}</p>
          </div>

          {/* 반복적 주제 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">반복적으로 등장한 주제</h2>
            <div className="flex flex-wrap gap-2">
              {report?.recurring_themes.map((theme, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* 감각적 요소 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">인상 깊었던 공간과 의미</h2>
            <div className="flex flex-wrap gap-2">
              {report?.sensory_elements.map((element, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {element}
                </span>
              ))}
            </div>
          </div>

          {/* AI 피드백 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">여행이 전하는 메시지</h2>
            <p className="text-gray-600 whitespace-pre-line">{report?.ai_feedback}</p>
          </div>

          {/* 홈으로 돌아가기 버튼 */}
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmotionReportPage; 