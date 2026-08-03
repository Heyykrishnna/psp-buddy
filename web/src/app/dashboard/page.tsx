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
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Top Navbar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                PSP
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">PSP LUMORA Dashboard</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Welcome back, <span className="text-indigo-400 font-medium">{user?.firstName} {user?.lastName}</span> ({user?.email})
            </p>
          </div>

          <div className="flex items-center gap-4">
            <SyncStatusBadge isConnected={isConnected} lastSyncedAt={lastSyncedAt} />
            <button
              onClick={() => logout()}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium rounded-lg transition-all"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Role Banner */}
        <div className="mb-8 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-500/30">
                ROLE: {user?.role}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
                AUTHENTICATED & ONBOARDED
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-2">
              {user?.role === 'STUDENT'
                ? 'Student Learning Portal'
                : user?.role === 'TEACHER'
                ? 'Teacher Assessment & Grading Desk'
                : 'System Administration Console'}
            </h2>
          </div>

          <div className="text-xs text-zinc-400 font-mono bg-zinc-900/80 px-3 py-2 rounded-lg border border-zinc-800">
            User ID: {user?.id}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Gamified Stats */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>⚡</span> Real-time XP & Progress
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-950 border border-indigo-500/30 rounded-xl p-4">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Total XP</span>
                <p className="text-3xl font-extrabold text-indigo-400 mt-1">{xp} XP</p>
              </div>

              <div className="bg-zinc-950 border border-amber-500/30 rounded-xl p-4">
                <span className="text-xs text-zinc-400 font-semibold uppercase">Streak</span>
                <p className="text-3xl font-extrabold text-amber-400 mt-1">🔥 {streak} Days</p>
              </div>
            </div>

            <button
              onClick={simulateEarnXP}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              + Solve Practice Quiz (+50 XP)
            </button>
          </div>

          {/* Card 2: Leaderboard */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <LeaderboardWidget entries={leaderboard} currentUserId={user?.id || 'current-user'} />
          </div>
        </div>
      </div>
    </main>
  );
}
