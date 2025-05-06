import { NextResponse } from 'next/server';
import OpenAI from 'openai';

if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
  throw new Error('NEXT_PUBLIC_OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const journeyData = await request.json();

    const prompt = `
여행자의 감정 여정을 분석해주세요. 아래는 여행 전/중/후의 데이터입니다:

[여행 전]
- 신체 상태: ${journeyData.preJourney.physicalCondition}
- 기분: ${journeyData.preJourney.currentMood}
- 기대하는 것: ${journeyData.preJourney.moodDetails}
- 욕심 리스트: ${journeyData.preJourney.desires}

[여행 중]
- 집중한 대상: ${journeyData.duringJourney.focusObject}
- 집중한 이유: ${journeyData.duringJourney.focusReason}
- 떠오른 감정/이미지: ${journeyData.duringJourney.emotions}
- 추가 탐구 의향: ${journeyData.duringJourney.exploration}

[여행 후]
- 출발 전 상태: ${journeyData.postJourney.beforeState}
- 여행 중 상태: ${journeyData.postJourney.duringState}
- 돌아온 후 상태: ${journeyData.postJourney.afterState}
- 가장 오래 머문 공간: ${journeyData.postJourney.longestPlace}
- 가장 오래 머문 감정: ${journeyData.postJourney.longestEmotion}
- 여행이 준 메시지: ${journeyData.postJourney.journeyMessage}

위 데이터를 바탕으로 다음 형식으로 분석해주세요:

1. 감정의 흐름: 여행 전/중/후의 감정 변화를 서술적으로 설명
2. 반복적으로 등장한 감정이나 주제 (키워드로 3개)
3. 인상 깊었던 공간과 그 의미 (키워드로 2개)
4. 여행이 전하는 메시지 (따뜻한 톤으로 2-3문장)

응답은 JSON 형식으로 해주세요:
{
  "emotion_flow": "string",
  "recurring_themes": ["string", "string", "string"],
  "sensory_elements": ["string", "string"],
  "ai_feedback": "string"
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;
    return NextResponse.json(JSON.parse(response || '{}'));
  } catch (error) {
    console.error('Error generating emotion report:', error);
    return NextResponse.json(
      { error: 'Failed to generate emotion report' },
      { status: 500 }
    );
  }
} 