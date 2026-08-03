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
  TargetIcon,
  StarIcon,
  PersonIcon,
  LightningBoltIcon,
  CodeIcon,
} from "@radix-ui/react-icons";

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
    if (score >= 80) return "bg-emerald-600";
    if (score >= 50) return "bg-blue-600";
    return "bg-amber-500";
  };

  const getMasteryBadge = (status: string) => {
    if (status === "Mastered") return "bg-emerald-100 text-emerald-800";
    if (status === "Proficient") return "bg-blue-100 text-blue-800";
    return "bg-amber-100 text-amber-800";
  };

  const weakTopics = topicMasteries.filter(
    (t) => t.isWeak || t.masteryScore < 50,
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center font-sans">
        <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans px-6 pt-6 pb-24 md:px-12 md:pt-12 md:pb-24 selection:bg-[#111111] selection:text-white">
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

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push("/student/assessments")}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100 transition-all cursor-pointer"
            >
              <ReaderIcon className="w-3.5 h-3.5" />
              Assessments
            </button>
            <button
              onClick={() => router.push("/student/playground")}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100 transition-all cursor-pointer"
            >
              <CodeIcon className="w-3.5 h-3.5 text-purple-600" />
              IDE Playground
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

        {/* User XP & Streak Header Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                Total XP
              </span>
              <span className="text-2xl font-bold font-mono text-[#111111]">
                {xp} XP
              </span>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <StarIcon className="w-5 h-5 text-amber-600" />
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                Day Streak
              </span>
              <span className="text-2xl font-bold font-mono text-[#111111]">
                {streak} Days
              </span>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <LightningBoltIcon className="w-5 h-5 text-orange-600" />
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                Active Assessments
              </span>
              <span className="text-2xl font-bold font-mono text-[#111111]">
                {assessments.length}
              </span>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <ReaderIcon className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                Weak Topics
              </span>
              <span className="text-2xl font-bold font-mono text-[#111111]">
                {weakTopics.length}
              </span>
            </div>
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center">
              <TargetIcon className="w-5 h-5 text-rose-600" />
            </div>
          </div>
        </div>

        {/* Main Content Grid: Assessments & Topic Mastery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Available Assessments & Topic Mastery */}
          <div className="lg:col-span-8 space-y-8">
            {/* Available Assessments Section */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <h2 className="font-serif text-lg font-normal text-[#111111]">
                    Available Assessments
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Published tests and coding practice assignments
                  </p>
                </div>
                <button
                  onClick={() => router.push("/student/assessments")}
                  className="text-xs font-mono text-zinc-600 hover:text-zinc-900 cursor-pointer"
                >
                  View All ({assessments.length}) →
                </button>
              </div>

              {assessments.length === 0 ? (
                <div className="p-8 text-center bg-[#F9F9FB] rounded-lg border border-zinc-200 text-xs font-mono text-zinc-500">
                  No active assessments available at this time.
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.slice(0, 3).map((asm) => (
                    <div
                      key={asm.id}
                      className="p-4 bg-[#F9F9FB] rounded-lg border border-zinc-200 hover:border-zinc-300 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                            {asm.className || "General"}
                          </span>
                          <span className="text-xs font-mono text-zinc-500">
                            {asm.assessmentType}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-[#111111]">
                          {asm.title}
                        </h3>
                        <p className="text-xs text-zinc-500 line-clamp-1">
                          {asm.description ||
                            "Take this assessment to test your skills."}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          router.push(`/student/assessments/${asm.id}`)
                        }
                        className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer"
                      >
                        Start Assessment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Topic Mastery Breakdown */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="border-b border-zinc-100 pb-4">
                <h2 className="font-serif text-lg font-normal text-[#111111]">
                  Topic Mastery & Performance
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Automated breakdown based on evaluated assessment attempts
                </p>
              </div>

              {topicMasteries.length === 0 ? (
                <div className="p-8 text-center bg-[#F9F9FB] rounded-lg border border-zinc-200 text-xs font-mono text-zinc-500">
                  No topic mastery data evaluated yet. Complete an assessment to
                  generate your topic breakdown.
                </div>
              ) : (
                <div className="space-y-4">
                  {topicMasteries.map((topic, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-800">
                          {topic.topic}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded ${getMasteryBadge(
                              topic.status,
                            )}`}
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
                          className={`h-full ${getMasteryColor(topic.masteryScore)} transition-all duration-500`}
                          style={{ width: `${topic.masteryScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Leaderboard & Quick AI Action */}
          <div className="lg:col-span-4 space-y-8">
            {/* Leaderboard Widget */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h2 className="font-serif text-lg font-normal text-[#111111]">
                  Class Leaderboard
                </h2>
                <span className="text-[11px] font-mono text-zinc-400">
                  Top Students
                </span>
              </div>

              {leaderboard.length === 0 ? (
                <div className="p-6 text-center bg-[#F9F9FB] rounded-lg border border-zinc-200 text-xs font-mono text-zinc-500">
                  No leaderboard entries available.
                </div>
              ) : (
                <LeaderboardWidget
                  entries={leaderboard}
                  currentUserId={user?.id}
                />
              )}
            </div>

            {/* AI Tutor Quick Access Card */}
            <div className="bg-[#111111] text-white rounded-xl p-6 shadow-md space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold block">
                Lumora AI Companion
              </span>
              <h3 className="font-serif text-lg text-white">
                Stuck on a problem or algorithm?
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Chat with Lumora AI Tutor for instant step-by-step explanations,
                code debugging, and tailored study plans.
              </p>
              <button
                onClick={() => router.push("/student/ai-tutor")}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-md transition-all cursor-pointer"
              >
                Launch AI Tutor →
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
