"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

interface EmotionReport {
  emotion_flow: string;
  recurring_themes: string[];
  sensory_elements: string[];
  ai_feedback: string;
}

export default function EmotionReportPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<EmotionReport | null>(null);

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Supabase에서 여행 기록 데이터 불러오기
        const { data: session, error: sessionError } = await supabase
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
          .eq('id', sessionId)
          .single();

        if (sessionError || !session) throw new Error('여행 기록을 불러올 수 없습니다.');

        // 2. 프롬프트 데이터 구조화
        let pre: any = session.pre_journey_records;
        let during: any = session.during_journey_records;
        let post: any = session.post_journey_records;
        if (Array.isArray(pre)) pre = pre[0];
        if (Array.isArray(during)) during = during[0];
        if (Array.isArray(post)) post = post[0];
        if (!pre || Array.isArray(pre)) throw new Error('여행 전 기록이 완성되지 않았습니다.');
        if (!during || Array.isArray(during)) throw new Error('여행 중 기록이 완성되지 않았습니다.');
        if (!post || Array.isArray(post)) throw new Error('여행 후 기록이 완성되지 않았습니다.');

        const prompt = `
당신은 여행자의 감정을 분석하는 전문가입니다. 다음 여행 기록을 바탕으로 감정 분석 리포트를 작성해주세요.

[여행 전 상태]
- 신체 상태: ${pre.physical_condition}
- 현재 감정: ${pre.current_mood}
- 감정 상세: ${pre.mood_details}
- 바라는 점: ${pre.desires}

[여행 중 기록]
- 주목한 대상: ${during.focus_object}
- 주목한 이유: ${during.focus_reason}
- 감정: ${Array.isArray(during.emotions) ? during.emotions.join(', ') : during.emotions}

[여행 후 기록]
- ${post.state_comparison}
- 가장 오래 머문 장소: ${post.longest_place}
- 가장 오래 느낀 감정: ${post.longest_emotion}
- 여행 메시지: ${post.journey_message}

다음 형식으로 JSON 응답을 제공해주세요:
{
  "emotion_flow": "여행 전/중/후의 감정 변화를 분석한 내용",
  "recurring_themes": ["반복적으로 등장한 주제 1", ...],
  "sensory_elements": ["인상 깊었던 공간과 의미 1", ...],
  "ai_feedback": "여행이 전하는 메시지와 의미"
}
`;

        // 3. OpenAI API(axios)로 감정 분석 요청
        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) throw new Error('OpenAI API 키가 없습니다.');

        const aiRes = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4-turbo-preview',
            messages: [
              { role: 'system', content: '당신은 여행자의 감정을 분석하는 전문가입니다.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            }
          }
        );

        const content = aiRes.data.choices?.[0]?.message?.content;
        if (!content) throw new Error('AI 응답을 받지 못했습니다.');
        const reportJson = JSON.parse(content);

        // 4. 결과 화면에 출력
        setReport(reportJson);
      } catch (err: any) {
        setError(err.message || '감정 분석 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndAnalyze();
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto min-h-screen max-w-lg bg-white">
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">감정 분석 리포트를 생성하고 있습니다...</p>
          </div>
        </div>
      </div>
    </div>
  );
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto min-h-screen max-w-lg bg-white">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">감정 분석 리포트</h1>

          {/* 감정의 흐름 */}
          <div className="mb-8 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">감정의 흐름</h2>
            <p className="text-gray-600 whitespace-pre-line">{report?.emotion_flow}</p>
          </div>

          {/* 반복적 주제 */}
          <div className="mb-8 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">반복적으로 등장한 주제</h2>
            <div className="flex flex-wrap gap-2">
              {report?.recurring_themes.map((theme, i) => (
                <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{theme}</span>
              ))}
            </div>
          </div>

          {/* 감각적 요소 */}
          <div className="mb-8 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">인상 깊었던 공간과 의미</h2>
            <div className="flex flex-wrap gap-2">
              {report?.sensory_elements.map((el, i) => (
                <span key={i} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{el}</span>
              ))}
            </div>
          </div>

          {/* AI 피드백 */}
          <div className="mb-8 bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">여행이 전하는 메시지</h2>
            <p className="text-gray-600 whitespace-pre-line">{report?.ai_feedback}</p>
          </div>

          {/* 홈으로 돌아가기 버튼 */}
          <button
            onClick={() => router.push('/archive')}
            className="w-full px-6 py-3 bg-[#2C2C2C] text-white rounded-xl hover:bg-[#3C3C3C] mt-8"
          >
            내 기록 보기
          </button>
        </div>
      </div>
    </div>
  );
} 