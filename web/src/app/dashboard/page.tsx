'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SyncStatusBadge } from '../../components/SyncStatusBadge';
import { LeaderboardWidget } from '../../components/LeaderboardWidget';
import { LeaderboardEntryDTO } from '../../types';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [isConnected] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [xp, setXp] = useState(1250);
  const [streak] = useState(5);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDTO[]>([
    { id: '1', studentId: 'demo-1', studentName: 'Alex Johnson', rank: 1, totalXp: 2450 },
    { id: '2', studentId: user?.id || 'current-user', studentName: `${user?.firstName || 'You'} (${user?.role || 'STUDENT'})`, rank: 2, totalXp: 1250 },
    { id: '3', studentId: 'demo-3', studentName: 'Sophia Lee', rank: 3, totalXp: 980 },
    { id: '4', studentId: 'demo-4', studentName: 'Marcus Vance', rank: 4, totalXp: 850 },
    { id: '5', studentId: 'demo-5', studentName: 'Emily Chen', rank: 5, totalXp: 720 },
  ]);

  useEffect(() => {
    if (user) {
      setLeaderboard((prev) =>
        prev.map((entry) =>
          entry.studentId === (user.id || 'current-user')
            ? { ...entry, studentName: `${user.firstName} ${user.lastName} (${user.role})` }
            : entry
        )
      );
    }
  }, [user]);

  const simulateEarnXP = () => {
    const added = 50;
    const newXp = xp + added;
    setXp(newXp);
    setLastSyncedAt(new Date());

    setLeaderboard((prev) =>
      prev
        .map((entry) =>
          entry.studentId === (user?.id || 'current-user') ? { ...entry, totalXp: newXp } : entry
        )
        .sort((a, b) => b.totalXp - a.totalXp)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
    );
  };

  return (
    <main className="min-h-screen bg-[#B8C6B6] text-[#121316] font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Navbar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#121316]/15">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#121316] text-white flex items-center justify-center font-extrabold text-sm shadow-md">
              PSP
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">PSP LUMORA DASHBOARD</h1>
              <p className="text-xs font-semibold text-[#4A5248]">
                WELCOME BACK, <span className="text-[#5451FF] font-bold">{user?.firstName} {user?.lastName}</span> ({user?.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SyncStatusBadge isConnected={isConnected} lastSyncedAt={lastSyncedAt} />
            <button
              onClick={() => logout()}
              className="px-4 py-2 bg-[#121316] hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-full transition-all shadow-md cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Role Banner Card */}
        <div className="bg-[#5451FF] text-white rounded-[32px] p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-mono font-bold uppercase tracking-wider">
                ROLE: {user?.role}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider border border-emerald-400/30">
                AUTHENTICATED & SYNCED
              </span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight mt-3">
              {user?.role === 'STUDENT'
                ? 'Student Learning & Assessment Portal'
                : user?.role === 'TEACHER'
                ? 'Teacher Assessment & Grading Desk'
                : 'System Administration Console'}
            </h2>
          </div>

          <div className="text-xs font-mono text-white/90 bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
            User ID: {user?.id}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Stats Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#121316] text-white rounded-[32px] p-6 shadow-2xl border border-white/10 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                <span>⚡</span> REAL-TIME XP & PROGRESS
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">TOTAL XP</span>
                  <p className="text-3xl font-black text-[#F4C463] mt-1">{xp} XP</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">STREAK</span>
                  <p className="text-3xl font-black text-[#FF5745] mt-1">🔥 {streak} DAYS</p>
                </div>
              </div>
            </div>

            <button
              onClick={simulateEarnXP}
              className="w-full py-4 px-6 bg-[#FF5745] hover:bg-[#E84635] text-white font-black text-xs uppercase tracking-wider rounded-full transition-all shadow-xl flex items-center justify-between group cursor-pointer"
            >
              <span>+ SOLVE PRACTICE QUIZ (+50 XP)</span>
              <span className="w-8 h-8 rounded-full bg-white text-[#121316] flex items-center justify-center group-hover:translate-x-1 transition-transform text-xs font-bold">
                ↗
              </span>
            </button>
          </div>

          {/* Leaderboard Card (7 cols) */}
          <div className="lg:col-span-7 bg-[#121316] text-white rounded-[32px] p-6 shadow-2xl border border-white/10">
            <LeaderboardWidget entries={leaderboard} currentUserId={user?.id || 'current-user'} />
          </div>

        </div>
      </div>
    </main>
  );
}
