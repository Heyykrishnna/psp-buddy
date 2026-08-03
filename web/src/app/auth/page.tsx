'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

export default function AuthPage() {
  const { login, loginWithGoogle, register, loginAsDemo } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await register(firstName, lastName, email, password, selectedRole);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const devGoogleIdToken = `google_token_${Date.now()}`;
      await loginWithGoogle(devGoogleIdToken, firstName || 'GoogleUser', lastName || 'PSP');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-[#111111] grid grid-cols-1 lg:grid-cols-12 selection:bg-[#111111] selection:text-white font-sans">
      
      {/* Left Column: Minimal Form Area (7 Columns) */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-2xl mx-auto w-full">
        
        {/* Top Brand Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✳</span>
            <span className="font-semibold text-lg tracking-tight text-[#111111]">PSP Lumora</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-500 font-mono">PORT 4000 SYNCED</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="my-auto py-6">
          
          {/* Editorial Serif Header matching reference image */}
          <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-[#111111] mb-2">
            {isSignUp ? 'Create an Account' : 'Welcome Back !'}
          </h1>
          
          <p className="text-xs text-zinc-500 mb-8">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-[#111111] font-semibold underline underline-offset-4 hover:opacity-75 transition-opacity ml-1"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isSignUp && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-600 font-medium mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-600 font-medium mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-600 font-medium mb-1.5">
                    Account Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['STUDENT', 'TEACHER', 'ADMIN'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className={`py-2 px-3 text-xs font-medium rounded-md transition-all border ${
                          selectedRole === r
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-zinc-600 font-medium mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-600 font-medium mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
              />
            </div>

            {/* Solid Minimal Black Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-[#111111] hover:bg-black text-white text-sm font-medium rounded-md transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Login'}
              </button>
            </div>
          </form>

          {/* Social Auth Options matching reference image */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-zinc-200 w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-mono text-zinc-400 tracking-wider absolute">
              OR
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="py-3 px-4 bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-700 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleGoogleSignIn()}
              disabled={loading}
              className="py-3 px-4 bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-700 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="font-bold">X</span>
              <span>Account</span>
            </button>
          </div>

          {/* Quick Demo Roles Bar */}
          <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-400 font-mono">QUICK DEMO:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loginAsDemo('STUDENT')}
                className="px-2.5 py-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium rounded transition-colors"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => loginAsDemo('TEACHER')}
                className="px-2.5 py-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium rounded transition-colors"
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => loginAsDemo('ADMIN')}
                className="px-2.5 py-1 text-[11px] bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium rounded transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Footer */}
        <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-6">
          <span>© 2026 PSP Lumora. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-zinc-700">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-700">Terms of Service</a>
          </div>
        </div>

      </div>

      {/* Right Column: High-Contrast Editorial Image Panel (5 Columns) */}
      <div className="hidden lg:flex lg:col-span-5 bg-[#111111] text-white p-12 flex-col justify-between relative overflow-hidden">
        
        {/* Subtle background grid pattern */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }} 
        />

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">EDITORIAL EDITION</span>
          <span className="px-2.5 py-1 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300">v0.1.0</span>
        </div>

        <div className="relative z-10 max-w-md my-auto space-y-6">
          <h2 className="font-serif text-4xl lg:text-5xl font-normal leading-tight text-zinc-100">
            Good things are on the way.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed font-sans">
            We are building a synchronized, minimal learning & assessment platform for modern students, teachers, and admins.
          </p>
          <div className="pt-4 flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-[#111111] flex items-center justify-center text-[10px] font-bold">A</div>
              <div className="w-8 h-8 rounded-full bg-zinc-600 border-2 border-[#111111] flex items-center justify-center text-[10px] font-bold">H</div>
              <div className="w-8 h-8 rounded-full bg-zinc-500 border-2 border-[#111111] flex items-center justify-center text-[10px] font-bold">M</div>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Join 1,200+ synchronized learners</span>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>PSP LUMORA ENGINE</span>
          <span>NESTJS + PRISMA</span>
        </div>

      </div>

    </div>
  );
}
