import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL에서 토큰 관련 파라미터 제거
  const cleanUrl = new URL(requestUrl.origin);
  
  // 홈페이지로 리다이렉트
  return NextResponse.redirect(cleanUrl.toString());
} 