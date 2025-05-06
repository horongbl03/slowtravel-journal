import axios from 'axios';

interface JourneyData {
  preJourney: {
    physicalCondition: string;
    currentMood: string;
    moodDetails: string;
    desires: string;
  };
  duringJourney: {
    focusObject: string;
    focusReason: string;
    emotions: string[];
    exploration: string;
  };
  postJourney: {
    beforeState: string;
    duringState: string;
    afterState: string;
    longestPlace: string;
    longestEmotion: string;
    journeyMessage: string;
  };
}

export async function generateEmotionReport(data: JourneyData) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.');
    }

    const prompt = `
당신은 여행자의 감정을 분석하는 전문가입니다. 다음 여행 기록을 바탕으로 감정 분석 리포트를 작성해주세요.

[여행 전 상태]
- 신체 상태: ${data.preJourney.physicalCondition}
- 현재 감정: ${data.preJourney.currentMood}
- 감정 상세: ${data.preJourney.moodDetails}
- 바라는 점: ${data.preJourney.desires}

[여행 중 기록]
- 주목한 대상: ${data.duringJourney.focusObject}
- 주목한 이유: ${data.duringJourney.focusReason}
- 감정: ${data.duringJourney.emotions.join(', ')}

[여행 후 기록]
- 출발 전: ${data.postJourney.beforeState}
- 여행 중: ${data.postJourney.duringState}
- 돌아온 지금: ${data.postJourney.afterState}
- 가장 오래 머문 장소: ${data.postJourney.longestPlace}
- 가장 오래 느낀 감정: ${data.postJourney.longestEmotion}
- 여행 메시지: ${data.postJourney.journeyMessage}

다음 형식으로 JSON 응답을 제공해주세요:
{
  "emotion_flow": "여행 전/중/후의 감정 변화를 분석한 내용",
  "recurring_themes": ["반복적으로 등장한 주제 1", "반복적으로 등장한 주제 2", ...],
  "sensory_elements": ["인상 깊었던 공간과 의미 1", "인상 깊었던 공간과 의미 2", ...],
  "ai_feedback": "여행이 전하는 메시지와 의미"
}

응답은 반드시 위 형식의 JSON이어야 하며, 각 필드는 문자열 배열이나 문자열이어야 합니다.`;

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
            content: prompt
          }
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

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('AI 응답을 받지 못했습니다.');
    }
    return JSON.parse(content);
  } catch (error: any) {
    if (error.response) {
      console.error('OpenAI API error response:', error.response.data);
      throw new Error(error.response.data?.error?.message || 'OpenAI API 호출 실패');
    }
    if (error.message) {
      console.error('OpenAI API error message:', error.message);
      throw new Error(error.message);
    }
    console.error('Error generating emotion report:', error);
    throw new Error('AI 감정 분석 리포트 생성에 실패했습니다.');
  }
} 