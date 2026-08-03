"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  BarChartIcon,
  ArrowLeftIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  PersonIcon,
  ClockIcon,
  TargetIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";

interface StudentResult {
  studentId: string;
  studentName: string;
  email: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeTakenMinutes: number;
  submittedAt: string;
  passed: boolean;
  answers: {
    questionText: string;
    topic: string;
    isCorrect: boolean | null;
    marksObtained: number;
    maxMarks: number;
  }[];
}

interface AssessmentResultsSummary {
  assessmentId: string;
  assessmentTitle: string;
  className: string;
  topic: string;
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

// ── Mock data for demo ──
const buildMockResults = (id: string): AssessmentResultsSummary => ({
  assessmentId: id,
  assessmentTitle: "Algorithm Complexity & Data Structures Quiz",
  className: "1st Sem",
  topic: "Computer Science",
  assessmentType: "QUIZ",
  totalMarks: 25,
  passingMarks: 15,
  durationMinutes: 30,
  totalAttempts: 5,
  avgScore: 78,
  passCount: 4,
  failCount: 1,
  highestScore: 92,
  lowestScore: 48,
  questionAnalysis: [
    {
      questionText: "What is the avg time complexity of QuickSort?",
      topic: "Sorting",
      totalAnswered: 5,
      correctCount: 4,
      accuracy: 80,
    },
    {
      questionText: "Which data structure uses LIFO?",
      topic: "Data Structures",
      totalAnswered: 5,
      correctCount: 5,
      accuracy: 100,
    },
    {
      questionText: "What is the space complexity of Merge Sort?",
      topic: "Sorting",
      totalAnswered: 5,
      correctCount: 3,
      accuracy: 60,
    },
    {
      questionText: "True or False: BFS uses a queue?",
      topic: "Graphs",
      totalAnswered: 5,
      correctCount: 4,
      accuracy: 80,
    },
    {
      questionText: "Define recursion and give an example.",
      topic: "Recursion",
      totalAnswered: 5,
      correctCount: 2,
      accuracy: 40,
    },
  ],
  studentResults: [
    {
      studentId: "stu-001",
      studentName: "Aarav Mehta",
      email: "aarav.mehta@student.edu",
      score: 23,
      maxScore: 25,
      percentage: 92,
      timeTakenMinutes: 24,
      submittedAt: "2026-07-28T09:45:00Z",
      passed: true,
      answers: [
        {
          questionText: "What is the avg time complexity of QuickSort?",
          topic: "Sorting",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "Which data structure uses LIFO?",
          topic: "Data Structures",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "What is the space complexity of Merge Sort?",
          topic: "Sorting",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "True or False: BFS uses a queue?",
          topic: "Graphs",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "Define recursion and give an example.",
          topic: "Recursion",
          isCorrect: false,
          marksObtained: 3,
          maxMarks: 5,
        },
      ],
    },
    {
      studentId: "stu-002",
      studentName: "Priya Sharma",
      email: "priya.sharma@student.edu",
      score: 20,
      maxScore: 25,
      percentage: 80,
      timeTakenMinutes: 27,
      submittedAt: "2026-07-28T10:20:00Z",
      passed: true,
      answers: [
        {
          questionText: "What is the avg time complexity of QuickSort?",
          topic: "Sorting",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "Which data structure uses LIFO?",
          topic: "Data Structures",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "What is the space complexity of Merge Sort?",
          topic: "Sorting",
          isCorrect: false,
          marksObtained: 0,
          maxMarks: 5,
        },
        {
          questionText: "True or False: BFS uses a queue?",
          topic: "Graphs",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "Define recursion and give an example.",
          topic: "Recursion",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
      ],
    },
    {
      studentId: "stu-003",
      studentName: "Rohan Kulkarni",
      email: "rohan.k@student.edu",
      score: 17,
      maxScore: 25,
      percentage: 68,
      timeTakenMinutes: 29,
      submittedAt: "2026-07-28T10:00:00Z",
      passed: true,
      answers: [
        {
          questionText: "What is the avg time complexity of QuickSort?",
          topic: "Sorting",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "Which data structure uses LIFO?",
          topic: "Data Structures",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "What is the space complexity of Merge Sort?",
          topic: "Sorting",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "True or False: BFS uses a queue?",
          topic: "Graphs",
          isCorrect: false,
          marksObtained: 0,
          maxMarks: 5,
        },
        {
          questionText: "Define recursion and give an example.",
          topic: "Recursion",
          isCorrect: false,
          marksObtained: 2,
          maxMarks: 5,
        },
      ],
    },
    {
      studentId: "stu-005",
      studentName: "Dev Agarwal",
      email: "dev.a@student.edu",
      score: 16,
      maxScore: 25,
      percentage: 64,
      timeTakenMinutes: 30,
      submittedAt: "2026-07-28T10:45:00Z",
      passed: true,
      answers: [
        {
          questionText: "What is the avg time complexity of QuickSort?",
          topic: "Sorting",
          isCorrect: false,
          marksObtained: 0,
          maxMarks: 5,
        },
        {
          questionText: "Which data structure uses LIFO?",
          topic: "Data Structures",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "What is the space complexity of Merge Sort?",
          topic: "Sorting",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "True or False: BFS uses a queue?",
          topic: "Graphs",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "Define recursion and give an example.",
          topic: "Recursion",
          isCorrect: false,
          marksObtained: 1,
          maxMarks: 5,
        },
      ],
    },
    {
      studentId: "stu-006",
      studentName: "Ananya Singh",
      email: "ananya.s@student.edu",
      score: 12,
      maxScore: 25,
      percentage: 48,
      timeTakenMinutes: 30,
      submittedAt: "2026-07-28T11:00:00Z",
      passed: false,
      answers: [
        {
          questionText: "What is the avg time complexity of QuickSort?",
          topic: "Sorting",
          isCorrect: false,
          marksObtained: 0,
          maxMarks: 5,
        },
        {
          questionText: "Which data structure uses LIFO?",
          topic: "Data Structures",
          isCorrect: true,
          marksObtained: 5,
          maxMarks: 5,
        },
        {
          questionText: "What is the space complexity of Merge Sort?",
          topic: "Sorting",
          isCorrect: false,
          marksObtained: 0,
          maxMarks: 5,
        },
        {
          questionText: "True or False: BFS uses a queue?",
          topic: "Graphs",
          isCorrect: false,
          marksObtained: 0,
          maxMarks: 5,
        },
        {
          questionText: "Define recursion and give an example.",
          topic: "Recursion",
          isCorrect: false,
          marksObtained: 2,
          maxMarks: 5,
        },
      ],
    },
  ],
});

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
      try {
        const res = await apiFetch<AssessmentResultsSummary>(
          `/assessments/${assessmentId}/results`,
        );
        setData(res ?? buildMockResults(assessmentId));
      } catch {
        setData(buildMockResults(assessmentId));
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [assessmentId]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-400">
            Loading results...
          </span>
        </div>
      </div>
    );
  }

  const passRate =
    data.totalAttempts > 0
      ? Math.round((data.passCount / data.totalAttempts) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans px-6 pt-6 pb-24 md:px-12 md:pt-12 selection:bg-[#111111] selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/teacher/dashboard")}
              className="p-2 hover:bg-zinc-100 rounded-md transition-all cursor-pointer"
            >
              <ArrowLeftIcon className="w-4 h-4 text-zinc-600" />
            </button>
            <div className="w-9 h-9 bg-[#111111] rounded-lg flex items-center justify-center">
              <BarChartIcon className="text-white w-4 h-4" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-normal text-[#111111]">
                Assessment Results
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Teacher: {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
        </header>

        {/* Assessment Info Banner */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                  {data.className}
                </span>
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-mono rounded">
                  {data.assessmentType}
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-mono rounded border border-blue-200">
                  {data.topic}
                </span>
              </div>
              <h2 className="font-serif text-xl font-normal text-[#111111]">
                {data.assessmentTitle}
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                {data.totalMarks} total marks · {data.passingMarks} passing ·{" "}
                {data.durationMinutes} mins
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-6 shrink-0">
              <div className="text-center">
                <p
                  className={`text-3xl font-bold font-mono ${data.avgScore >= 70 ? "text-emerald-600" : data.avgScore >= 50 ? "text-blue-600" : "text-red-600"}`}
                >
                  {Math.round(data.avgScore)}%
                </p>
                <p className="text-[10px] font-mono text-zinc-400 uppercase mt-0.5">
                  Avg Score
                </p>
              </div>
              <div className="text-center">
                <p
                  className={`text-3xl font-bold font-mono ${passRate >= 70 ? "text-emerald-600" : passRate >= 50 ? "text-blue-600" : "text-red-600"}`}
                >
                  {passRate}%
                </p>
                <p className="text-[10px] font-mono text-zinc-400 uppercase mt-0.5">
                  Pass Rate
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Attempts", value: data.totalAttempts, color: "" },
            {
              label: "Passed",
              value: data.passCount,
              color: "text-emerald-600",
            },
            { label: "Failed", value: data.failCount, color: "text-red-600" },
            {
              label: "Highest Score",
              value: `${data.highestScore}%`,
              color: "text-emerald-600",
            },
            {
              label: "Lowest Score",
              value: `${data.lowestScore}%`,
              color: "text-red-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm text-center"
            >
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                {stat.label}
              </span>
              <span
                className={`text-2xl font-bold font-mono mt-1 block ${stat.color || "text-[#111111]"}`}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Section Toggle */}
        <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl p-1.5 shadow-sm w-fit">
          {[
            {
              id: "students" as const,
              label: "Student Results",
              icon: <PersonIcon className="w-3.5 h-3.5" />,
            },
            {
              id: "questions" as const,
              label: "Question Analysis",
              icon: <TargetIcon className="w-3.5 h-3.5" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSection === tab.id
                  ? "bg-[#111111] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Student Results ── */}
        {activeSection === "students" && (
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-zinc-100 flex items-center gap-2">
              <PersonIcon className="w-4 h-4 text-[#111111]" />
              <h3 className="font-serif text-lg font-normal text-[#111111]">
                Individual Student Results ({data.studentResults.length})
              </h3>
            </div>

            <div className="divide-y divide-zinc-100">
              {data.studentResults
                .sort((a, b) => b.percentage - a.percentage)
                .map((student, idx) => (
                  <div key={student.studentId}>
                    <div
                      className="flex items-center gap-4 px-5 py-4 hover:bg-[#F9F9FB] cursor-pointer transition-colors"
                      onClick={() =>
                        setExpandedStudent(
                          expandedStudent === student.studentId
                            ? null
                            : student.studentId,
                        )
                      }
                    >
                      {/* Rank */}
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-zinc-200 text-zinc-700" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-zinc-100 text-zinc-500"}`}
                      >
                        {idx + 1}
                      </span>

                      {/* Avatar */}
                      <div className="w-9 h-9 bg-[#5451FF]/10 border border-[#5451FF]/20 rounded-full flex items-center justify-center text-sm font-bold text-[#5451FF] shrink-0">
                        {student.studentName.charAt(0)}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111111] truncate">
                          {student.studentName}
                        </p>
                        <p className="text-[11px] font-mono text-zinc-400">
                          {student.email}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-[#111111]">
                            {student.score}/{student.maxScore}
                          </span>
                          <ScoreBadge pct={student.percentage} />
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                          {student.passed ? (
                            <span className="text-emerald-600 flex items-center gap-1 justify-end">
                              <CheckCircledIcon className="w-3 h-3" /> Passed
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1 justify-end">
                              <CrossCircledIcon className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="text-right shrink-0 hidden md:block">
                        <p className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {student.timeTakenMinutes} min
                        </p>
                        <p className="text-[10px] font-mono text-zinc-300 mt-0.5">
                          {new Date(student.submittedAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}
                        </p>
                      </div>

                      {/* Expand toggle */}
                      <div className="shrink-0 ml-2">
                        {expandedStudent === student.studentId ? (
                          <ChevronUpIcon className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded: Per-question breakdown */}
                    {expandedStudent === student.studentId && (
                      <div className="px-5 pb-5 bg-[#F9F9FB] border-t border-zinc-100">
                        <p className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider py-3">
                          Question-by-Question Breakdown
                        </p>
                        <div className="space-y-2">
                          {student.answers.map((ans, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-zinc-200"
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${ans.isCorrect === true ? "bg-emerald-100 text-emerald-600" : ans.isCorrect === false ? "bg-red-100 text-red-500" : "bg-zinc-100 text-zinc-400"}`}
                                >
                                  {ans.isCorrect === true ? (
                                    <CheckCircledIcon className="w-3.5 h-3.5" />
                                  ) : ans.isCorrect === false ? (
                                    <CrossCircledIcon className="w-3.5 h-3.5" />
                                  ) : (
                                    <span className="text-[10px] font-mono">
                                      ?
                                    </span>
                                  )}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-[#111111] truncate">
                                    Q{i + 1}. {ans.questionText}
                                  </p>
                                  <span className="text-[10px] font-mono text-zinc-400">
                                    {ans.topic}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs font-mono font-bold text-[#111111] shrink-0 ml-4">
                                {ans.marksObtained}/{ans.maxMarks}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Question Analysis ── */}
        {activeSection === "questions" && (
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5 border-b border-zinc-100 pb-3">
              <TargetIcon className="w-4 h-4 text-[#111111]" />
              <h3 className="font-serif text-xl font-normal text-[#111111]">
                Question Difficulty Analysis
              </h3>
            </div>
            <div className="space-y-4">
              {data.questionAnalysis
                .sort((a, b) => a.accuracy - b.accuracy)
                .map((q, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#111111] truncate">
                          Q{idx + 1}. {q.questionText}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400 mt-0.5">
                          <span>{q.topic}</span>
                          <span>·</span>
                          <span>
                            {q.correctCount}/{q.totalAnswered} correct
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {q.accuracy < 50 && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-mono rounded border border-red-200">
                            Hard
                          </span>
                        )}
                        <ScoreBadge pct={q.accuracy} />
                      </div>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${q.accuracy >= 70 ? "bg-emerald-500" : q.accuracy >= 50 ? "bg-blue-500" : "bg-red-400"}`}
                        style={{ width: `${q.accuracy}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-mono text-zinc-400">
                      {q.accuracy < 50
                        ? "⚠️ Most students struggled — review this topic in class"
                        : q.accuracy >= 90
                          ? "✓ Well understood by class"
                          : "Average performance"}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
