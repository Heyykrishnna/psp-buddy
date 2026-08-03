'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile, AuthResponse } from '../types';
import { apiFetch, setAccessToken, setRefreshToken, getAccessToken } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string, firstName?: string, lastName?: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  onboard: (data: { gradeLevel?: string; studentRegistrationNo?: string; employeeId?: string; department?: string; avatarUrl?: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/', '/auth', '/auth/callback'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('psp_user');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [verified, setVerified] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  const clearAuthState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('psp_user');
    }
  }, []);

  const updateUserCache = useCallback((userData: UserProfile | null) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      if (userData) {
        localStorage.setItem('psp_user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('psp_user');
      }
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      clearAuthState();
      setLoading(false);
      setVerified(true);
      return;
    }

    try {
      const res = await apiFetch<{ user: UserProfile }>('/auth/me');
      if (res?.user) {
        updateUserCache(res.user);
      } else {
        clearAuthState();
      }
    } catch (err) {
      clearAuthState();
    } finally {
      setLoading(false);
      setVerified(true);
    }
  }, [updateUserCache, clearAuthState]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Route protection logic
  useEffect(() => {
    if (!verified || loading) return;

    if (pathname.startsWith('/auth/callback')) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      route === '/' ? pathname === '/' : pathname.startsWith(route)
    );

    if (!user) {
      if (!isPublicRoute) {
        router.replace('/auth');
      }
    } else {
      if (!user.isOnboarded) {
        if (pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
      } else {
        if (pathname === '/auth' || pathname === '/onboarding') {
          router.replace('/dashboard');
        }
      }
    }
  }, [user, pathname, loading, verified, router]);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.tokens) {
      setAccessToken(res.tokens.accessToken);
      setRefreshToken(res.tokens.refreshToken);
    }
    updateUserCache(res.user);

    if (!res.user.isOnboarded) {
      router.push('/onboarding');
    } else {
      router.push('/dashboard');
    }
  };

  const loginWithGoogle = async (idToken: string, firstName?: string, lastName?: string) => {
    const res = await apiFetch<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, firstName, lastName }),
    });

    if (res.tokens) {
      setAccessToken(res.tokens.accessToken);
      setRefreshToken(res.tokens.refreshToken);
    }
    updateUserCache(res.user);

    if (!res.user.isOnboarded) {
      router.push('/onboarding');
    } else {
      router.push('/dashboard');
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    const res = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password }),
    });

    if (res.tokens) {
      setAccessToken(res.tokens.accessToken);
      setRefreshToken(res.tokens.refreshToken);
    }
    updateUserCache(res.user);
    router.push('/onboarding');
  };

  const onboard = async (data: { gradeLevel?: string; studentRegistrationNo?: string; employeeId?: string; department?: string; avatarUrl?: string }) => {
    const updatedUser = await apiFetch<UserProfile>('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    updateUserCache(updatedUser);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {}
    clearAuthState();
    router.push('/auth');
  };

  if (loading || !verified) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', fontFamily: 'sans-serif' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #27272a', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: '16px', fontSize: '14px', letterSpacing: '0.05em' }}>Authenticating PSP LUMORA...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, register, onboard, logout, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
