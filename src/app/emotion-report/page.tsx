'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import SimpleNavigation from '@/components/SimpleNavigation';
import { EmotionReport, generateEmotionReport, saveEmotionReportToDB } from '@/lib/emotion-report';

export default function DeprecatedEmotionReportPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-xl shadow p-8 text-center">
        <SimpleNavigation />
        <h1 className="text-2xl font-bold mb-4">잘못된 접근입니다</h1>
        <p className="text-gray-600 mb-6">
          감정 리포트는 <span className="font-mono bg-gray-100 px-2 py-1 rounded">/emotion-report/[sessionId]</span> 경로로만 접근할 수 있습니다.<br />
          여행 기록을 완료한 후, 해당 기록의 감정 리포트 버튼을 통해 이동해 주세요.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
} 