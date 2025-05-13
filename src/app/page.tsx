'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Google:', error);
      alert('구글 로그인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.refresh();
    } catch (error: unknown) {
      console.error('로그아웃 중 오류가 발생했습니다:', error instanceof Error ? error.message : '알 수 없는 오류');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto min-h-screen max-w-lg bg-white flex items-center justify-center">
        <main className="w-full px-4">
          <div className="text-center space-y-6 max-w-md mx-auto">
            <h1 className="text-4xl font-medium tracking-tight">
              거북이 아트여행
            </h1>

            <div className="animate-fade-in">
              <p className="text-lg leading-relaxed">
                내 마음의 속도로 걷는 감정 산책
              </p>
            </div>

            <div className="space-y-4 pt-6">
              {!user ? (
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google로 시작하기
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:gap-4 justify-center">
                  <Link
                    href="/pre-journey"
                      className="flex-1 py-3 px-4 bg-[#2C2C2C] text-white rounded-lg hover:bg-[#3C3C3C] transition-colors text-center"
                  >
                    여행 시작하기
                  </Link>
                  </div>
                  <Link
                    href="/archive"
                    className="block text-center text-gray-500 hover:text-gray-700 transition-colors border border-gray-300 rounded-lg py-2 mt-3"
                  >
                    내 기록 보기
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors mt-5 flex items-center justify-center gap-1"
                  >
                    <svg 
                      className="w-3 h-3" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
