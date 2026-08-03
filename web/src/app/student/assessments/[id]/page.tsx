"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { AssessmentDTO, QuestionDTO, OptionDTO } from "@/types";
import { evaluateCodeSolution } from "@/lib/codeEvaluator";
import {
  Code,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Play,
  Check,
  Send,
  AlertTriangle,
  RotateCcw,
  FileCode,
  HelpCircle,
  Award,
} from "lucide-react";

// Dynamically import Monaco Editor to prevent SSR issues
const MonacoPlayground = dynamic(
  () => import("@/components/MonacoPlayground"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-400 font-mono text-xs border border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

  // Coding Test Execution State
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evalOutput, setEvalOutput] = useState<string>("");
  const [evalResults, setEvalResults] = useState<any[] | null>(null);

  // Fetch Assessment details on load
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

        // Restore any existing saved answers from backend
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
    } catch (err) {
      console.warn("Using offline attempt mode:", err);
      setAttemptId(`attempt-${Date.now()}`);
    } finally {
      setTimeLeftSeconds((assessment?.durationMinutes || 15) * 60);
      setCurrentIdx(0);
      setMode("RUNNER");
      setLoading(false);
    }
  };

  // Save answer locally & sync to backend
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
        console.warn("Autosave error:", err);
      }
    }
  };

  // Run Code Evaluation for Coding Questions
  const handleRunCode = async (question: QuestionDTO) => {
    const codeToRun =
      codingSolutions[question.id] || question.starterCode || "";
    const lang = codingLanguages[question.id] || "python";

    setEvaluating(true);
    setEvalOutput("Compiling and executing code against test cases...");
    setEvalResults(null);

    setTimeout(() => {
      const res = evaluateCodeSolution(
        codeToRun,
        lang,
        question.testCases || [],
      );

      setEvalOutput(
        res.logs ||
          (res.allPassed
            ? `All ${res.totalPassed}/${res.totalTests} test cases passed successfully!`
            : res.error ||
              `Passed ${res.totalPassed}/${res.totalTests} test cases.`),
      );
      setEvalResults(res.testResults);
      setEvaluating(false);

      // Save code solution as textAnswer
      handleAnswerSelect(question.id, { textAnswer: codeToRun });
    }, 600);
  };

  // Final Assessment Submit
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
    } catch (err) {
      console.error("Failed to submit assessment:", err);
      router.push(`/student/assessments`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#111111] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-500">
            Preparing Assessment Environment...
          </span>
        </div>
      </main>
    );
  }

  const currentQ = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans selection:bg-[#111111] selection:text-white flex flex-col">
      {/* Top Navigation Header */}
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#111111] text-white rounded-lg flex items-center justify-center font-bold text-xs">
              PS
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                PSP LUMORA WEB
              </span>
              <span className="text-xs font-semibold text-[#111111]">
                {assessment?.title || "Playground Assessment"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mode === "RUNNER" && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all ${
                  timeLeftSeconds < 120
                    ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                    : "bg-zinc-100 text-zinc-800 border-zinc-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            <button
              onClick={() => {
                if (mode === "RUNNER") {
                  setShowSubmitModal(true);
                } else {
                  router.push("/student/assessments");
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-lg hover:bg-zinc-100 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {mode === "RUNNER" ? "Exit Assessment" : "Back to Assessments"}
            </button>
          </div>
        </div>
      </header>

      {/* Mode 1: OVERVIEW SCREEN */}
      {mode === "OVERVIEW" && (
        <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 flex flex-col items-center justify-center">
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 shadow-sm space-y-8 relative overflow-hidden">
            {/* Background Gradient Accents */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-50 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

            {/* Assessment Header */}
            <div className="space-y-3 text-center max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                  {assessment?.className || "Computer Science"}
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-mono font-bold rounded uppercase">
                  {assessment?.assessmentType || "PRACTICE"}
                </span>
                {assessment?.topic && (
                  <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-mono rounded">
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

            {/* Metadata Stats Grid */}
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
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Assessment Now
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>

              <button
                onClick={() => router.push("/student/playground")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Code className="w-4 h-4 text-purple-600" />
                Open Code Playground
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: INTERACTIVE ASSESSMENT RUNNER */}
      {mode === "RUNNER" && currentQ && (
        <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
          {/* Question Fast-Jump Navigator Bar */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Questions ({answeredCount}/{questions.length}):
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = !!selectedAnswers[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      isCurrent
                        ? "bg-[#111111] text-white ring-2 ring-offset-1 ring-[#111111]"
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

            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Assessment
            </button>
          </div>

          {/* Question Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            {/* Header: Question Meta */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-100 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-[#111111] text-white text-xs font-mono font-bold rounded">
                  Q{currentIdx + 1} of {questions.length}
                </span>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-mono font-bold rounded">
                  {currentQ.questionType.replace("_", " ")}
                </span>
                {currentQ.difficulty && (
                  <span
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded ${
                      currentQ.difficulty === "EASY"
                        ? "bg-emerald-50 text-emerald-700"
                        : currentQ.difficulty === "MEDIUM"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {currentQ.difficulty}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-500">
                  {currentQ.points} Points
                </span>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <h2 className="text-base md:text-lg font-semibold text-[#111111] leading-relaxed">
                {currentQ.questionText}
              </h2>
            </div>

            {/* ANSWER INPUT INTERFACE */}
            <div className="pt-2">
              {/* Option A: SINGLE_CHOICE / MULTIPLE_CHOICE */}
              {(currentQ.questionType === "SINGLE_CHOICE" ||
                currentQ.questionType === "MULTIPLE_CHOICE") &&
                currentQ.options && (
                  <div className="space-y-3">
                    {currentQ.options.map((opt: OptionDTO, oIdx: number) => {
                      const isSelected =
                        selectedAnswers[currentQ.id]?.optionId === opt.id;
                      const letter = String.fromCharCode(65 + oIdx);

                      return (
                        <button
                          key={opt.id}
                          onClick={() =>
                            handleAnswerSelect(currentQ.id, {
                              optionId: opt.id,
                            })
                          }
                          className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                              : "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center border ${
                                isSelected
                                  ? "bg-white text-zinc-900 border-white"
                                  : "bg-zinc-100 text-zinc-600 border-zinc-200"
                              }`}
                            >
                              {letter}
                            </div>
                            <span className="text-xs md:text-sm font-medium font-sans">
                              {opt.optionText || opt.text}
                            </span>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

              {/* Option B: TRUE_FALSE */}
              {currentQ.questionType === "TRUE_FALSE" && (
                <div className="grid grid-cols-2 gap-4">
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
                        className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                            : "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800"
                        }`}
                      >
                        <span className="text-lg font-bold font-mono">
                          {val ? "TRUE" : "FALSE"}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Option C: SHORT_ANSWER / FILL_IN_BLANKS */}
              {(currentQ.questionType === "SHORT_ANSWER" ||
                currentQ.questionType === "FILL_IN_BLANKS") && (
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
                    Type your answer:
                  </label>
                  <textarea
                    rows={4}
                    value={selectedAnswers[currentQ.id]?.textAnswer || ""}
                    onChange={(e) =>
                      handleAnswerSelect(currentQ.id, {
                        textAnswer: e.target.value,
                      })
                    }
                    placeholder="Type answer details here..."
                    className="w-full p-4 bg-[#F4F4F6] border border-transparent rounded-xl text-sm text-[#111111] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#111111] transition-all font-sans"
                  />
                </div>
              )}

              {/* Option D: CODING (MONACO PLAYGROUND) */}
              {currentQ.questionType === "CODING" && (
                <div className="space-y-4">
                  {/* Monaco Editor Header Bar */}
                  <div className="flex items-center justify-between bg-zinc-900 text-white px-4 py-2.5 rounded-t-xl font-mono text-xs border border-zinc-800">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-purple-400" />
                      <span>Monaco Playground Code Editor</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={codingLanguages[currentQ.id] || "python"}
                        onChange={(e) =>
                          setCodingLanguages((prev) => ({
                            ...prev,
                            [currentQ.id]: e.target.value,
                          }))
                        }
                        className="bg-zinc-800 border border-zinc-700 text-white rounded px-2.5 py-1 text-xs focus:outline-none"
                      >
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                      </select>

                      <button
                        onClick={() => handleRunCode(currentQ)}
                        disabled={evaluating}
                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        {evaluating ? "Evaluating..." : "Run Test Cases"}
                      </button>
                    </div>
                  </div>

                  {/* Monaco Code Editor Container */}
                  <div className="h-80 w-full border border-zinc-800 rounded-b-xl overflow-hidden shadow-inner">
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

                  {/* Code Evaluation Console Output */}
                  {evalOutput && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 text-xs font-mono">
                      <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                        <span className="font-bold uppercase text-[10px] tracking-wider">
                          Execution Output Console
                        </span>
                      </div>

                      <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {evalOutput}
                      </pre>

                      {evalResults && (
                        <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                          {evalResults.map((tr, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded bg-zinc-800/60 text-[11px]"
                            >
                              <span className="text-zinc-300">
                                Test Case #{idx + 1}:
                              </span>
                              <span
                                className={`font-bold ${
                                  tr.passed
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {tr.passed ? "PASSED" : "FAILED"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Question Footer Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Question
              </button>

              {isLastQuestion ? (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Submit Assessment
                </button>
              ) : (
                <button
                  onClick={() =>
                    setCurrentIdx((prev) =>
                      Math.min(questions.length - 1, prev + 1),
                    )
                  }
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Next Question
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-[#111111]">
                  Submit Assessment?
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Are you ready to submit your answers for evaluation?
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
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer flex items-center gap-2"
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
