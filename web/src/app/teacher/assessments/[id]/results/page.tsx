"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  ArrowLeftIcon,
  CheckIcon,
  Cross2Icon,
  PersonIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BarChartIcon,
  ClockIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";

export interface QuestionAnswerDetail {
  questionText: string;
  topic: string;
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
}

export interface StudentResult {
  studentId: string;
  studentName: string;
  email: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeTakenMinutes: number;
  submittedAt: string;
  passed: boolean;
  answers: QuestionAnswerDetail[];
}

export interface AssessmentResultsSummary {
  assessmentId: string;
  assessmentTitle: string;
  className?: string;
  topic?: string;
  assessmentType: string;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  totalAttempts: number;
  avgScore: number;
  passCount: number;
  failCount: number;
  highestScore: number;
  lowestScore: number;
  questionAnalysis: {
    questionText: string;
    topic: string;
    totalAnswered: number;
    correctCount: number;
    accuracy: number;
  }[];
  studentResults: StudentResult[];
}

function ScoreBadge({ pct }: { pct: number }) {
  const color =
    pct >= 75
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : pct >= 50
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-red-50 text-red-700 border-red-200";
  return (
    <span
      className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${color}`}
    >
      {Math.round(pct)}%
    </span>
  );
}

export default function AssessmentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const assessmentId = resolvedParams.id;
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<AssessmentResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"students" | "questions">(
    "students",
  );

  useEffect(() => {
    async function loadResults() {
      setLoading(true);
      try {
        const res = await apiFetch<AssessmentResultsSummary>(
          `/assessments/${assessmentId}/results`,
        );
        setData(res || null);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-400">
            Fetching Assessment Results from Backend...
          </span>
        </div>
      </div>
    );
  }

  if (!data || data.totalAttempts === 0) {
    return (
      <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans px-6 pt-6 pb-24 md:px-12 md:pt-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <button
            onClick={() => router.push("/teacher/dashboard")}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100 transition-all cursor-pointer"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <div className="bg-white border border-zinc-200 rounded-xl p-16 text-center space-y-3 shadow-2xs">
            <h2 className="text-base font-semibold text-[#111111]">
              No Submission Results Found
            </h2>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Students have not submitted any attempts for this assessment yet. Evaluation analytics will appear here automatically once submissions are received.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const passRate =
    data.totalAttempts > 0
      ? Math.round((data.passCount / data.totalAttempts) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans px-6 pt-6 pb-24 md:px-12 md:pt-12 md:pb-24 selection:bg-[#111111] selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header & Breadcrumb */}
        <header className="space-y-4 pb-6 border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/teacher/dashboard")}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100 transition-all cursor-pointer"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Teacher Dashboard
            </button>
            <span className="text-xs font-mono text-zinc-400">
              Assessment ID: {assessmentId}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                  {data.className || "General"}
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-semibold rounded">
                  {data.assessmentType}
                </span>
                {data.topic && (
                  <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-mono rounded">
                    {data.topic}
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl font-normal text-[#111111]">
                {data.assessmentTitle}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right font-mono">
                <span className="text-xs text-zinc-400 block">Passing Criteria</span>
                <span className="text-sm font-bold text-[#111111]">
                  {data.passingMarks} / {data.totalMarks} marks
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
              Total Submissions
            </span>
            <span className="text-2xl font-bold font-mono text-[#111111]">
              {data.totalAttempts}
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
              Class Average
            </span>
            <span className="text-2xl font-bold font-mono text-[#111111]">
              {Math.round(data.avgScore)}%
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
              Pass Rate
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {passRate}%
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
              Highest Score
            </span>
            <span className="text-2xl font-bold font-mono text-blue-700">
              {data.highestScore}
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-1">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
              Lowest Score
            </span>
            <span className="text-2xl font-bold font-mono text-amber-700">
              {data.lowestScore}
            </span>
          </div>
        </div>

        {/* Section Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
          <button
            onClick={() => setActiveSection("students")}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeSection === "students"
                ? "bg-[#111111] text-white shadow-2xs"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
            }`}
          >
            Student Results ({data.studentResults?.length || 0})
          </button>
          <button
            onClick={() => setActiveSection("questions")}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeSection === "questions"
                ? "bg-[#111111] text-white shadow-2xs"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
            }`}
          >
            Question Item Analysis ({data.questionAnalysis?.length || 0})
          </button>
        </div>

        {/* Section 1: Student Roster Submissions */}
        {activeSection === "students" && (
          <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 bg-[#F4F4F6] border-b border-zinc-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111111]">
                Evaluated Student Submissions
              </h2>
              <span className="text-xs font-mono text-zinc-500">
                Click any student row to expand full answer breakdown
              </span>
            </div>

            <div className="divide-y divide-zinc-200">
              {data.studentResults?.map((stu) => {
                const isExpanded = expandedStudent === stu.studentId;
                return (
                  <div key={stu.studentId} className="transition-all">
                    <div
                      onClick={() =>
                        setExpandedStudent(isExpanded ? null : stu.studentId)
                      }
                      className="p-4 hover:bg-[#F9F9FB] flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-xs text-[#111111]">
                          {stu.studentName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#111111]">
                            {stu.studentName}
                          </h3>
                          <span className="text-xs text-zinc-400 font-mono">
                            {stu.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-[#111111]">
                            {stu.score} / {stu.maxScore} marks
                          </span>
                          <span className="text-[11px] text-zinc-400 block">
                            Time: {stu.timeTakenMinutes} mins
                          </span>
                        </div>

                        <ScoreBadge pct={stu.percentage} />

                        <span
                          className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded ${
                            stu.passed
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {stu.passed ? "PASSED" : "NEEDS REVISION"}
                        </span>

                        {isExpanded ? (
                          <ChevronUpIcon className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-zinc-500" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Answer Breakdown */}
                    {isExpanded && (
                      <div className="p-4 bg-[#F9F9FB] border-t border-zinc-200 space-y-3 text-xs">
                        <h4 className="font-mono font-bold text-zinc-800 uppercase tracking-wider text-[11px]">
                          Individual Answer Breakdown
                        </h4>
                        <div className="space-y-2">
                          {stu.answers?.map((ans, aIdx) => (
                            <div
                              key={aIdx}
                              className="p-3 bg-white border border-zinc-200 rounded-lg flex items-center justify-between gap-4"
                            >
                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#111111]">
                                    Q{aIdx + 1}.
                                  </span>
                                  <span className="text-zinc-800">
                                    {ans.questionText}
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-zinc-400">
                                  Topic: {ans.topic}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 font-mono">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                    ans.isCorrect
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : "bg-rose-100 text-rose-800 border border-rose-300"
                                  }`}
                                >
                                  {ans.isCorrect ? "Correct" : "Incorrect"}
                                </span>
                                <span className="font-semibold text-[#111111]">
                                  {ans.marksObtained} / {ans.maxMarks} pts
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Question Item Analysis */}
        {activeSection === "questions" && (
          <div className="bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 bg-[#F4F4F6] border-b border-zinc-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111111]">
                Question Difficulty & Accuracy Analysis
              </h2>
              <span className="text-xs font-mono text-zinc-500">
                Identify questions where students struggled
              </span>
            </div>

            <div className="p-4 space-y-4">
              {data.questionAnalysis?.map((q, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#F9F9FB] border border-zinc-200 rounded-lg space-y-2"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#111111]">
                          Q{idx + 1}.
                        </span>
                        <span className="text-xs font-semibold text-[#111111]">
                          {q.questionText}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        Topic: {q.topic}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-xs">
                      <span className="text-zinc-500">
                        Answered: {q.totalAnswered}
                      </span>
                      <span className="text-emerald-700 font-bold">
                        {q.correctCount} Correct
                      </span>
                      <ScoreBadge pct={q.accuracy} />
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        q.accuracy >= 75
                          ? "bg-emerald-600"
                          : q.accuracy >= 50
                            ? "bg-blue-600"
                            : "bg-rose-500"
                      }`}
                      style={{ width: `${q.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
