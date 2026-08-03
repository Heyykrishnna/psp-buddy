'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, checkAuth } = useAuth();

  useEffect(() => {
    async function init() {
      await checkAuth();
      if (user) {
        if (!user.isOnboarded) {
          router.replace('/onboarding');
        } else {
          router.replace('/dashboard');
        }
      } else {
        router.replace('/auth');
      }
    }
    init();
  }, [checkAuth, user, router]);

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center font-sans">
      <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Completing Authentication & Syncing Session...</p>
    </div>
  );
}
