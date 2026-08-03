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
  const [aiMessage, setAiMessage] = useState(
    'PSP LUMORA authentication system is active. Select your login method or use a quick role preset to proceed.'
  );

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
      setError(err.message || 'Authentication failed. Check your credentials.');
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
    <div className="min-h-screen bg-[#B8C6B6] text-[#121316] font-sans p-4 sm:p-6 md:p-8 flex flex-col justify-between selection:bg-[#5451FF] selection:text-white">
      {/* Top System Bar */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#121316] text-white flex items-center justify-center font-extrabold text-sm shadow-md">
            PSP
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight uppercase">PSP LUMORA</h1>
            <p className="text-xs font-semibold text-[#4A5248]">SYNCHRONIZED AUTHENTICATION GATEWAY</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121316] text-white text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            BACKEND: PORT 4000
          </span>
          <div className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#121316]/10 text-xs font-bold text-[#121316]">
            NESTJS + PRISMA
          </div>
        </div>
      </header>

      {/* Main Responsive Layout Grid */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-24">
        
        {/* Left Column: AI Operations & Security Metrics (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: AI OPERATIONS LEAD (Charcoal Card matching reference image) */}
          <div className="bg-[#121316] text-white rounded-[32px] p-6 shadow-2xl relative overflow-hidden border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-lg">
                  🤖
                </div>
                <div>
                  <h2 className="text-sm font-extrabold tracking-wider uppercase text-white">AI OPERATIONS LEAD</h2>
                  <p className="text-[11px] text-zinc-400 font-mono">AUTH BOT v2.4</p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer">
                ↗
              </div>
            </div>

            {/* Chat Bubble */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 mb-5 leading-relaxed text-sm text-zinc-200">
              <p className="font-sans">
                {aiMessage}
              </p>
            </div>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                onClick={() => loginAsDemo('STUDENT')}
                className="px-3.5 py-2 rounded-full bg-[#5451FF] hover:bg-[#433FE6] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <span>🎓</span> Student Quick Access
              </button>
              <button
                type="button"
                onClick={() => loginAsDemo('TEACHER')}
                className="px-3.5 py-2 rounded-full bg-[#FF5745] hover:bg-[#E84635] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <span>👩‍🏫</span> Teacher Desk
              </button>
              <button
                type="button"
                onClick={() => loginAsDemo('ADMIN')}
                className="px-3.5 py-2 rounded-full bg-[#F4C463] text-[#121316] font-bold text-xs hover:bg-[#E5B552] transition-all flex items-center gap-1.5"
              >
                <span>🛡️</span> Admin Console
              </button>
            </div>

            {/* Bottom Bar Input */}
            <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 rounded-full p-2">
              <button 
                type="button" 
                onClick={() => setAiMessage('Google OAuth Token validation ready. Press "Continue with Google" on the right card.')}
                className="w-8 h-8 rounded-full bg-[#FF5745] text-white flex items-center justify-center text-lg font-bold hover:scale-105 transition-transform"
              >
                +
              </button>
              <input
                type="text"
                readOnly
                value="Ask AI Assistant to assist with authentication..."
                className="bg-transparent text-xs text-zinc-400 w-full focus:outline-none px-2 cursor-pointer"
                onClick={() => setAiMessage('Fill out the email and password fields on the right card to create or access your account.')}
              />
              <div className="flex items-center gap-1 pr-3 text-zinc-500 font-mono text-xs">
                <span>|||</span>
              </div>
            </div>
          </div>

          {/* Card 2: REVENUE & SECURITY METRICS (Coral Red Card matching reference image) */}
          <div className="bg-[#FF5745] text-white rounded-[32px] p-6 shadow-2xl relative overflow-hidden border border-black/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold">←</span>
                <h3 className="text-lg font-extrabold uppercase tracking-wider">SECURITY & SYNC</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">JWT AUTH ∨</span>
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">PASSPORT ∨</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider opacity-80">ACTIVE SESSIONS</span>
                  <span className="px-2 py-0.5 rounded-full bg-black/30 text-[10px] font-bold">+7.5%</span>
                </div>
                <p className="text-2xl font-black font-mono">$156,900.67</p>
                <p className="text-[10px] opacity-75 mt-1 font-sans">Synced across 12 nodes</p>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider opacity-80">TOKEN EXPIRY</span>
                  <span className="px-2 py-0.5 rounded-full bg-black/30 text-[10px] font-bold">+2.4%</span>
                </div>
                <p className="text-2xl font-black font-mono">15 mins</p>
                <p className="text-[10px] opacity-75 mt-1 font-sans">Auto-refresh strategy</p>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="mt-6 flex items-end justify-between gap-2 h-20 pt-4 border-t border-white/15">
              {['Mon', 'Tue', 'Wen', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <div key={day} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`w-full rounded-t-lg ${idx === 3 ? 'bg-[#121316]' : 'bg-white/30'}`}
                    style={{ height: `${30 + (idx * 9) % 50}px` }}
                  />
                  <span className={`text-[10px] font-mono font-bold ${idx === 3 ? 'text-black bg-white px-1.5 py-0.5 rounded-full' : 'opacity-80'}`}>
                    {day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Main Authentication Card (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-[#5451FF] text-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
            
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/15">
              <div>
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-mono font-bold uppercase tracking-widest text-white mb-2 inline-block">
                  AUTHENTICATION GATEWAY
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                  {isSignUp ? 'REGISTER ACCOUNT' : 'USER SIGN IN'}
                </h2>
              </div>

              {/* Toggle Pills */}
              <div className="bg-[#3E3BE0] p-1.5 rounded-full flex items-center gap-1 border border-white/10 self-stretch sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                  }}
                  className={`flex-1 sm:flex-none px-5 py-2 rounded-full text-xs font-extrabold uppercase transition-all ${
                    !isSignUp ? 'bg-white text-[#5451FF] shadow-lg' : 'text-white hover:text-white/80'
                  }`}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                  }}
                  className={`flex-1 sm:flex-none px-5 py-2 rounded-full text-xs font-extrabold uppercase transition-all ${
                    isSignUp ? 'bg-white text-[#5451FF] shadow-lg' : 'text-white hover:text-white/80'
                  }`}
                >
                  SIGN UP
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-[#FF5745] text-white text-xs font-bold flex items-center justify-between shadow-lg">
                <span>⚠️ {error}</span>
                <button onClick={() => setError('')} className="text-white text-base">✕</button>
              </div>
            )}

            {/* Google OAuth Pill Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-4 px-6 rounded-full bg-white text-[#121316] font-extrabold text-sm hover:bg-zinc-100 transition-all flex items-center justify-between shadow-xl disabled:opacity-50 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
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
                  <span>CONTINUE WITH GOOGLE AUTH</span>
                </div>
                <span className="w-8 h-8 rounded-full bg-[#121316] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform text-xs">
                  ↗
                </span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-white/20 w-full" />
              <span className="bg-[#5451FF] px-4 text-xs font-mono font-bold text-white/80 uppercase tracking-widest absolute">
                OR EMAIL AUTHENTICATION
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {isSignUp && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/90 mb-1.5">
                        FIRST NAME
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Hanna"
                        className="w-full px-4 py-3.5 bg-[#3E3BE0] border border-white/20 rounded-2xl text-white placeholder-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white/90 mb-1.5">
                        LAST NAME
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Vance"
                        className="w-full px-4 py-3.5 bg-[#3E3BE0] border border-white/20 rounded-2xl text-white placeholder-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/90 mb-1.5">
                      SELECT PLATFORM ROLE
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['STUDENT', 'TEACHER', 'ADMIN'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSelectedRole(r)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-extrabold uppercase transition-all border ${
                            selectedRole === r
                              ? 'bg-[#121316] text-white border-white'
                              : 'bg-[#3E3BE0] text-white/80 border-white/10 hover:bg-white/10'
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
                <label className="block text-xs font-bold uppercase tracking-wider text-white/90 mb-1.5">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hanna@lumora.edu"
                  className="w-full px-4 py-3.5 bg-[#3E3BE0] border border-white/20 rounded-2xl text-white placeholder-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/90 mb-1.5">
                  PASSWORD
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3.5 bg-[#3E3BE0] border border-white/20 rounded-2xl text-white placeholder-white/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-[#121316] hover:bg-black text-white font-black text-sm uppercase tracking-wider rounded-full transition-all flex items-center justify-between shadow-2xl disabled:opacity-50 group cursor-pointer"
                >
                  <span>{loading ? 'AUTHENTICATING...' : isSignUp ? 'CREATE ACCOUNT & ONBOARD' : 'SIGN IN TO DASHBOARD'}</span>
                  <span className="w-8 h-8 rounded-full bg-[#FF5745] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform text-xs">
                    ↗
                  </span>
                </button>
              </div>
            </form>

            {/* Bottom Status Banner */}
            <div className="mt-8 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-white/80">
              <span>
                {isSignUp ? 'Already registered?' : 'New to PSP LUMORA?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="underline font-bold text-white hover:text-amber-300 ml-1 uppercase"
                >
                  {isSignUp ? 'Sign In Here' : 'Create an Account'}
                </button>
              </span>

              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>NESTJS API SYNCED</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Floating App Navigation Dock (matching reference image bottom dock) */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#121316]/95 backdrop-blur-lg text-white border border-white/15 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6">
          <button 
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              !isSignUp ? 'bg-white text-[#121316]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>🏠</span>
            <span>AUTH</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              isSignUp ? 'bg-white text-[#121316]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>📈</span>
            <span>REGISTER</span>
          </button>

          <button 
            type="button"
            onClick={() => loginAsDemo('STUDENT')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-all"
          >
            <span>👜</span>
            <span>DEMO STUDENT</span>
          </button>

          <button 
            type="button"
            onClick={() => loginAsDemo('TEACHER')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-all"
          >
            <span>⚙️</span>
            <span>TEACHER</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
