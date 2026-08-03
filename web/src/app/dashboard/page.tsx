"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { LeaderboardWidget } from "../../components/LeaderboardWidget";
import {
  LeaderboardEntryDTO,
  AssessmentDTO,
  StudentTopicMasteryDTO,
} from "../../types";
import {
  BarChartIcon,
  ReaderIcon,
  ExitIcon,
  CrossCircledIcon,
  TargetIcon,
  RocketIcon,
  StarIcon,
  PersonIcon,
  LightningBoltIcon,
} from "@radix-ui/react-icons";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [xp, setXp] = useState(1250);
  const [streak] = useState(5);

  const [assessments, setAssessments] = useState<AssessmentDTO[]>([
    {
      id: "demo-asm-1",
      title: "Algorithm Complexity & Data Structures Quiz",
      description:
        "Mid-term evaluation covering Big-O analysis, sorting algorithms, and boolean logic.",
      className: "1st Sem",
      topic: "Computer Science",
      assessmentType: "QUIZ" as any,
      totalMarks: 25,
      passingMarks: 15,
      durationMinutes: 30,
      hasNegativeMarking: true,
      negativeMarkValue: 0.25,
      isPublished: true,
      _count: { questions: 3, attempts: 12 },
    },
  ]);

  const [topicMasteries, setTopicMasteries] = useState<
    StudentTopicMasteryDTO[]
  >([
    {
      topic: "Arrays",
      masteryScore: 82,
      accuracy: 82,
      totalAttempts: 10,
      correctAnswers: 8,
      assessmentCount: 3,
      lastPracticedAt: "",
      status: "Mastered",
      isWeak: false,
    },
    {
      topic: "Loops",
      masteryScore: 64,
      accuracy: 64,
      totalAttempts: 8,
      correctAnswers: 5,
      assessmentCount: 2,
      lastPracticedAt: "",
      status: "Proficient",
      isWeak: false,
    },
    {
      topic: "Recursion",
      masteryScore: 31,
      accuracy: 31,
      totalAttempts: 6,
      correctAnswers: 2,
      assessmentCount: 2,
      lastPracticedAt: "",
      status: "Needs Improvement",
      isWeak: true,
    },
    {
      topic: "Sorting",
      masteryScore: 55,
      accuracy: 55,
      totalAttempts: 4,
      correctAnswers: 2,
      assessmentCount: 1,
      lastPracticedAt: "",
      status: "Proficient",
      isWeak: false,
    },
    {
      topic: "Graphs",
      masteryScore: 20,
      accuracy: 20,
      totalAttempts: 3,
      correctAnswers: 0,
      assessmentCount: 1,
      lastPracticedAt: "",
      status: "Needs Improvement",
      isWeak: true,
    },
  ]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDTO[]>([
    {
      id: "1",
      studentId: "demo-1",
      studentName: "Alex Johnson",
      rank: 1,
      totalXp: 2450,
    },
    {
      id: "2",
      studentId: user?.id || "current-user",
      studentName: `${user?.firstName || "You"}`,
      rank: 2,
      totalXp: 1250,
    },
    {
      id: "3",
      studentId: "demo-3",
      studentName: "Sophia Lee",
      rank: 3,
      totalXp: 980,
    },
    {
      id: "4",
      studentId: "demo-4",
      studentName: "Marcus Vance",
      rank: 4,
      totalXp: 850,
    },
    {
      id: "5",
      studentId: "demo-5",
      studentName: "Emily Chen",
      rank: 5,
      totalXp: 720,
    },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const [asmData, topicsData] = await Promise.allSettled([
          apiFetch<AssessmentDTO[]>("/assessments"),
          apiFetch<StudentTopicMasteryDTO[]>("/analytics/student/topics"),
        ]);
        if (asmData.status === "fulfilled" && asmData.value?.length > 0)
          setAssessments(asmData.value);
        if (topicsData.status === "fulfilled" && topicsData.value?.length > 0)
          setTopicMasteries(topicsData.value);
      } catch {}
    }
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      setLeaderboard((prev) =>
        prev.map((entry) =>
          entry.studentId === (user.id || "current-user")
            ? { ...entry, studentName: `${user.firstName} ${user.lastName}` }
            : entry,
        ),
      );
    }
  }, [user]);

  const simulateEarnXP = () => {
    const newXp = xp + 50;
    setXp(newXp);
    setLeaderboard((prev) =>
      prev
        .map((entry) =>
          entry.studentId === (user?.id || "current-user")
            ? { ...entry, totalXp: newXp }
            : entry,
        )
        .sort((a, b) => b.totalXp - a.totalXp)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 })),
    );
  };

  const getMasteryColor = (score: number) => {
    if (score >= 80) return "bg-emerald-600";
    if (score >= 50) return "bg-blue-600";
    return "bg-amber-500";
  };

  const getMasteryBadge = (status: string) => {
    if (status === "Mastered") return "bg-emerald-100 text-emerald-800";
    if (status === "Proficient") return "bg-blue-100 text-blue-800";
    return "bg-amber-100 text-amber-800";
  };

  const weakTopics = topicMasteries.filter((t) => t.isWeak);

  return (
    <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans p-6 md:p-12 selection:bg-[#111111] selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Minimal Navbar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#111111] rounded-lg flex items-center justify-center">
              <ReaderIcon className="text-white w-4 h-4" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-normal text-[#111111]">
                PSP Lumora
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Welcome,{" "}
                <span className="font-semibold text-[#111111]">
                  {user?.firstName} {user?.lastName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/student/assessments")}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100 transition-all cursor-pointer"
            >
              <ReaderIcon className="w-3.5 h-3.5" />
              Assessments
            </button>
            <button
              onClick={() => router.push("/student/ai-tutor")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer"
            >
              <span>AI Tutor</span>
            </button>
            <button
              onClick={() => router.push("/analytics")}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100 transition-all cursor-pointer"
            >
              <BarChartIcon className="w-3.5 h-3.5" />
              Analytics
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all shadow-sm cursor-pointer"
            >
              <ExitIcon className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Role Banner */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 rounded bg-[#111111] text-white text-[10px] font-mono uppercase tracking-wider font-semibold">
              {String(user?.role)}
            </span>
            <h2 className="font-serif text-2xl font-normal text-[#111111] mt-3">
              {user?.role === "STUDENT"
                ? "Student Learning Portal"
                : user?.role === "TEACHER"
                  ? "Teacher Assessment Desk"
                  : "Administration Console"}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">{user?.email}</p>
          </div>
          {(user?.role === "TEACHER" || user?.role === "ADMIN") && (
            <button
              onClick={() => router.push("/teacher/assessments/new")}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all shadow-sm"
            >
              <RocketIcon className="w-3.5 h-3.5" />
              Create Assessment
            </button>
          )}
        </div>

        {/* ANALYTICS: TOPIC MASTERY BARS — the key feature */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <TargetIcon className="w-4 h-4 text-[#111111]" />
              <h3 className="font-serif text-xl font-normal text-[#111111]">
                Topic Mastery
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {weakTopics.length > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-mono font-semibold rounded border border-amber-200">
                  <CrossCircledIcon className="w-3 h-3" /> {weakTopics.length}{" "}
                  Weak
                </span>
              )}
              <button
                onClick={() => router.push("/analytics")}
                className="text-xs font-medium text-[#111111] underline hover:no-underline"
              >
                View Full Analytics
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {topicMasteries.map((topic) => (
              <div key={topic.topic} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#111111] w-28">
                      {topic.topic}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${getMasteryBadge(topic.status)}`}
                    >
                      {topic.status}
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-[#111111]">
                    {Math.round(topic.masteryScore)}%
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getMasteryColor(topic.masteryScore)}`}
                    style={{ width: `${Math.min(100, topic.masteryScore)}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-zinc-400">
                  {topic.correctAnswers}/{topic.totalAttempts} correct across{" "}
                  {topic.assessmentCount} assessment
                  {topic.assessmentCount !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ASSESSMENT ENGINE */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <ReaderIcon className="w-4 h-4 text-[#111111]" />
              <h3 className="font-serif text-xl font-normal text-[#111111]">
                Active Assessments
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/student/assessments")}
                className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-medium rounded-md transition-all cursor-pointer"
              >
                View All →
              </button>
              {(user?.role === "TEACHER" || user?.role === "ADMIN") && (
                <button
                  onClick={() => router.push("/teacher/assessments/new")}
                  className="px-4 py-2 border border-zinc-300 hover:bg-zinc-100 text-zinc-800 text-xs font-medium rounded-md cursor-pointer"
                >
                  Configure
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {assessments.map((asm) => (
              <div
                key={asm.id}
                className="p-5 bg-[#F4F4F6] rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                      {asm.className}
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 text-[10px] font-mono rounded">
                      {asm.assessmentType}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      {asm.durationMinutes} mins
                    </span>
                    {asm.hasNegativeMarking && (
                      <span className="text-xs font-mono text-red-600 font-semibold">
                        -{asm.negativeMarkValue} marking
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-[#111111]">
                    {asm.title}
                  </h4>
                  <p className="text-xs text-zinc-500">{asm.description}</p>
                </div>
                <button
                  onClick={() => router.push(`/student/assessments/${asm.id}`)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all shadow-sm whitespace-nowrap"
                >
                  <RocketIcon className="w-3.5 h-3.5" />
                  Start Attempt
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* XP + Leaderboard Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <LightningBoltIcon className="w-4 h-4 text-[#111111]" />
                <h3 className="font-serif text-xl font-normal text-[#111111]">
                  XP & Progress
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#F4F4F6] rounded-lg p-4">
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase block">
                    Total XP
                  </span>
                  <p className="text-3xl font-serif text-[#111111] mt-1">
                    {xp}
                  </p>
                </div>
                <div className="bg-[#F4F4F6] rounded-lg p-4">
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold uppercase block">
                    Streak
                  </span>
                  <p className="text-3xl font-serif text-[#111111] mt-1">
                    {streak} Days
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={simulateEarnXP}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-[#111111] hover:bg-black text-white font-medium text-xs rounded-md transition-all shadow-sm"
            >
              <StarIcon className="w-3.5 h-3.5" />
              Solve Practice Quiz (+50 XP)
            </button>
          </div>

          <div className="md:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <PersonIcon className="w-4 h-4 text-[#111111]" />
              <h3 className="font-serif text-xl font-normal text-[#111111]">
                Leaderboard
              </h3>
            </div>
            <LeaderboardWidget
              entries={leaderboard}
              currentUserId={user?.id || "current-user"}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
