"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { AssessmentDTO } from "@/types";
import { StudentLayout } from "@/components/StudentLayout";
import { SlidingTabs } from "@/components/SlidingTabs";
import Loader from "@/components/Loader";
import {
  Search,
  Clock,
  Target,
  ChevronRight,
  Rocket,
  BookOpen,
  Bell,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

const FILTER_TABS = ["ALL", "QUIZ", "EXAM", "PRACTICE"];

const TYPE_BADGE: Record<string, string> = {
  QUIZ: "bg-blue-100 text-blue-700 border-blue-200",
  EXAM: "bg-red-100 text-red-700 border-red-200",
  PRACTICE: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function StudentAssessmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  // Redirect teachers to their own portal
  useEffect(() => {
    if (user && (user.role === "TEACHER" || user.role === "ADMIN")) {
      router.replace("/teacher/dashboard");
    }
  }, [user, router]);

  const [completedAttempts, setCompletedAttempts] = useState<
    Record<string, { attemptId: string; status: string; score: number }>
  >({});

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiFetch<AssessmentDTO[]>("/assessments");
        setAssessments(data || []);

        if (user?.id) {
          const userAtts = await apiFetch<any[]>(
            `/students/${user.id}/attempts`,
          );
          if (Array.isArray(userAtts)) {
            const attMap: Record<string, any> = {};
            userAtts.forEach((att: any) => {
              if (att.status === "SUBMITTED" || att.status === "EVALUATED") {
                attMap[att.assessmentId] = {
                  attemptId: att.id,
                  status: att.status,
                  score: att.totalScore || 0,
                };
              }
            });
            setCompletedAttempts(attMap);
          }
        }
      } catch {
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const filteredAssessments = assessments.filter((asm) => {
    const matchesQuery =
      asm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asm.className &&
        asm.className.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asm.topic &&
        asm.topic.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter =
      activeFilter === "ALL" || asm.assessmentType === activeFilter;
    return matchesQuery && matchesFilter;
  });

  const stats = {
    total: assessments.length,
    quizzes: assessments.filter((a) => a.assessmentType === "QUIZ").length,
    exams: assessments.filter((a) => a.assessmentType === "EXAM").length,
    practice: assessments.filter((a) => a.assessmentType === "PRACTICE").length,
  };

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#F5F5F7]">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-zinc-900">Assessments</h1>
            <span className="text-zinc-300 text-sm">/</span>
            <span className="text-xs text-zinc-500">
              Welcome, {user?.firstName} {user?.lastName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, class, or topic..."
                className="pl-9 pr-4 py-2 bg-zinc-100 rounded-xl text-xs text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 w-56 transition-all"
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

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Playground Banner */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Web Playground &amp; Assessment Portal
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Attempt practice assessments with Monaco Code Editor or
                  practice anytime in the Code Playground.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/student/playground")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              Open Playground
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total",
                value: stats.total,
                color: "text-zinc-900",
                bg: "bg-zinc-100",
                border: "border-zinc-200",
                icon: ClipboardList,
              },
              {
                label: "Quizzes",
                value: stats.quizzes,
                color: "text-blue-700",
                bg: "bg-blue-50",
                border: "border-blue-200",
                icon: BookOpen,
              },
              {
                label: "Exams",
                value: stats.exams,
                color: "text-red-700",
                bg: "bg-red-50",
                border: "border-red-200",
                icon: Target,
              },
              {
                label: "Practice",
                value: stats.practice,
                color: "text-emerald-700",
                bg: "bg-emerald-50",
                border: "border-emerald-200",
                icon: CheckCircle2,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 flex items-center gap-4"
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
                  <p className="text-2xl font-bold text-zinc-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
            <SlidingTabs
              tabs={FILTER_TABS.map((f) => ({ id: f, label: f }))}
              activeId={activeFilter}
              onChange={setActiveFilter}
            />
            <div className="ml-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-zinc-400">
                {filteredAssessments.length} available
              </span>
            </div>
          </div>

          {/* Assessments List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader />
              <span className="text-xs font-mono text-zinc-400 mt-2">
                Loading assessments...
              </span>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-16 text-center">
              <ClipboardList className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">
                No assessments match your criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("ALL");
                }}
                className="mt-3 text-xs text-zinc-500 underline underline-offset-4 hover:text-zinc-800 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssessments.map((asm) => (
                <div
                  key={asm.id}
                  className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 hover:border-zinc-300 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-bold rounded-lg">
                          {asm.className || "General"}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${
                            TYPE_BADGE[asm.assessmentType] ||
                            "bg-zinc-100 text-zinc-600 border-zinc-200"
                          }`}
                        >
                          {asm.assessmentType}
                        </span>
                        {asm.topic && (
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] font-mono rounded-lg">
                            {asm.topic}
                          </span>
                        )}
                        {(asm.isWorkbook ||
                          Boolean(asm.workbookUrl) ||
                          asm.submissionMode === "WORKBOOK_ONLY") && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-lg">
                            WORKBOOK
                          </span>
                        )}
                        {completedAttempts[asm.id] && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> COMPLETED
                          </span>
                        )}
                      </div>

                      <h2 className="text-sm font-bold text-zinc-900 truncate">
                        {asm.title}
                      </h2>

                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-1">
                        {asm.description ||
                          "Evaluate core concepts, logic, and problem-solving skills."}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {asm.durationMinutes} mins
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          {asm.totalMarks} marks
                        </span>
                        {(asm as any)._count?.questions && (
                          <span>{(asm as any)._count.questions} questions</span>
                        )}
                        {(asm as any)._count?.attempts !== undefined && (
                          <span>{(asm as any)._count.attempts} attempts</span>
                        )}
                        {asm.hasNegativeMarking && (
                          <span className="flex items-center gap-1 text-red-500 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />-
                            {asm.negativeMarkValue} marking
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Action */}
                    <div className="flex items-center gap-3 shrink-0">
                      {completedAttempts[asm.id] ? (
                        <button
                          onClick={() =>
                            router.push(
                              `/student/attempts/${completedAttempts[asm.id].attemptId}/result`,
                            )
                          }
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          View Result
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            router.push(`/student/assessments/${asm.id}`)
                          }
                          className={`flex items-center gap-2 px-5 py-2.5 text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                            asm.isWorkbook ||
                            Boolean(asm.workbookUrl) ||
                            asm.submissionMode === "WORKBOOK_ONLY"
                              ? "bg-indigo-600 hover:bg-indigo-700"
                              : "bg-[#111111] hover:bg-black"
                          }`}
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          {asm.isWorkbook ||
                          Boolean(asm.workbookUrl) ||
                          asm.submissionMode === "WORKBOOK_ONLY"
                            ? "Submit Workbook"
                            : "Start Attempt"}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-200">
            <span>© 2026 PSP Lumora. All rights reserved.</span>
            <span className="font-mono">
              {filteredAssessments.length} of {assessments.length} shown
            </span>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
