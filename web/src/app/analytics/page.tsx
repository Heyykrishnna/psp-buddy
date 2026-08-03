"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/Loader";
import { apiFetch } from "@/lib/api";
import { SlidingTabs } from "@/components/SlidingTabs";
import {
  StudentTopicMasteryDTO,
  StudentOverviewDTO,
  StudentPerformanceDTO,
  ClassTopicDTO,
  ClassStudentRankingDTO,
} from "@/types";
import {
  ArrowLeftIcon,
  TargetIcon,
  BarChartIcon,
  ReaderIcon,
  PersonIcon,
  CheckIcon,
  Cross2Icon,
  LightningBoltIcon,
  ClockIcon,
} from "@radix-ui/react-icons";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<StudentOverviewDTO | null>(null);
  const [topics, setTopics] = useState<StudentTopicMasteryDTO[]>([]);
  const [performance, setPerformance] = useState<StudentPerformanceDTO[]>([]);
  const [classTopics, setClassTopics] = useState<ClassTopicDTO[]>([]);
  const [classStudents, setClassStudents] = useState<ClassStudentRankingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"student" | "class">("student");

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const [overviewRes, topicsRes, perfRes] = await Promise.allSettled([
          apiFetch<StudentOverviewDTO>("/analytics/student/me"),
          apiFetch<StudentTopicMasteryDTO[]>("/analytics/student/topics"),
          apiFetch<StudentPerformanceDTO[]>("/analytics/student/performance"),
        ]);

        if (overviewRes.status === "fulfilled" && overviewRes.value)
          setOverview(overviewRes.value);
        if (topicsRes.status === "fulfilled" && Array.isArray(topicsRes.value))
          setTopics(topicsRes.value);
        if (perfRes.status === "fulfilled" && Array.isArray(perfRes.value))
          setPerformance(perfRes.value);

        if (user?.role === "TEACHER" || user?.role === "ADMIN") {
          const [classTopicsRes, classStudentsRes] = await Promise.allSettled([
            apiFetch<ClassTopicDTO[]>("/analytics/classes/Class 10-A/topics"),
            apiFetch<ClassStudentRankingDTO[]>(
              "/analytics/classes/Class 10-A/students"
            ),
          ]);
          if (classTopicsRes.status === "fulfilled" && classTopicsRes.value)
            setClassTopics(classTopicsRes.value);
          if (classStudentsRes.status === "fulfilled" && classStudentsRes.value)
            setClassStudents(classStudentsRes.value);
        }
      } catch {
        // Handled cleanly via empty states
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [user]);

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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center font-sans">
        <Loader />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mt-4">
          Fetching Analytics & Topic Breakdown...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans px-6 pt-6 pb-24 md:px-12 md:pt-12 md:pb-24 selection:bg-[#111111] selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#111111] rounded-lg flex items-center justify-center">
              <BarChartIcon className="text-white w-4 h-4" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-normal text-[#111111]">
                Analytics & Mastery
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Deep performance tracking and weak-topic detection
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100 transition-all cursor-pointer"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
        </header>

        {/* Role Tabs for Teachers */}
        {(user?.role === "TEACHER" || user?.role === "ADMIN") && (
          <SlidingTabs
            tabs={[
              { id: "student", label: "My Student View" },
              { id: "class", label: "Class-wide Analytics" },
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as any)}
          />
        )}

        {activeTab === "student" ? (
          <>
            {/* Student Overview Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs space-y-1">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                  Total XP
                </span>
                <span className="text-3xl font-bold font-mono text-[#111111]">
                  {overview?.totalXp || 0}
                </span>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs space-y-1">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                  Average Score
                </span>
                <span className="text-3xl font-bold font-mono text-blue-600">
                  {overview?.averageScorePercentage || 0}%
                </span>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs space-y-1">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                  Mastered Topics
                </span>
                <span className="text-3xl font-bold font-mono text-emerald-600">
                  {overview?.masteredTopicsCount || 0}
                </span>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs space-y-1">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                  Weak Topics
                </span>
                <span className="text-3xl font-bold font-mono text-amber-600">
                  {overview?.weakTopicsCount || 0}
                </span>
              </div>
            </div>

            {/* Topic Mastery Progress Cards */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="border-b border-zinc-100 pb-3">
                <h2 className="font-serif text-lg font-normal text-[#111111]">
                  Topic Mastery Breakdown
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Calculated based on correct vs total question responses
                </p>
              </div>

              {topics.length === 0 ? (
                <div className="p-8 text-center bg-[#F9F9FB] rounded-lg border border-zinc-200 text-xs font-mono text-zinc-500">
                  No topic analytics evaluated yet. Complete assessment attempts to view topic tracking.
                </div>
              ) : (
                <div className="space-y-4">
                  {topics.map((t, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-800">
                          {t.topic}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded ${getMasteryBadge(
                              t.status
                            )}`}
                          >
                            {t.status}
                          </span>
                          <span className="text-zinc-600">{t.masteryScore}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getMasteryColor(t.masteryScore)} transition-all duration-500`}
                          style={{ width: `${t.masteryScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Assessment Performance History */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="border-b border-zinc-100 pb-3">
                <h2 className="font-serif text-lg font-normal text-[#111111]">
                  Assessment Performance History
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Past evaluated test attempts
                </p>
              </div>

              {performance.length === 0 ? (
                <div className="p-8 text-center bg-[#F9F9FB] rounded-lg border border-zinc-200 text-xs font-mono text-zinc-500">
                  No attempt history found.
                </div>
              ) : (
                <div className="space-y-3">
                  {performance.map((p) => (
                    <div
                      key={p.attemptId}
                      className="p-4 bg-[#F9F9FB] rounded-lg border border-zinc-200 flex items-center justify-between gap-4 font-sans"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                            {p.className || "General"}
                          </span>
                          <span className="text-xs font-mono text-zinc-500">
                            {p.assessmentType}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-[#111111]">
                          {p.assessmentTitle}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className="font-bold text-[#111111]">
                          {p.totalScore} / {p.maxScore} marks
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            p.percentage >= 60
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {p.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Class-wide analytics for Teachers */
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-2xs space-y-4">
              <h2 className="font-serif text-lg font-normal text-[#111111]">
                Class Topic Performance
              </h2>
              {classTopics.length === 0 ? (
                <div className="p-8 text-center bg-[#F9F9FB] rounded-lg text-xs font-mono text-zinc-500">
                  No class topic analytics evaluated.
                </div>
              ) : (
                <div className="space-y-3">
                  {classTopics.map((ct, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#F9F9FB] border border-zinc-200 rounded-lg flex items-center justify-between text-xs font-mono"
                    >
                      <span className="font-bold text-[#111111]">{ct.topic}</span>
                      <span className="text-blue-600 font-semibold">
                        Avg Mastery: {ct.averageMastery}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
