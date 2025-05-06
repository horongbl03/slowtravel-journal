'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SimpleNavigation from '@/components/SimpleNavigation';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

interface EmotionReport {
  id: string;
  emotion_flow: string;
  recurring_themes: string[];
  sensory_elements: string[];
  ai_feedback: string;
  created_at: string;
}

export default function EmotionReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [report, setReport] = useState<EmotionReport | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      const { data, error } = await supabase
        .from('emotion_reports')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching report:', error);
        return;
      }

      setReport(data);
    };

    if (sessionId) {
      fetchReport();
    }
  }, [sessionId]);

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto min-h-screen max-w-lg bg-white">
          <SimpleNavigation />
          <div className="flex justify-center items-center h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
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
          <h1 className="text-xl font-semibold mb-6">AI 감정 분석 리포트</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-sm text-gray-600 mb-2">감정의 흐름</h2>
              <p className="whitespace-pre-line bg-gray-50/50 p-4 rounded-xl text-gray-700">
                {report.emotion_flow}
              </p>
            </div>

            <div>
              <h2 className="text-sm text-gray-600 mb-2">반복적으로 등장한 감정</h2>
              <div className="flex flex-wrap gap-2">
                {report.recurring_themes.map((theme, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm text-gray-600 mb-2">인상 깊었던 공간</h2>
              <div className="flex flex-wrap gap-2">
                {report.sensory_elements.map((element, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm"
                  >
                    {element}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm text-gray-600 mb-2">여행이 전하는 메시지</h2>
              <p className="bg-gray-50/50 p-4 rounded-xl text-gray-700">
                {report.ai_feedback}
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 mb-8">
            <Link
              href={`/archive/${sessionId}`}
              className="flex items-center justify-center w-32 px-6 py-3 text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm">이전</span>
            </Link>
            <Link
              href="/archive"
              className="flex items-center justify-center w-32 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
            >
              <span className="text-sm">내 기록보기</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 