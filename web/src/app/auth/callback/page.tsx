'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { setAccessToken, setRefreshToken } from '@/lib/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    if (token) {
      setAccessToken(token);
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
      checkAuth().then(() => {
        router.replace('/dashboard');
      });
    } else {
      router.replace('/auth?error=no_token');
    }
  }, [searchParams, router, checkAuth]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 font-sans">
      <div className="w-8 h-8 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <p className="text-sm tracking-wide">Completing authentication...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 font-sans">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-sm tracking-wide">Loading callback...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
