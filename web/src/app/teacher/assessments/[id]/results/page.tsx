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
  EyeOpenIcon,
  CheckCircledIcon,
  ImageIcon,
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

export interface WorkbookSubmissionResult {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  avatarUrl?: string | null;
  fileName: string;
  fileUrl: string;
  status: string;
  obtainedMarks?: number | null;
  maxMarks: number;
  feedback?: string | null;
  submittedAt: string;
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
  isWorkbook?: boolean;
  workbookUrl?: string;
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
  workbookSubmissions?: WorkbookSubmissionResult[];
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
  const [activeSection, setActiveSection] = useState<
    "students" | "questions" | "workbooks"
  >("students");

  // Workbook Image Zoom Lightbox State
  const [zoomedImage, setZoomedImage] = useState<{
    url: string;
    studentName: string;
  } | null>(null);

  // Workbook Grading State
  const [editingWorkbookId, setEditingWorkbookId] = useState<string | null>(
    null,
  );
  const [gradeMarks, setGradeMarks] = useState<number | "">(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      setLoading(true);
      try {
        const res = await apiFetch<AssessmentResultsSummary>(
          `/assessments/${assessmentId}/results`,
        );
        setData(res || null);
        if (
          res?.isWorkbook ||
          (res?.workbookSubmissions &&
            res.workbookSubmissions.length > 0 &&
            res.totalAttempts === 0)
        ) {
          setActiveSection("workbooks");
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [assessmentId]);

  const handleGradeWorkbook = async (workbookId: string) => {
    if (gradeMarks === "") return;
    setEvaluatingId(workbookId);
    try {
      await apiFetch(`/workbooks/${workbookId}/evaluate`, {
        method: "PATCH",
        body: JSON.stringify({
          obtainedMarks: Number(gradeMarks),
          feedback: gradeFeedback,
        }),
      });

      const res = await apiFetch<AssessmentResultsSummary>(
        `/assessments/${assessmentId}/results`,
      );
      setData(res || null);
      setEditingWorkbookId(null);
      alert("Workbook evaluated and graded successfully!");
    } catch (err: any) {
      alert(err?.message || "Failed to evaluate workbook.");
    } finally {
      setEvaluatingId(null);
    }
  };

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

  if (
    !data ||
    (data.totalAttempts === 0 &&
      (!data.workbookSubmissions || data.workbookSubmissions.length === 0))
  ) {
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
              Students have not submitted any test attempts or workbook
              solutions for this assessment yet. Evaluation analytics will
              appear here automatically once submissions are received.
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
              <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to Teacher
              Dashboard
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
                <span className="text-xs text-zinc-400 block">
                  Passing Criteria
                </span>
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
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 flex-wrap">
          <button
            onClick={() => setActiveSection("students")}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeSection === "students"
                ? "bg-[#111111] text-white shadow-2xs"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100"
            }`}
          >
            Student Test Results ({data.studentResults?.length || 0})
          </button>
          <button
            onClick={() => setActiveSection("workbooks")}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === "workbooks"
                ? "bg-amber-700 text-white shadow-2xs font-bold"
                : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-semibold"
            }`}
          >
            <ReaderIcon className="w-3.5 h-3.5" />
            Workbook Submissions & Solved Sheets (
            {data.workbookSubmissions?.length || 0})
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

        {/* Section 3: Workbook Submissions */}
        {activeSection === "workbooks" && (
          <div className="space-y-6">
            <div className="bg-[#F4F4F6] border border-zinc-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#111111] flex items-center gap-2">
                  <ReaderIcon className="w-4 h-4 text-amber-700" />
                  Workbook Solved Submissions (
                  {data.workbookSubmissions?.length || 0})
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Review handwritten workbook solutions uploaded by students,
                  inspect solved sheets in high resolution, and grade
                  submissions.
                </p>
              </div>
              {data.workbookUrl && (
                <a
                  href={data.workbookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg transition-all shadow-xs"
                >
                  View Teacher's Master Workbook Sheet
                </a>
              )}
            </div>

            {!data.workbookSubmissions ||
            data.workbookSubmissions.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-500 text-xs space-y-1">
                <p className="font-semibold text-zinc-700">
                  No workbook submissions uploaded yet.
                </p>
                <p className="text-zinc-400">
                  Students will upload photos or URLs of their solved physical
                  workbooks here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.workbookSubmissions.map((wb) => (
                  <div
                    key={wb.id}
                    className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between space-y-4 p-5 hover:border-zinc-300 transition-all"
                  >
                    {/* Student Info Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center font-bold text-amber-900 text-sm overflow-hidden">
                          {wb.avatarUrl ? (
                            <img
                              src={wb.avatarUrl}
                              alt={wb.studentName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            wb.studentName.charAt(0)
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#111111]">
                            {wb.studentName}
                          </h3>
                          <span className="text-xs text-zinc-400 font-mono block">
                            {wb.email}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded ${
                          wb.status === "EVALUATED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : wb.status === "FAILED"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                        }`}
                      >
                        {wb.status}
                      </span>
                    </div>

                    {/* Solved Workbook Image Preview Card */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                        <span className="truncate max-w-50 font-semibold text-zinc-700">
                          {wb.fileName || "Workbook_Page.png"}
                        </span>
                        <span>
                          {new Date(wb.submittedAt).toLocaleDateString()}{" "}
                          {new Date(wb.submittedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        onClick={() =>
                          setZoomedImage({
                            url: wb.fileUrl,
                            studentName: wb.studentName,
                          })
                        }
                        className="relative group rounded-xl overflow-hidden border border-zinc-200 bg-zinc-950 min-h-55 max-h-72 flex items-center justify-center cursor-pointer"
                      >
                        <img
                          src={wb.fileUrl}
                          alt={`Workbook submission by ${wb.studentName}`}
                          className="w-full h-64 object-contain group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-mono text-xs font-bold">
                          <EyeOpenIcon className="w-5 h-5" />
                          Click to View Full Size Image
                        </div>
                      </div>
                    </div>

                    {/* Evaluation & Grading Section */}
                    <div className="pt-2 border-t border-zinc-100 space-y-3">
                      {wb.obtainedMarks !== undefined &&
                      wb.obtainedMarks !== null ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="text-emerald-800 block text-[10px] uppercase font-bold">
                              EVALUATED SCORE
                            </span>
                            <span className="text-sm font-bold text-emerald-950">
                              {wb.obtainedMarks} / {wb.maxMarks} Marks
                            </span>
                          </div>
                          {wb.feedback && (
                            <span className="text-xs text-emerald-900 font-sans italic max-w-xs truncate">
                              "{wb.feedback}"
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setEditingWorkbookId(wb.id);
                              setGradeMarks(wb.obtainedMarks || 0);
                              setGradeFeedback(wb.feedback || "");
                            }}
                            className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 text-[11px] font-bold rounded hover:bg-emerald-100 transition-all cursor-pointer"
                          >
                            Edit Grade
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-xs">
                          <span className="text-amber-900 font-bold font-mono text-[11px] block uppercase">
                            Needs Teacher Evaluation
                          </span>
                          <button
                            onClick={() => {
                              setEditingWorkbookId(wb.id);
                              setGradeMarks(wb.maxMarks);
                              setGradeFeedback("");
                            }}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                          >
                            Grade This Workbook
                          </button>
                        </div>
                      )}

                      {/* Inline Grade Form */}
                      {editingWorkbookId === wb.id && (
                        <div className="p-4 bg-zinc-50 border border-zinc-300 rounded-xl space-y-3 text-xs animate-in fade-in duration-150">
                          <div className="flex items-center justify-between font-mono font-bold text-zinc-800">
                            <span>Grade Workbook: {wb.studentName}</span>
                            <button
                              onClick={() => setEditingWorkbookId(null)}
                              className="text-zinc-400 hover:text-zinc-600 p-1"
                            >
                              <Cross2Icon className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-mono text-zinc-500 block uppercase">
                                Obtained Marks
                              </label>
                              <input
                                type="number"
                                max={wb.maxMarks}
                                min={0}
                                value={gradeMarks}
                                onChange={(e) =>
                                  setGradeMarks(
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value),
                                  )
                                }
                                className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-zinc-500 block uppercase">
                                Max Marks
                              </label>
                              <input
                                type="text"
                                disabled
                                value={`${wb.maxMarks} Marks`}
                                className="w-full px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded text-xs font-bold text-zinc-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-zinc-500 block uppercase">
                              Teacher Feedback / Notes
                            </label>
                            <textarea
                              rows={2}
                              value={gradeFeedback}
                              onChange={(e) => setGradeFeedback(e.target.value)}
                              placeholder="Feedback for student..."
                              className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => setEditingWorkbookId(null)}
                              className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-200 rounded transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleGradeWorkbook(wb.id)}
                              disabled={evaluatingId === wb.id}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs transition-all cursor-pointer"
                            >
                              {evaluatingId === wb.id
                                ? "Saving..."
                                : "Save Grade"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* High-Res Zoom Image Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white font-mono text-xs">
              <span className="font-bold flex items-center gap-2">
                <EyeOpenIcon className="w-4 h-4 text-emerald-400" />
                Workbook Solved Sheet — {zoomedImage.studentName}
              </span>
              <button
                onClick={() => setZoomedImage(null)}
                className="text-zinc-400 hover:text-white p-1.5 rounded hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-black">
              <img
                src={zoomedImage.url}
                alt={`Full res submission by ${zoomedImage.studentName}`}
                className="max-w-full max-h-[75vh] object-contain rounded-lg border border-zinc-800 shadow-xl"
              />
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span className="truncate max-w-md">
                Image URL: {zoomedImage.url}
              </span>
              <a
                href={zoomedImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-semibold transition-all"
              >
                Open Original Image in New Tab ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
