"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { AssessmentDTO } from "@/types";
import { SlidingTabs } from "@/components/SlidingTabs";
import {
  ReaderIcon,
  ClockIcon,
  TargetIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  RocketIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";

const FILTER_TABS = ["ALL", "QUIZ", "EXAM", "PRACTICE"];

const TYPE_STYLES: Record<string, string> = {
  QUIZ: "bg-blue-50 text-blue-700",
  EXAM: "bg-red-50 text-red-700",
  PRACTICE: "bg-emerald-50 text-emerald-700",
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

  useEffect(() => {
    async function loadAssessments() {
      try {
        const data = await apiFetch<AssessmentDTO[]>("/assessments");
        setAssessments(data || []);
      } catch {
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    }
    loadAssessments();
  }, []);

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
    <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans px-6 pt-6 pb-24 md:px-12 md:pt-12 md:pb-24 selection:bg-[#111111] selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#111111] rounded-lg flex items-center justify-center">
              <ReaderIcon className="text-white w-4 h-4" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-normal text-[#111111]">
                Assessments
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Welcome,{" "}
                <span className="font-semibold text-[#111111]">
                  {user?.firstName} {user?.lastName}
                </span>
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

        {/* Mobile Exclusive Banner */}
        <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <ExclamationTriangleIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-amber-950 uppercase tracking-wider font-mono">
                Mobile Exclusive Feature
              </h3>
              <p className="text-xs text-amber-900 mt-0.5 font-sans">
                Quizzes, Exams & Assessment Tests must be completed on the PSP Lumora Mobile App. Practice coding anytime in the Web Code Playground.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/student/playground")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white text-xs font-medium rounded-lg transition-all shrink-0 cursor-pointer"
          >
            <RocketIcon className="w-3.5 h-3.5" />
            Open Playground
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total",
              value: stats.total,
              color: "bg-zinc-900 text-white",
            },
            {
              label: "Quizzes",
              value: stats.quizzes,
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: "Exams",
              value: stats.exams,
              color: "bg-red-50 text-red-700",
            },
            {
              label: "Practice",
              value: stats.practice,
              color: "bg-emerald-50 text-emerald-700",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col gap-1"
            >
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                {stat.label}
              </span>
              <span
                className={`text-3xl font-bold font-mono ${stat.color === "bg-zinc-900 text-white" ? "text-[#111111]" : stat.color.split(" ")[1]}`}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, class, or topic..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <SlidingTabs
            tabs={FILTER_TABS.map((f) => ({
              id: f,
              label: f,
            }))}
            activeId={activeFilter}
            onChange={setActiveFilter}
          />

          {/* Count Badge */}
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-zinc-500">
              {filteredAssessments.length} available
            </span>
          </div>
        </div>

        {/* Assessments List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-zinc-400">
              Loading assessments...
            </span>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-16 text-center space-y-3 shadow-sm">
            <p className="text-zinc-400 text-sm">
              No assessments match your criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("ALL");
              }}
              className="text-xs font-mono text-[#111111] underline underline-offset-4 hover:opacity-70 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssessments.map((asm) => (
              <div
                key={asm.id}
                className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Labels + Title + Description */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                        {asm.className || "General"}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded ${
                          TYPE_STYLES[asm.assessmentType] ||
                          "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {asm.assessmentType}
                      </span>
                      {asm.topic && (
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] font-mono rounded">
                          {asm.topic}
                        </span>
                      )}
                    </div>

                    <h2 className="text-sm font-semibold text-[#111111] group-hover:text-zinc-700 transition-colors truncate">
                      {asm.title}
                    </h2>

                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-1">
                      {asm.description ||
                        "Evaluate core concepts, logic, and problem-solving skills."}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {asm.durationMinutes} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <TargetIcon className="w-3.5 h-3.5" />
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
                          <ExclamationTriangleIcon className="w-3.5 h-3.5" />-
                          {asm.negativeMarkValue} marking
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() =>
                        router.push(`/student/assessments/${asm.id}`)
                      }
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      <RocketIcon className="w-3.5 h-3.5" />
                      Start Attempt
                      <ChevronRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-6 border-t border-zinc-200">
          <span>© 2026 PSP Lumora. All rights reserved.</span>
          <span className="font-mono">
            {filteredAssessments.length} of {assessments.length} assessments
            shown
          </span>
        </div>
      </div>
    </main>
  );
}
