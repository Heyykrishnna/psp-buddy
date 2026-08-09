"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RocketIcon, ReloadIcon, CheckCircledIcon, LockClosedIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, getAccessToken } from "@/lib/api";

type LevelSummary = {
  id: string;
  key: string;
  title: string;
  xpReward: number;
  passPercent: number;
  completedCount: number;
  studentCount: number;
};

type TeacherLearningPath = {
  className: string;
  chapters: Array<{ id: string; key: string; title: string; color: string; levels: LevelSummary[] }>;
  students: Array<{ studentId: string; name: string; avatarUrl?: string; totalXp: number; levels: Array<{ id: string; title: string; status: string; bestPercent: number }> }>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function TeacherLearningPathPage() {
  const { user } = useAuth();
  const [data, setData] = useState<TeacherLearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await apiFetch<TeacherLearningPath>("/learning-path/teacher/overview?className=1st%20Sem");
      setData(next);
      setLastSynced(new Date());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || typeof window === "undefined") return;
    const wsUrl = `${API_BASE_URL.replace(/^http/, "ws")}/ws?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(user?.id || "teacher")}`;
    const socket = new WebSocket(wsUrl);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === "LEVEL_PROGRESS_UPDATED") load();
      } catch {}
    };
    return () => socket.close();
  }, [load, user?.id]);

  const allLevels = data?.chapters.flatMap((chapter) => chapter.levels) || [];
  const totalCompletions = allLevels.reduce((sum, level) => sum + level.completedCount, 0);
  const totalPossible = allLevels.reduce((sum, level) => sum + level.studentCount, 0);

  return (
    <main className="min-h-screen bg-[#F5F7FC] text-[#17213B] px-6 py-8 md:px-12">
      <div className="max-w-6xl mx-auto space-y-7">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCE3EF] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#7C5CFC] text-white flex items-center justify-center"><RocketIcon className="w-5 h-5" /></div>
            <div><p className="text-[10px] uppercase tracking-[0.18em] text-[#7B87A0] font-bold">Teacher portal · synced map</p><h1 className="text-3xl font-black tracking-tight">Learning Path</h1></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#DCE3EF] px-3 py-2 text-xs font-bold text-[#6D7890]"><span className="w-2 h-2 rounded-full bg-emerald-400" />{lastSynced ? `Synced ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Syncing"}</span>
            <button onClick={load} className="inline-flex items-center gap-2 rounded-xl bg-[#17213B] text-white px-4 py-2.5 text-xs font-bold cursor-pointer"><ReloadIcon className="w-3.5 h-3.5" />Refresh</button>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#E2E8F2] p-5"><p className="text-xs text-[#7B87A0] font-bold">Chapters</p><p className="text-3xl font-black mt-2">{data?.chapters.length || 0}</p></div>
          <div className="bg-white rounded-2xl border border-[#E2E8F2] p-5"><p className="text-xs text-[#7B87A0] font-bold">Levels</p><p className="text-3xl font-black mt-2">{allLevels.length}</p></div>
          <div className="bg-white rounded-2xl border border-[#E2E8F2] p-5"><p className="text-xs text-[#7B87A0] font-bold">Students</p><p className="text-3xl font-black mt-2">{data?.students.length || 0}</p></div>
          <div className="bg-[#7C5CFC] text-white rounded-2xl p-5"><p className="text-xs text-white/70 font-bold">Level clears</p><p className="text-3xl font-black mt-2">{totalCompletions}<span className="text-base text-white/70">/{totalPossible}</span></p></div>
        </section>

        {loading ? <div className="py-24 text-center text-sm text-[#7B87A0]">Loading live learning path…</div> : !data ? <div className="py-24 text-center text-sm text-[#7B87A0]">The learning path is unavailable right now.</div> : <>
          <section className="space-y-4">
            {data.chapters.map((chapter) => <div key={chapter.id} className="bg-white rounded-3xl border border-[#E2E8F2] overflow-hidden">
              <div className="p-5 flex items-center gap-3" style={{ backgroundColor: chapter.color }}><div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center text-white font-black">✦</div><div><p className="text-[10px] uppercase tracking-[0.16em] text-white/70 font-bold">Chapter</p><h2 className="text-xl text-white font-black">{chapter.title}</h2></div></div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">{chapter.levels.map((level) => <div key={level.id} className="rounded-2xl bg-[#F7F9FC] border border-[#E6EBF4] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.14em] text-[#7B87A0] font-bold">Level</p><h3 className="font-black mt-1">{level.title}</h3></div><span className="rounded-full bg-[#FFF1C8] text-[#9A6A00] px-2.5 py-1 text-[10px] font-black">{level.xpReward} XP</span></div><div className="mt-4 flex items-center justify-between text-xs font-bold text-[#7B87A0]"><span>{level.completedCount}/{level.studentCount} cleared</span><span>{level.passPercent}% required</span></div><div className="h-2 bg-[#E6EBF4] rounded-full mt-2 overflow-hidden"><div className="h-full rounded-full bg-[#62D39A]" style={{ width: `${level.studentCount ? (level.completedCount / level.studentCount) * 100 : 0}%` }} /></div></div>)}</div>
            </div>)}
          </section>
          <section className="bg-white rounded-3xl border border-[#E2E8F2] p-5"><div className="flex items-center justify-between mb-4"><div><p className="text-[10px] uppercase tracking-[0.16em] text-[#7B87A0] font-bold">Student progress</p><h2 className="text-xl font-black mt-1">Who is moving through the map?</h2></div><CheckCircledIcon className="w-5 h-5 text-emerald-500" /></div><div className="divide-y divide-[#EEF1F6]">{data.students.map((student) => <div key={student.studentId} className="py-3 flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-[#E8F8FF] flex items-center justify-center text-sm font-black text-[#168FBF]">{student.name.charAt(0)}</div><div className="flex-1 min-w-0"><div className="flex justify-between gap-3"><p className="text-sm font-black truncate">{student.name}</p><p className="text-xs font-black text-[#7C5CFC]">{student.totalXp} XP</p></div><div className="flex flex-wrap gap-1.5 mt-2">{student.levels.map((level) => <span key={level.id} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${level.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : level.status === "LOCKED" ? "bg-zinc-100 text-zinc-500" : "bg-blue-50 text-blue-700"}`}>{level.status === "COMPLETED" ? <CheckCircledIcon className="w-3 h-3" /> : level.status === "LOCKED" ? <LockClosedIcon className="w-3 h-3" /> : null}{level.title} · {level.bestPercent}%</span>)}</div></div></div>)}</div></section>
        </>}
      </div>
    </main>
  );
}

