"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { AssessmentDTO } from "@/types";
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

const MOCK_ASSESSMENTS: AssessmentDTO[] = [
  {
    id: "demo-asm-1",
    title: "Algorithm Complexity & Data Structures Quiz",
    description:
      "Evaluates Big-O notation, stacks, queues, hash tables, and sorting algorithms.",
    className: "Data Structures II",
    topic: "Computer Science",
    assessmentType: "QUIZ",
    totalMarks: 10,
    passingMarks: 6,
    durationMinutes: 15,
    hasNegativeMarking: true,
    negativeMarkValue: 0.5,
    isPublished: true,
    createdById: "teacher-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { questions: 5, attempts: 12 },
  },
  {
    id: "demo-asm-2",
    title: "System Architecture & Operating Systems Exam",
    description:
      "Deep dive into process scheduling, memory allocation, page faults, and threads.",
    className: "Operating Systems",
    topic: "Computer Science",
    assessmentType: "EXAM",
    totalMarks: 25,
    passingMarks: 15,
    durationMinutes: 30,
    hasNegativeMarking: false,
    negativeMarkValue: 0,
    isPublished: true,
    createdById: "teacher-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { questions: 10, attempts: 8 },
  },
  {
    id: "demo-asm-3",
    title: "Database Design & SQL Fundamentals",
    description:
      "Practice on relational schema, normalization (1NF–3NF), joins, and query optimization.",
    className: "Database Management",
    topic: "Computer Science",
    assessmentType: "PRACTICE",
    totalMarks: 15,
    passingMarks: 9,
    durationMinutes: 20,
    hasNegativeMarking: false,
    negativeMarkValue: 0,
    isPublished: true,
    createdById: "teacher-2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { questions: 8, attempts: 25 },
  },
  {
    id: "demo-asm-4",
    title: "Object Oriented Programming Concepts",
    description:
      "Tests understanding of inheritance, polymorphism, encapsulation, and abstraction.",
    className: "1st Sem",
    topic: "Programming",
    assessmentType: "QUIZ",
    totalMarks: 20,
    passingMarks: 12,
    durationMinutes: 25,
    hasNegativeMarking: true,
    negativeMarkValue: 0.25,
    isPublished: true,
    createdById: "teacher-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { questions: 12, attempts: 18 },
  },
  {
    id: "demo-asm-5",
    title: "Discrete Mathematics & Logic Gates",
    description:
      "Propositional logic, set theory, graph theory, and boolean algebra.",
    className: "2nd Sem",
    topic: "Mathematics",
    assessmentType: "EXAM",
    totalMarks: 30,
    passingMarks: 18,
    durationMinutes: 45,
    hasNegativeMarking: true,
    negativeMarkValue: 0.5,
    isPublished: true,
    createdById: "teacher-3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { questions: 15, attempts: 6 },
  },
];

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

  useEffect(() => {
    async function loadAssessments() {
      try {
        const data = await apiFetch<AssessmentDTO[]>("/assessments");
        if (data && data.length > 0) {
          setAssessments(data);
        } else {
          setAssessments(MOCK_ASSESSMENTS);
        }
      } catch {
        setAssessments(MOCK_ASSESSMENTS);
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
    <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans p-6 md:p-12 selection:bg-[#111111] selection:text-white">
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

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "bg-zinc-900 text-white" },
            { label: "Quizzes", value: stats.quizzes, color: "bg-blue-50 text-blue-700" },
            { label: "Exams", value: stats.exams, color: "bg-red-50 text-red-700" },
            { label: "Practice", value: stats.practice, color: "bg-emerald-50 text-emerald-700" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col gap-1"
            >
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                {stat.label}
              </span>
              <span className={`text-3xl font-bold font-mono ${stat.color === "bg-zinc-900 text-white" ? "text-[#111111]" : stat.color.split(" ")[1]}`}>
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
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_TABS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-md text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                  activeFilter === filter
                    ? "bg-[#111111] text-white shadow-sm"
                    : "bg-[#F4F4F6] text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

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
            <span className="text-xs font-mono text-zinc-400">Loading assessments...</span>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-16 text-center space-y-3 shadow-sm">
            <p className="text-zinc-400 text-sm">No assessments match your criteria.</p>
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
                          <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                          -{asm.negativeMarkValue} marking
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <div className="flex items-center gap-3 flex-shrink-0">
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
            {filteredAssessments.length} of {assessments.length} assessments shown
          </span>
        </div>
      </div>
    </main>
  );
}
