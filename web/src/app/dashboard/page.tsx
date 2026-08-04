"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/Loader";
import { StudentLayout } from "@/components/StudentLayout";
import { apiFetch } from "@/lib/api";
import { LeaderboardWidget } from "../../components/LeaderboardWidget";
import {
  LeaderboardEntryDTO,
  AssessmentDTO,
  StudentTopicMasteryDTO,
} from "../../types";
import {
  BookOpen,
  Zap,
  Flame,
  ClipboardList,
  Target,
  ChevronRight,
  Search,
  Bell,
  Code2,
  Bot,
  Trophy,
  TrendingUp,
  Smartphone,
} from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Redirect teachers/admins to their dedicated portal
  useEffect(() => {
    if (user && (user.role === "TEACHER" || user.role === "ADMIN")) {
      router.replace("/teacher/dashboard");
    }
  }, [user, router]);

  const [loading, setLoading] = useState<boolean>(true);
  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  const [assessments, setAssessments] = useState<AssessmentDTO[]>([]);
  const [topicMasteries, setTopicMasteries] = useState<
    StudentTopicMasteryDTO[]
  >([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDTO[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [asmData, topicsData, leaderboardData, profileData] =
          await Promise.allSettled([
            apiFetch<AssessmentDTO[]>("/assessments"),
            apiFetch<StudentTopicMasteryDTO[]>("/analytics/student/topics"),
            apiFetch<LeaderboardEntryDTO[]>("/analytics/leaderboard"),
            apiFetch<any>("/analytics/student/me"),
          ]);

        if (asmData.status === "fulfilled" && Array.isArray(asmData.value)) {
          setAssessments(asmData.value);
        }
        if (
          topicsData.status === "fulfilled" &&
          Array.isArray(topicsData.value)
        ) {
          setTopicMasteries(topicsData.value);
        }
        if (
          leaderboardData.status === "fulfilled" &&
          Array.isArray(leaderboardData.value)
        ) {
          setLeaderboard(leaderboardData.value);
        }
        if (profileData.status === "fulfilled" && profileData.value) {
          setXp(profileData.value.totalXp || 0);
          setStreak(profileData.value.currentStreak || 0);
        }
      } catch {
        // Handled cleanly via empty states
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const getMasteryColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-blue-500";
    return "bg-amber-500";
  };

  const getMasteryBadge = (status: string) => {
    if (status === "Mastered")
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (status === "Proficient")
      return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  const weakTopics = topicMasteries.filter(
    (t) => t.isWeak || t.masteryScore < 50,
  );

  if (loading) {
    return (
      <StudentLayout>
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center">
          <Loader />
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider mt-4">
            Loading PSP Lumora...
          </p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#F5F5F7]">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-zinc-900">Dashboard</h1>
            <span className="text-zinc-300 text-sm">/</span>
            <span className="text-xs text-zinc-500">Overview</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                className="pl-9 pr-4 py-2 bg-zinc-100 rounded-xl text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 w-52 transition-all"
              />
            </div>
            <button className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-all cursor-pointer">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-[#111111] flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              {(user?.firstName?.[0] || "S").toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Hero Banner Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Welcome Banner */}
            <div className="md:col-span-2 bg-[#111111] rounded-2xl p-6 flex items-end justify-between min-h-35 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-zinc-400 text-xs font-medium mb-1">
                  Good day,
                </p>
                <h2 className="text-white text-2xl font-bold leading-tight mb-4">
                  Welcome back,{" "}
                  <span className="text-orange-400">{user?.firstName}!</span>
                </h2>
                <button
                  onClick={() => router.push("/student/assessments")}
                  className="px-5 py-2.5 bg-white text-[#111111] text-xs font-bold rounded-xl hover:bg-zinc-100 transition-all cursor-pointer"
                >
                  View Assessments
                </button>
              </div>
              {/* Decorative */}
              <div className="absolute right-6 top-4 w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-white/20" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/student/competitive")}
                className="bg-orange-500 hover:bg-orange-600 rounded-2xl p-4 flex flex-col justify-between transition-all cursor-pointer group min-h-32.5"
              >
                <Trophy className="w-5 h-5 text-white/80" />
                <div>
                  <p className="text-white text-xs font-semibold mt-2">
                    Competitive Hub
                  </p>
                  <p className="text-orange-200 text-[10px]">
                    Daily challenges
                  </p>
                </div>
              </button>
              <button
                onClick={() => router.push("/student/ai-tutor")}
                className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl p-4 flex flex-col justify-between transition-all cursor-pointer min-h-32.5"
              >
                <Bot className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-zinc-800 text-xs font-semibold mt-2">
                    AI Tutor
                  </p>
                  <p className="text-zinc-400 text-[10px]">Ask Lumora AI</p>
                </div>
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total XP",
                value: `${xp} XP`,
                icon: Zap,
                color: "text-amber-600",
                bg: "bg-amber-50",
                border: "border-amber-200",
              },
              {
                label: "Day Streak",
                value: `${streak} Days`,
                icon: Flame,
                color: "text-orange-600",
                bg: "bg-orange-50",
                border: "border-orange-200",
              },
              {
                label: "Assessments",
                value: assessments.length,
                icon: ClipboardList,
                color: "text-blue-600",
                bg: "bg-blue-50",
                border: "border-blue-200",
              },
              {
                label: "Weak Topics",
                value: weakTopics.length,
                icon: Target,
                color: "text-rose-600",
                bg: "bg-rose-50",
                border: "border-rose-200",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-zinc-200 p-5 flex items-center gap-4 shadow-sm"
              >
                <div
                  className={`w-10 h-10 ${stat.bg} border ${stat.border} rounded-xl flex items-center justify-center shrink-0`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-medium">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold text-zinc-900 leading-tight">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Assessments + Topic Mastery */}
            <div className="lg:col-span-8 space-y-6">
              {/* Available Assessments */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900">
                      Available Assessments
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Published tests and coding practice assignments
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/student/assessments")}
                    className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                  >
                    View All ({assessments.length})
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-5">
                  {assessments.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-400">
                      No active assessments available at this time.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assessments.slice(0, 4).map((asm) => (
                        <div
                          key={asm.id}
                          className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all group"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-bold rounded-lg">
                                {asm.className || "General"}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 uppercase">
                                {asm.assessmentType}
                              </span>
                              {(asm.assessmentType === "QUIZ" ||
                                asm.isWorkbook ||
                                Boolean(asm.workbookUrl) ||
                                asm.submissionMode === "WORKBOOK_ONLY") && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-bold rounded-lg flex items-center gap-1">
                                  <Smartphone className="w-3 h-3" /> MOBILE ONLY
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold text-zinc-800 truncate">
                              {asm.title}
                            </h3>
                            <p className="text-xs text-zinc-400 line-clamp-1">
                              {asm.description ||
                                "Evaluate core concepts and problem-solving skills."}
                            </p>
                          </div>
                          {asm.assessmentType === "QUIZ" ||
                          asm.isWorkbook ||
                          Boolean(asm.workbookUrl) ||
                          asm.submissionMode === "WORKBOOK_ONLY" ? (
                            <button
                              onClick={() =>
                                router.push(`/student/assessments/${asm.id}`)
                              }
                              className="ml-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              Mobile Only
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                router.push(`/student/assessments/${asm.id}`)
                              }
                              className="ml-4 px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0"
                            >
                              Start
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Topic Mastery */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-2 p-5 border-b border-zinc-100">
                  <TrendingUp className="w-4 h-4 text-zinc-400" />
                  <div>
                    <h2 className="text-sm font-bold text-zinc-900">
                      Topic Mastery
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Based on evaluated assessment attempts
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  {topicMasteries.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-400">
                      No topic mastery data yet. Complete an assessment to
                      generate your breakdown.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topicMasteries.map((topic, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-800">
                              {topic.topic}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg border ${getMasteryBadge(topic.status)}`}
                              >
                                {topic.status}
                              </span>
                              <span className="font-mono text-zinc-500">
                                {topic.masteryScore}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getMasteryColor(topic.masteryScore)} rounded-full transition-all duration-500`}
                              style={{ width: `${topic.masteryScore}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Leaderboard + Playground */}
            <div className="lg:col-span-4 space-y-6">
              {/* Leaderboard */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between p-5 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-bold text-zinc-900">
                      Leaderboard
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    Top Students
                  </span>
                </div>
                <div className="p-5">
                  {leaderboard.length === 0 ? (
                    <div className="p-6 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-400">
                      No leaderboard entries available.
                    </div>
                  ) : (
                    <LeaderboardWidget
                      entries={leaderboard}
                      currentUserId={user?.id}
                    />
                  )}
                </div>
              </div>

              {/* IDE Playground Card */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center mb-3">
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 mb-1">
                  Code Playground
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Practice coding with Monaco Editor. Solve problems, run code,
                  and improve your skills.
                </p>
                <button
                  onClick={() => router.push("/student/playground")}
                  className="w-full py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Open Playground
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
