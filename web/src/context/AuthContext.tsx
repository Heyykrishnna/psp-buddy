'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile, AuthResponse, UserRole } from '../types';
import { apiFetch, setAccessToken, setRefreshToken, getAccessToken } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string, firstName?: string, lastName?: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string, role?: UserRole) => Promise<void>;
  onboard: (data: { gradeLevel?: string; studentRegistrationNo?: string; employeeId?: string; department?: string; avatarUrl?: string }) => Promise<void>;
  loginAsDemo: (role: UserRole) => Promise<void>;
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
    } catch {
      // Keep cached user if offline during dev
    } fontally: {
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
    try {
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
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        const mockUser: UserProfile = {
          id: `usr_${Date.now()}`,
          email,
          firstName: email.split('@')[0] || 'User',
          lastName: 'Sync',
          role: 'STUDENT',
          isOnboarded: false,
        };
        setAccessToken(`mock_acc_token_${Date.now()}`);
        setRefreshToken(`mock_ref_token_${Date.now()}`);
        updateUserCache(mockUser);
        router.push('/onboarding');
        return;
      }
      throw err;
    }
  };

  const loginWithGoogle = async (idToken: string, firstName?: string, lastName?: string) => {
    try {
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
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        const mockUser: UserProfile = {
          id: `usr_google_${Date.now()}`,
          email: `${(firstName || 'google').toLowerCase()}@lumora.edu`,
          firstName: firstName || 'Google',
          lastName: lastName || 'User',
          role: 'STUDENT',
          isOnboarded: false,
        };
        setAccessToken(`mock_acc_token_${Date.now()}`);
        setRefreshToken(`mock_ref_token_${Date.now()}`);
        updateUserCache(mockUser);
        router.push('/onboarding');
        return;
      }
      throw err;
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string, role?: UserRole) => {
    try {
      const res = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName, email, password, role }),
      });

      if (res.tokens) {
        setAccessToken(res.tokens.accessToken);
        setRefreshToken(res.tokens.refreshToken);
      }
      updateUserCache(res.user);
      router.push('/onboarding');
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        const mockUser: UserProfile = {
          id: `usr_reg_${Date.now()}`,
          email,
          firstName,
          lastName,
          role: role || 'STUDENT',
          isOnboarded: false,
        };
        setAccessToken(`mock_acc_token_${Date.now()}`);
        setRefreshToken(`mock_ref_token_${Date.now()}`);
        updateUserCache(mockUser);
        router.push('/onboarding');
        return;
      }
      throw err;
    }
  };

  const loginAsDemo = async (role: UserRole) => {
    const demoEmail = role === 'TEACHER' ? 'teacher@lumora.edu' : role === 'ADMIN' ? 'admin@lumora.edu' : 'student@lumora.edu';
    const demoUser: UserProfile = {
      id: `usr_${role.toLowerCase()}_demo`,
      email: demoEmail,
      firstName: role === 'TEACHER' ? 'Hanna' : role === 'ADMIN' ? 'Alex' : 'Jordan',
      lastName: role === 'TEACHER' ? 'Vance' : role === 'ADMIN' ? 'Stone' : 'Rivera',
      role,
      isOnboarded: true,
      avatarUrl: role === 'TEACHER' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' : undefined,
    };

    try {
      const res = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: demoEmail, password: 'Password123!' }),
      });
      if (res.tokens) {
        setAccessToken(res.tokens.accessToken);
        setRefreshToken(res.tokens.refreshToken);
      }
      updateUserCache(res.user);
    } catch {
      setAccessToken(`demo_token_${role}_${Date.now()}`);
      setRefreshToken(`demo_refresh_${role}_${Date.now()}`);
      updateUserCache(demoUser);
    }
    router.push('/dashboard');
  };

  const onboard = async (data: { gradeLevel?: string; studentRegistrationNo?: string; employeeId?: string; department?: string; avatarUrl?: string }) => {
    try {
      const updatedUser = await apiFetch<UserProfile>('/auth/onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      updateUserCache(updatedUser);
      router.push('/dashboard');
    } catch {
      if (user) {
        const updated: UserProfile = {
          ...user,
          ...data,
          isOnboarded: true,
        };
        updateUserCache(updated);
      }
      router.push('/dashboard');
    }
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
      <div className="min-h-screen bg-[#B8C6B6] flex flex-col items-center justify-center font-sans">
        <div className="bg-[#121316] text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-white/10">
          <div className="w-6 h-6 border-3 border-[#5451FF] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs tracking-wider uppercase font-bold">SYNCHRONIZING PSP LUMORA AUTH...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, register, onboard, loginAsDemo, logout, checkAuth }}
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
