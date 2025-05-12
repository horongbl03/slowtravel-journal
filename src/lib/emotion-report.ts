import axios from 'axios';
import { supabase } from './supabase';

export interface EmotionReport {
  emotion_flow: string;
  recurring_themes: string[];
  sensory_elements: string[];
  ai_feedback: string;
}

export async function generateEmotionReport(journey: {
  before: string;
  during: string;
  after: string;
}): Promise<EmotionReport> {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: '당신은 여행자의 감정을 분석하는 전문가입니다. 주어진 여행 기록을 바탕으로 감정 분석 리포트를 작성해주세요.'
          },
          {
            role: 'user',
            content: `
다음 여행 기록을 바탕으로 감정 분석 리포트를 작성해주세요.

[여행 전]
${journey.before}

[여행 중]
${journey.during}

[여행 후]
${journey.after}

다음 형식으로 JSON 응답을 제공해주세요:
{
  "emotion_flow": "여행 전/중/후의 감정 변화를 분석한 내용",
  "recurring_themes": ["반복적으로 등장한 주제 1", "반복적으로 등장한 주제 2", ...],
  "sensory_elements": ["인상 깊었던 공간과 의미 1", "인상 깊었던 공간과 의미 2", ...],
  "ai_feedback": "여행이 전하는 메시지와 의미"
}

응답은 반드시 위 형식의 JSON이어야 하며, 각 필드는 문자열 배열이나 문자열이어야 합니다.`
          }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const report = JSON.parse(response.data.choices[0].message.content);
    return report;
  } catch (error) {
    console.error('Error generating emotion report:', error);
    throw new Error('AI 감정 분석 리포트 생성에 실패했습니다.');
  }
}

export async function saveEmotionReportToDB(userId: string, sessionId: string, reportData: EmotionReport): Promise<void> {
  try {
    if (!sessionId) {
      console.error('sessionId가 없습니다. 감정 리포트 저장 불가');
      throw new Error('sessionId가 없습니다. 감정 리포트 저장 불가');
    }
    console.log('Saving emotion report for user:', userId, 'session:', sessionId);
    console.log('Report data:', reportData);

    // 1. Supabase 연결 상태 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('인증 세션을 가져오는데 실패했습니다.');
    }
    if (!session) {
      console.error('No active session found');
      throw new Error('로그인이 필요합니다.');
    }

    // 2. update 시도
    const { data: updateData, error: updateError } = await supabase
      .from('emotion_reports')
      .update({
        user_id: userId,
        report_json: reportData,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select();

    if (updateError) {
      console.error('Supabase updateError:', updateError, {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      });
      throw updateError;
    }

    if (!updateData || updateData.length === 0) {
      // update된 row가 없으면 insert 시도
      const { error: insertError } = await supabase
      .from('emotion_reports')
        .insert([{
          user_id: userId,
          session_id: sessionId,
          report_json: reportData,
          created_at: new Date().toISOString()
        }]);
      if (insertError) {
        console.error('Supabase insertError:', insertError, {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw insertError;
      }
      console.log('Successfully inserted emotion report for session:', sessionId);
    } else {
      console.log('Successfully updated emotion report for session:', sessionId);
    }
  } catch (error) {
    console.error('Error saving emotion report:', error, {
      userId,
      sessionId,
      reportData
    });
    // 예상치 못한 에러가 발생한 경우에도 임시로 로컬 스토리지에 저장
    const reports = JSON.parse(localStorage.getItem('emotion_reports') || '[]');
    reports.push({
      user_id: userId,
      session_id: sessionId,
      report_json: reportData,
      created_at: new Date().toISOString()
    });
    localStorage.setItem('emotion_reports', JSON.stringify(reports));
    console.log('Saved report to localStorage due to unexpected error');
  }
} 