'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { SyncStatusBadge } from '../../components/SyncStatusBadge';
import { LeaderboardWidget } from '../../components/LeaderboardWidget';
import { LeaderboardEntryDTO, AssessmentDTO } from '../../types';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [isConnected] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [xp, setXp] = useState(1250);
  const [streak] = useState(5);

  const [assessments, setAssessments] = useState<AssessmentDTO[]>([
    {
      id: 'demo-asm-1',
      title: 'Algorithm Complexity & Data Structures Quiz',
      description: 'Mid-term evaluation covering Big-O analysis, sorting algorithms, and boolean logic.',
      className: 'Class 10-A',
      topic: 'Computer Science',
      assessmentType: 'QUIZ' as any,
      totalMarks: 25,
      passingMarks: 15,
      durationMinutes: 30,
      hasNegativeMarking: true,
      negativeMarkValue: 0.25,
      isPublished: true,
      _count: { questions: 3, attempts: 12 },
    },
  ]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDTO[]>([
    { id: '1', studentId: 'demo-1', studentName: 'Alex Johnson', rank: 1, totalXp: 2450 },
    { id: '2', studentId: user?.id || 'current-user', studentName: `${user?.firstName || 'You'} (${String(user?.role || 'STUDENT')})`, rank: 2, totalXp: 1250 },
    { id: '3', studentId: 'demo-3', studentName: 'Sophia Lee', rank: 3, totalXp: 980 },
    { id: '4', studentId: 'demo-4', studentName: 'Marcus Vance', rank: 4, totalXp: 850 },
    { id: '5', studentId: 'demo-5', studentName: 'Emily Chen', rank: 5, totalXp: 720 },
  ]);

  useEffect(() => {
    async function loadAssessments() {
      try {
        const data = await apiFetch<AssessmentDTO[]>('/assessments');
        if (data && data.length > 0) {
          setAssessments(data);
        }
      } catch {}
    }
    loadAssessments();
  }, []);

  useEffect(() => {
    if (user) {
      setLeaderboard((prev) =>
        prev.map((entry) =>
          entry.studentId === (user.id || 'current-user')
            ? { ...entry, studentName: `${user.firstName} ${user.lastName} (${String(user.role)})` }
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
    <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans p-6 md:p-12 selection:bg-[#111111] selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Minimal Navbar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✳</span>
            <div>
              <h1 className="font-serif text-2xl font-normal text-[#111111]">PSP Lumora Dashboard</h1>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">
                Welcome, <span className="font-semibold text-[#111111]">{user?.firstName} {user?.lastName}</span> ({user?.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SyncStatusBadge isConnected={isConnected} lastSyncedAt={lastSyncedAt} />
            <button
              onClick={() => logout()}
              className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all cursor-pointer shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Role Banner Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-[#111111] text-white text-[10px] font-mono uppercase tracking-wider font-semibold">
                ROLE: {String(user?.role)}
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-mono uppercase tracking-wider border border-emerald-200">
                AUTHENTICATED & SYNCED
              </span>
            </div>
            <h2 className="font-serif text-2xl font-normal text-[#111111] mt-3">
              {user?.role === 'STUDENT'
                ? 'Student Learning Portal'
                : user?.role === 'TEACHER'
                ? 'Teacher Assessment Desk'
                : 'System Administration Console'}
            </h2>
          </div>

          {user?.role === 'TEACHER' || user?.role === 'ADMIN' ? (
            <button
              onClick={() => router.push('/teacher/assessments/new')}
              className="px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all cursor-pointer shadow-sm"
            >
              + Create Assessment
            </button>
          ) : (
            <div className="text-xs font-mono text-zinc-500 bg-[#F4F4F6] px-3.5 py-2 rounded-md border border-zinc-200">
              User ID: {user?.id}
            </div>
          )}
        </div>

        {/* ASSESSMENT ENGINE SECTION */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="font-serif text-xl font-normal text-[#111111]">
                {user?.role === 'TEACHER' ? 'Managed Class Assessments' : 'Active Class Assessments'}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Real-time assessments with PostgreSQL autosave & topic analysis</p>
            </div>

            {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
              <button
                onClick={() => router.push('/teacher/assessments/new')}
                className="px-4 py-2 border border-zinc-300 hover:bg-zinc-100 text-zinc-800 text-xs font-medium rounded-md"
              >
                + Add Questions & Configure
              </button>
            )}
          </div>

          <div className="space-y-3">
            {assessments.map((asm) => (
              <div
                key={asm.id}
                className="p-5 bg-[#F4F4F6] rounded-lg border border-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                      {asm.className || 'Class 10-A'}
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 text-[10px] font-mono rounded">
                      {asm.assessmentType}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">• {asm.durationMinutes} mins</span>
                    {asm.hasNegativeMarking && (
                      <span className="text-xs font-mono text-red-600 font-semibold">• Negative Marking (-{asm.negativeMarkValue})</span>
                    )}
                  </div>
                  <h4 className="text-base font-medium text-[#111111]">{asm.title}</h4>
                  <p className="text-xs text-zinc-500">{asm.description}</p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <button
                    onClick={() => router.push(`/student/assessments/${asm.id}`)}
                    className="px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all cursor-pointer shadow-sm"
                  >
                    Start Attempt →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Card 1: Stats (5 cols) */}
          <div className="md:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-xl font-normal text-[#111111] mb-6 flex items-center gap-2">
                <span>⚡</span> Real-time XP & Progress
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#F4F4F6] rounded-lg p-4">
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase">TOTAL XP</span>
                  <p className="text-3xl font-serif text-[#111111] mt-1">{xp} XP</p>
                </div>

                <div className="bg-[#F4F4F6] rounded-lg p-4">
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase">STREAK</span>
                  <p className="text-3xl font-serif text-[#111111] mt-1">🔥 {streak} Days</p>
                </div>
              </div>
            </div>

            <button
              onClick={simulateEarnXP}
              className="w-full py-3.5 px-4 bg-[#111111] hover:bg-black text-white font-medium text-xs rounded-md transition-all cursor-pointer shadow-sm"
            >
              + Solve Practice Quiz (+50 XP)
            </button>
          </div>

          {/* Card 2: Leaderboard (7 cols) */}
          <div className="md:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <LeaderboardWidget entries={leaderboard} currentUserId={user?.id || 'current-user'} />
          </div>

        </div>
      </div>
    </main>
  );
}
