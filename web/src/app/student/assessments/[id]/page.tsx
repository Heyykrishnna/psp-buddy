"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { AssessmentDTO, QuestionDTO, OptionDTO } from "@/types";
import { evaluateCodeSolution } from "@/lib/codeEvaluator";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Bookmark,
  Play,
  Send,
  FileText,
  Sparkles,
  Lightbulb,
  Settings,
  Minimize2,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Target,
  HelpCircle,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

// Dynamically import Monaco Editor to prevent SSR issues
const MonacoPlayground = dynamic(
  () => import("@/components/MonacoPlayground"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-white flex items-center justify-center text-zinc-400 font-mono text-xs border border-zinc-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
          Loading Monaco Code Editor...
        </div>
      </div>
    ),
  },
);

export default function StudentAssessmentRunnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const assessmentId = resolvedParams.id;
  const { user } = useAuth();
  const router = useRouter();

  // Primary Data State
  const [assessment, setAssessment] = useState<AssessmentDTO | null>(null);
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"OVERVIEW" | "RUNNER">("OVERVIEW");

  // Attempt State
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<
      string,
      { optionId?: string; textAnswer?: string; booleanAnswer?: boolean }
    >
  >({});
  const [codingSolutions, setCodingSolutions] = useState<
    Record<string, string>
  >({});
  const [codingLanguages, setCodingLanguages] = useState<
    Record<string, string>
  >({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(900);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Left Panel & Console Tabs UI State
  const [activeLeftTab, setActiveLeftTab] = useState<
    "question" | "ai" | "hints"
  >("question");
  const [activeConsoleTab, setActiveConsoleTab] = useState<
    "input" | "output" | "error" | "tests"
  >("output");
  const [customInput, setCustomInput] = useState<string>("");

  // Code Execution State
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evalOutput, setEvalOutput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [evalResults, setEvalResults] = useState<any[] | null>(null);

  // Load Assessment details on mount
  useEffect(() => {
    async function loadAssessment() {
      try {
        const data = await apiFetch<AssessmentDTO>(
          `/assessments/${assessmentId}`,
        );
        if (data) {
          setAssessment(data);
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
          }
        }
      } catch (err) {
        console.error("Failed to load assessment:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAssessment();
  }, [assessmentId]);

  // Countdown Timer when in RUNNER mode
  useEffect(() => {
    if (mode !== "RUNNER" || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, timeLeftSeconds]);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Start Assessment Attempt
  const handleStartAttempt = async () => {
    setLoading(true);
    try {
      const studentIdentifier = user?.id || "student";
      const attempt = await apiFetch<any>(
        `/assessments/${assessmentId}/attempts`,
        {
          method: "POST",
          body: JSON.stringify({ studentId: studentIdentifier }),
        },
      );

      if (attempt) {
        setAttemptId(attempt.id);

        if (attempt.answers && Array.isArray(attempt.answers)) {
          const restored: Record<string, any> = {};
          const restoredCode: Record<string, string> = {};
          attempt.answers.forEach((ans: any) => {
            restored[ans.questionId] = {
              optionId: ans.selectedOptionId,
              textAnswer: ans.textAnswer,
              booleanAnswer: ans.booleanAnswer,
            };
            if (ans.textAnswer) {
              restoredCode[ans.questionId] = ans.textAnswer;
            }
          });
          setSelectedAnswers(restored);
          setCodingSolutions(restoredCode);
        }
      }
    } catch {
      setAttemptId(`attempt-${Date.now()}`);
    } finally {
      setTimeLeftSeconds((assessment?.durationMinutes || 15) * 60);
      setCurrentIdx(0);
      setMode("RUNNER");
      setLoading(false);
    }
  };

  // Save Answer & sync with backend
  const handleAnswerSelect = async (
    qId: string,
    answer: { optionId?: string; textAnswer?: string; booleanAnswer?: boolean },
  ) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: answer,
    }));

    if (attemptId && !attemptId.startsWith("attempt-")) {
      try {
        await apiFetch(`/attempts/${attemptId}/answers`, {
          method: "PATCH",
          body: JSON.stringify({
            questionId: qId,
            selectedOptionId: answer.optionId,
            textAnswer: answer.textAnswer,
            booleanAnswer: answer.booleanAnswer,
          }),
        });
      } catch (err) {
        console.warn("Autosave warning:", err);
      }
    }
  };

  // Run Code logic for Coding Question
  const handleRunCode = (question: QuestionDTO) => {
    const codeToRun =
      codingSolutions[question.id] || question.starterCode || "";
    const lang = codingLanguages[question.id] || "python";

    setEvaluating(true);
    setActiveConsoleTab("output");
    setEvalOutput("Compiling and executing code against test cases...");
    setErrorMessage(null);
    setEvalResults(null);

    setTimeout(() => {
      const outcome = evaluateCodeSolution(
        codeToRun,
        lang,
        question.testCases || [],
      );

      if (outcome.error) {
        setErrorMessage(outcome.error);
        setActiveConsoleTab("error");
        setEvalOutput("");
      } else {
        setEvalOutput(
          outcome.logs ||
            (outcome.allPassed
              ? `All ${outcome.totalPassed}/${outcome.totalTests} test cases passed successfully!`
              : `Passed ${outcome.totalPassed}/${outcome.totalTests} test cases.`),
        );
      }

      setEvalResults(outcome.testResults || []);
      setEvaluating(false);

      handleAnswerSelect(question.id, { textAnswer: codeToRun });
    }, 400);
  };

  // Final Submit Attempt
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      if (attemptId && !attemptId.startsWith("attempt-")) {
        await apiFetch(`/attempts/${attemptId}/submit`, {
          method: "POST",
        });
        router.push(`/student/attempts/${attemptId}/result`);
      } else {
        router.push(`/student/assessments`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="h-screen w-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-500">
            Loading Assessment IDE Workspace...
          </span>
        </div>
      </main>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#F8F9FA] text-[#111111] font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* ── OVERVIEW MODE LANDING SCREEN ───────────────────────────────────────── */}
      {mode === "OVERVIEW" && (
        <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 shadow-sm space-y-8 relative overflow-hidden">
            <div className="space-y-3 text-center max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 flex-wrap font-mono text-[10px]">
                <span className="px-2.5 py-0.5 bg-[#111111] text-white font-bold rounded">
                  {assessment?.className || "Computer Science"}
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded uppercase">
                  {assessment?.assessmentType || "PRACTICE"}
                </span>
                {assessment?.topic && (
                  <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 rounded">
                    {assessment.topic}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-2xl md:text-3xl font-normal text-[#111111]">
                {assessment?.title || "Playground Assessment"}
              </h1>

              <p className="text-xs text-zinc-500 leading-relaxed font-sans max-w-xl mx-auto">
                {assessment?.description ||
                  "Test your coding, logic, and problem-solving skills interactively in the Web Code Playground."}
              </p>
            </div>

            {/* Metadata Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                  Duration
                </span>
                <span className="text-base font-bold text-[#111111] mt-1 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  {assessment?.durationMinutes || 30} mins
                </span>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                  Questions
                </span>
                <span className="text-base font-bold text-[#111111] mt-1 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4 text-zinc-500" />
                  {questions.length || assessment?._count?.questions || 5} Total
                </span>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                  Total Marks
                </span>
                <span className="text-base font-bold text-[#111111] mt-1 flex items-center gap-1">
                  <Target className="w-4 h-4 text-zinc-500" />
                  {assessment?.totalMarks || 50} Marks
                </span>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                  Passing Score
                </span>
                <span className="text-base font-bold text-[#111111] mt-1 flex items-center gap-1">
                  <Award className="w-4 h-4 text-zinc-500" />
                  {assessment?.passingMarks || 20} Marks
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={handleStartAttempt}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Assessment IDE
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => router.push("/student/assessments")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Back to Assessments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RUNNER MODE IDE WORKSPACE (Matching Image 2) ────────────────────────── */}
      {mode === "RUNNER" && currentQ && (
        <>
          {/* Top Navbar Header (Image 2 style) */}
          <header className="h-14 bg-white border-b border-zinc-200 px-4 flex items-center justify-between shrink-0 z-30 shadow-2xs">
            {/* Left: Back + Title + Question Pill Selector */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-black transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <span className="text-zinc-300 font-mono">|</span>
              <h1 className="text-sm font-semibold text-zinc-900 truncate max-w-xs md:max-w-md">
                {assessment?.title}
              </h1>

              {/* Question Pills */}
              <div className="hidden md:flex items-center gap-1.5 ml-4">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIdx;
                  const isAnswered = !!selectedAnswers[q.id];

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isCurrent
                          ? "bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-1"
                          : isAnswered
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Timer + XP + Actions */}
            <div className="flex items-center gap-3">
              {/* Countdown Timer */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border transition-all ${
                  timeLeftSeconds < 120
                    ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                    : "bg-zinc-100 text-zinc-800 border-zinc-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>

              {/* XP Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-900 font-mono">
                <span className="text-zinc-500 text-[11px] font-sans font-semibold">
                  Total XP
                </span>
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>31,923</span>
              </div>

              <button
                title="Bookmark Problem"
                className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              {/* Run Button (for Coding questions) */}
              {currentQ.questionType === "CODING" && (
                <button
                  onClick={() => handleRunCode(currentQ)}
                  disabled={evaluating}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-800 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-zinc-800" />
                  <span>{evaluating ? "Running..." : "Run"}</span>
                </button>
              )}

              {/* Submit Button */}
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
            </div>
          </header>

          {/* ── MAIN 2-PANEL WORKSPACE SPLIT (Image 2 style) ────────────────────── */}
          <div className="flex-1 flex overflow-hidden">
            {/* Far Left Navigation Icon Rail */}
            <aside className="w-12 bg-white border-r border-zinc-200 flex flex-col items-center justify-between py-3 shrink-0">
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => setActiveLeftTab("question")}
                  title="Question Details"
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    activeLeftTab === "question"
                      ? "text-zinc-900 bg-zinc-100"
                      : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveLeftTab("ai")}
                  title="AI Tutor & Hints"
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    activeLeftTab === "ai"
                      ? "text-zinc-900 bg-zinc-100"
                      : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveLeftTab("hints")}
                  title="Question Hints"
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    activeLeftTab === "hints"
                      ? "text-zinc-900 bg-zinc-100"
                      : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                </button>
              </div>

              <button
                title="Settings"
                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            </aside>

            {/* ── LEFT PANEL: QUESTION / PROBLEM STATEMENT ────────────────────── */}
            <section className="w-5/12 bg-white border-r border-zinc-200 flex flex-col overflow-hidden">
              {/* Header Bar */}
              <div className="h-10 border-b border-zinc-200 px-4 flex items-center justify-between bg-zinc-50/60 shrink-0">
                <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    QUESTION {currentIdx + 1} OF {questions.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <button
                    title="Minimize"
                    className="hover:text-zinc-700 cursor-pointer"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Question Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-800 text-xs leading-relaxed font-sans">
                {/* Title */}
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">
                    {currentQ.questionText}
                  </h2>
                </div>

                {/* Badges Row */}
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  {currentQ.difficulty && (
                    <span
                      className={`px-2.5 py-0.5 font-bold rounded-full ${
                        currentQ.difficulty === "EASY"
                          ? "bg-emerald-100 text-emerald-900"
                          : currentQ.difficulty === "MEDIUM"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-red-100 text-red-900"
                      }`}
                    >
                      {currentQ.difficulty}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 font-semibold rounded">
                    2x
                  </span>
                  <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-800 font-bold rounded">
                    {currentQ.points} Points
                  </span>
                </div>

                {/* Specs */}
                <div className="text-[11px] font-mono text-zinc-400">
                  Time Limit: 2s, Memory Limit: 128000
                </div>

                {/* User Task */}
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-900 text-xs">
                    User Task:
                  </h3>
                  <p className="text-zinc-600 leading-relaxed font-sans">
                    Read the question logic carefully and select or write the
                    appropriate solution to complete the task.
                  </p>
                </div>

                {/* NON-CODING OPTIONS IN QUESTION SIDEBAR */}
                {currentQ.questionType !== "CODING" && (
                  <div className="pt-2 space-y-3">
                    <h3 className="font-bold text-zinc-900 text-xs">
                      Select Your Answer:
                    </h3>

                    {/* Single / Multiple Choice */}
                    {(currentQ.questionType === "SINGLE_CHOICE" ||
                      currentQ.questionType === "MULTIPLE_CHOICE") &&
                      currentQ.options && (
                        <div className="space-y-2.5">
                          {currentQ.options.map(
                            (opt: OptionDTO, oIdx: number) => {
                              const isSelected =
                                selectedAnswers[currentQ.id]?.optionId ===
                                opt.id;
                              const letter = String.fromCharCode(65 + oIdx);

                              return (
                                <button
                                  key={opt.id}
                                  onClick={() =>
                                    handleAnswerSelect(currentQ.id, {
                                      optionId: opt.id,
                                    })
                                  }
                                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                                      : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold flex items-center justify-center border ${
                                        isSelected
                                          ? "bg-white text-zinc-900 border-white"
                                          : "bg-white text-zinc-600 border-zinc-200"
                                      }`}
                                    >
                                      {letter}
                                    </div>
                                    <span className="text-xs font-medium font-sans">
                                      {opt.optionText || opt.text}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  )}
                                </button>
                              );
                            },
                          )}
                        </div>
                      )}

                    {/* True / False */}
                    {currentQ.questionType === "TRUE_FALSE" && (
                      <div className="grid grid-cols-2 gap-3">
                        {[true, false].map((val) => {
                          const isSelected =
                            selectedAnswers[currentQ.id]?.booleanAnswer === val;

                          return (
                            <button
                              key={String(val)}
                              onClick={() =>
                                handleAnswerSelect(currentQ.id, {
                                  booleanAnswer: val,
                                })
                              }
                              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                                  : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800"
                              }`}
                            >
                              <span className="text-sm font-bold font-mono">
                                {val ? "TRUE" : "FALSE"}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer */}
                    {(currentQ.questionType === "SHORT_ANSWER" ||
                      currentQ.questionType === "FILL_IN_BLANKS") && (
                      <textarea
                        rows={4}
                        value={selectedAnswers[currentQ.id]?.textAnswer || ""}
                        onChange={(e) =>
                          handleAnswerSelect(currentQ.id, {
                            textAnswer: e.target.value,
                          })
                        }
                        placeholder="Type your answer text here..."
                        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-sans text-zinc-900 focus:outline-none focus:bg-white focus:border-blue-600 transition-all"
                      />
                    )}
                  </div>
                )}

                {/* Constraints for Coding */}
                {currentQ.questionType === "CODING" && (
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-zinc-900 text-xs">
                      Constraints:
                    </h3>
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg font-mono text-[11px] text-zinc-800 space-y-1">
                      <div>1 ≤ N ≤ 1000</div>
                      <div>0 ≤ Element.data ≤ 100</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Previous / Next Question Navigation Footer */}
              <div className="h-14 border-t border-zinc-200 px-4 flex items-center justify-between bg-zinc-50/40 shrink-0">
                <button
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-1 px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous Question
                </button>

                <button
                  onClick={() =>
                    setCurrentIdx((prev) =>
                      Math.min(questions.length - 1, prev + 1),
                    )
                  }
                  disabled={currentIdx === questions.length - 1}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg disabled:opacity-40 transition-all cursor-pointer"
                >
                  Next Question
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>

            {/* ── RIGHT PANEL: MONACO EDITOR & CONSOLE ────────────────────────── */}
            <section className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Top Monaco Bar */}
              <div className="h-10 border-b border-zinc-200 px-4 flex items-center justify-between bg-zinc-50/60 shrink-0 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <select
                    value={codingLanguages[currentQ.id] || "python"}
                    onChange={(e) =>
                      setCodingLanguages((prev) => ({
                        ...prev,
                        [currentQ.id]: e.target.value,
                      }))
                    }
                    className="bg-white border border-zinc-200 text-zinc-800 rounded px-2.5 py-1 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="python">Python (3.13.1)</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 text-zinc-400">
                  <button
                    onClick={() => {
                      const starter = currentQ.starterCode || "";
                      setCodingSolutions((prev) => ({
                        ...prev,
                        [currentQ.id]: starter,
                      }));
                    }}
                    title="Reset Starter Code"
                    className="hover:text-zinc-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="Fullscreen Toggle"
                    className="hover:text-zinc-700 transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Monaco Code Editor */}
              <div className="flex-1 overflow-hidden relative">
                <MonacoPlayground
                  value={
                    codingSolutions[currentQ.id] !== undefined
                      ? codingSolutions[currentQ.id]
                      : currentQ.starterCode ||
                        "# Write your solution code here\n"
                  }
                  onChange={(val) => {
                    setCodingSolutions((prev) => ({
                      ...prev,
                      [currentQ.id]: val,
                    }));
                    handleAnswerSelect(currentQ.id, { textAnswer: val });
                  }}
                  language={codingLanguages[currentQ.id] || "python"}
                  theme="vs-dark"
                  height="100%"
                />
              </div>

              {/* Bottom Console Panel (INPUT / OUTPUT / ERROR / TEST RESULTS) */}
              <div className="h-52 border-t border-zinc-200 flex flex-col bg-white shrink-0">
                {/* Console Tab Header */}
                <div className="h-9 border-b border-zinc-200 px-4 flex items-center gap-5 bg-zinc-50/60 text-[11px] font-mono font-bold text-zinc-500 shrink-0">
                  <button
                    onClick={() => setActiveConsoleTab("input")}
                    className={`py-1.5 border-b-2 transition-all cursor-pointer ${
                      activeConsoleTab === "input"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent hover:text-zinc-800"
                    }`}
                  >
                    INPUT
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab("output")}
                    className={`py-1.5 border-b-2 transition-all cursor-pointer ${
                      activeConsoleTab === "output"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent hover:text-zinc-800"
                    }`}
                  >
                    OUTPUT
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab("error")}
                    className={`py-1.5 border-b-2 transition-all cursor-pointer ${
                      activeConsoleTab === "error"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent hover:text-zinc-800"
                    }`}
                  >
                    ERROR
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab("tests")}
                    className={`py-1.5 border-b-2 transition-all cursor-pointer ${
                      activeConsoleTab === "tests"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent hover:text-zinc-800"
                    }`}
                  >
                    TEST RESULTS
                  </button>
                </div>

                {/* Console Body */}
                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-zinc-50/40">
                  {/* Tab 1: Custom Input */}
                  {activeConsoleTab === "input" && (
                    <div className="space-y-2 h-full flex flex-col">
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Custom Input:
                      </label>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="flex-1 w-full p-3 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-800 focus:outline-none"
                        placeholder="Enter custom test input..."
                      />
                    </div>
                  )}

                  {/* Tab 2: Output */}
                  {activeConsoleTab === "output" && (
                    <div className="space-y-2">
                      {evalOutput ? (
                        <pre className="text-zinc-900 leading-relaxed whitespace-pre-wrap">
                          {evalOutput}
                        </pre>
                      ) : (
                        <div className="text-zinc-400 text-[11px] italic">
                          Click &quot;Run&quot; or &quot;Submit&quot; to execute
                          your solution code.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Error */}
                  {activeConsoleTab === "error" && (
                    <div>
                      {errorMessage ? (
                        <pre className="text-red-600 font-bold whitespace-pre-wrap">
                          {errorMessage}
                        </pre>
                      ) : (
                        <div className="text-emerald-600 text-[11px] font-bold">
                          No runtime errors detected.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Test Results */}
                  {activeConsoleTab === "tests" && (
                    <div className="space-y-2">
                      {evalResults && evalResults.length > 0 ? (
                        <div className="space-y-2">
                          {evalResults.map((tr: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 rounded-lg border bg-white border-zinc-200 text-[11px]"
                            >
                              <div className="flex items-center gap-2">
                                {tr.passed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                )}
                                <span className="font-bold text-zinc-800">
                                  Test Case #{idx + 1}
                                </span>
                                <span className="text-zinc-500">
                                  (Input: {tr.input})
                                </span>
                              </div>

                              <span
                                className={`font-bold ${
                                  tr.passed
                                    ? "text-emerald-600"
                                    : "text-red-500"
                                }`}
                              >
                                {tr.passed ? "PASSED" : "FAILED"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-zinc-400 text-[11px] italic">
                          No test case evaluations yet. Click Run or Submit.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl border border-zinc-200 font-sans">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-[#111111]">
                  Submit Assessment?
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Are you ready to submit your assessment answers for
                  evaluation?
                </p>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-600">
                <span>Answered Questions:</span>
                <span className="font-bold text-[#111111]">
                  {answeredCount} of {questions.length}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Time Remaining:</span>
                <span className="font-bold text-[#111111]">
                  {formatTime(timeLeftSeconds)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="px-4 py-2.5 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                Continue Test
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-5 py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Confirm & Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
