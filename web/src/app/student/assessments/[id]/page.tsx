"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import Loader from "@/components/Loader";
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
  Bot,
  Sliders,
  Eye,
  EyeOff,
  Smartphone,
  Rocket,
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
  const { user, checkAuth } = useAuth();
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

  // Left Panel & Resizer State
  const [activeLeftTab, setActiveLeftTab] = useState<
    "question" | "ai" | "hints" | "settings"
  >("question");
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(42);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);

  // IDE Settings
  const [editorFontSize, setEditorFontSize] = useState<number>(14);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">(
    "vs-dark",
  );

  // Console Tabs State
  const [activeConsoleTab, setActiveConsoleTab] = useState<
    "input" | "output" | "error" | "tests"
  >("output");
  const [customInput, setCustomInput] = useState<string>("");

  // Code Execution State
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evalOutput, setEvalOutput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [evalResults, setEvalResults] = useState<any[] | null>(null);

  // AI Tutor Chat state inside Left Panel
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiChatHistory, setAiChatHistory] = useState<
    Array<{ sender: "user" | "ai"; message: string }>
  >([
    {
      sender: "ai",
      message:
        "Hello! I am your AI Assessment Tutor. Ask me any question about algorithm logic or debugging guidance!",
    },
  ]);

  // Hints State
  const [unlockedHints, setUnlockedHints] = useState<Record<number, boolean>>(
    {},
  );

  // Workbook Upload State
  const [workbookFileUrl, setWorkbookFileUrl] = useState("");
  const [uploadingWorkbook, setUploadingWorkbook] = useState(false);
  const [workbookSuccessMsg, setWorkbookSuccessMsg] = useState("");

  const isWorkbookAssessment =
    assessment?.isWorkbook ||
    Boolean(assessment?.workbookUrl) ||
    assessment?.submissionMode === "WORKBOOK_ONLY";

  const handleUploadWorkbookWeb = async () => {
    if (!workbookFileUrl.trim()) return;
    setUploadingWorkbook(true);
    try {
      await apiFetch(`/assessments/${assessmentId}/workbook/upload`, {
        method: "POST",
        body: JSON.stringify({
          studentId: user?.id || "demo-student-id",
          fileUrl: workbookFileUrl.trim(),
          fileName: "Solved_Workbook_Page.png",
        }),
      });
      setWorkbookSuccessMsg(
        "Workbook solution uploaded successfully! Pending teacher evaluation.",
      );
      setWorkbookFileUrl("");
    } catch (err: any) {
      alert(err?.message || "Failed to upload workbook solution.");
    } finally {
      setUploadingWorkbook(false);
    }
  };

  // Resizer Dragging Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newPercent = (e.clientX / window.innerWidth) * 100;
      if (newPercent >= 20 && newPercent <= 70) {
        setLeftWidthPercent(newPercent);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Submitted Status State
  const [hasAlreadySubmitted, setHasAlreadySubmitted] =
    useState<boolean>(false);
  const [submittedAttemptId, setSubmittedAttemptId] = useState<string | null>(
    null,
  );

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

        if (user?.id) {
          const userAtts = await apiFetch<any[]>(
            `/students/${user.id}/attempts`,
          );
          if (Array.isArray(userAtts)) {
            const found = userAtts.find(
              (att) =>
                att.assessmentId === assessmentId &&
                (att.status === "SUBMITTED" || att.status === "EVALUATED"),
            );
            if (found) {
              setHasAlreadySubmitted(true);
              setSubmittedAttemptId(found.id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load assessment:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAssessment();
  }, [assessmentId, user]);

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
    if (hasAlreadySubmitted && submittedAttemptId) {
      router.push(`/student/attempts/${submittedAttemptId}/result`);
      return;
    }
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
    } catch (err: any) {
      if (
        err?.message &&
        err.message.includes("already completed") &&
        submittedAttemptId
      ) {
        router.push(`/student/attempts/${submittedAttemptId}/result`);
        return;
      }
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
    if (submitting) return;
    setSubmitting(true);
    try {
      if (attemptId && !attemptId.startsWith("attempt-")) {
        await apiFetch(`/attempts/${attemptId}/submit`, {
          method: "POST",
        });
        if (checkAuth) {
          try {
            await checkAuth();
          } catch {}
        }
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

  // Send AI Message in Assessment Runner
  const handleSendAiMessage = async (textToSend?: string) => {
    const currentQ = questions[currentIdx];
    const query = textToSend || aiPrompt;
    if (!query.trim()) return;

    setAiChatHistory((prev) => [...prev, { sender: "user", message: query }]);
    if (!textToSend) setAiPrompt("");
    setAiLoading(true);

    try {
      const res = await apiFetch<any>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: `Assessment Question: ${currentQ?.questionText}\nStudent Answer/Code: ${codingSolutions[currentQ?.id] || "None"}\nQuestion: ${query}`,
          history: [],
        }),
      });

      const reply =
        res?.reply ||
        res?.message ||
        "Think about breaking down the problem into smaller sub-problems. Verify loop indices and base conditions!";
      setAiChatHistory((prev) => [...prev, { sender: "ai", message: reply }]);
    } catch {
      setAiChatHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          message:
            "Key Hint: Pay close attention to edge cases like empty arrays or target parameters. Using an efficient lookup table helps optimize performance.",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="h-screen w-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader />
          <span className="text-xs font-mono text-zinc-500 mt-4">
            Loading Assessment IDE Workspace...
          </span>
        </div>
      </main>
    );
  }

  const isMobileExclusive =
    assessment?.assessmentType === "QUIZ" ||
    assessment?.isWorkbook ||
    Boolean(assessment?.workbookUrl) ||
    assessment?.submissionMode === "WORKBOOK_ONLY";

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#F8F9FA] text-[#111111] font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* ── MOBILE APP EXCLUSIVE BLOCK SCREEN FOR QUIZZES & WORKBOOKS ──────────────── */}
      {isMobileExclusive ? (
        <div className="flex-1 max-w-2xl w-full mx-auto px-6 py-16 flex flex-col items-center justify-center">
          <div className="w-full bg-white border border-zinc-200 rounded-2xl p-8 md:p-12 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-center mx-auto text-orange-500">
              <Smartphone className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-bold uppercase rounded-full tracking-wider">
                Mobile App Exclusive
              </span>
              <h1 className="text-2xl font-bold text-zinc-900 mt-2">
                Mobile App Required
              </h1>
              <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                {assessment?.assessmentType === "QUIZ"
                  ? "Quizzes are exclusively accessible and submitted from the PSP Lumora Mobile App on your smartphone."
                  : "Workbooks are exclusively accessible and submitted from the PSP Lumora Mobile App on your smartphone."}
              </p>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-left text-xs text-zinc-600 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-zinc-800">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Device Compatibility Notice</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {assessment?.assessmentType === "QUIZ"
                  ? "Quiz assessments require touch-optimized interactions and smartphone submission validation. Please open the PSP Lumora Mobile App on your smartphone to complete and submit your quiz."
                  : "Workbook solutions require capturing and uploading camera solution photos directly via the mobile app."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => router.push("/student/assessments")}
                className="w-full sm:w-auto px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Back to Assessments
              </button>
              <button
                onClick={() => router.push("/student/playground")}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                Open Code Playground
              </button>
            </div>
          </div>
        </div>
      ) : mode === "OVERVIEW" ? (
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

            {/* Already Submitted Notice */}
            {hasAlreadySubmitted && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-950 font-sans">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider">
                      Assessment Completed
                    </h4>
                    <p className="text-xs text-emerald-900 mt-0.5">
                      You have already submitted an attempt for this assessment.
                      Re-attempts are not permitted.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Workbook Assessment Card */}
            {isWorkbookAssessment && (
              <div className="p-6 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-4 font-sans text-amber-950 text-left">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-700" />
                    <h3 className="text-sm font-bold font-mono">
                      WORKBOOK SOLUTION & SUBMISSION
                    </h3>
                  </div>
                  {assessment?.workbookUrl && (
                    <a
                      href={assessment.workbookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-all shadow-xs"
                    >
                      View Teacher's Workbook File
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  This is a physical / paper workbook assessment. Download or
                  view the teacher's problem sheet above, solve the questions on
                  your paper workbook, and upload image links or URLs of your
                  completed pages below.
                </p>

                {workbookSuccessMsg ? (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    {workbookSuccessMsg}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      value={workbookFileUrl}
                      onChange={(e) => setWorkbookFileUrl(e.target.value)}
                      placeholder="Paste URL of your solved workbook image/page (e.g. https://...)"
                      className="flex-1 px-4 py-2.5 bg-white border border-amber-300 text-xs font-medium rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      onClick={handleUploadWorkbookWeb}
                      disabled={uploadingWorkbook || !workbookFileUrl.trim()}
                      className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
                    >
                      {uploadingWorkbook ? "Uploading..." : "Submit Solution"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {hasAlreadySubmitted ? (
                <button
                  onClick={() =>
                    submittedAttemptId &&
                    router.push(
                      `/student/attempts/${submittedAttemptId}/result`,
                    )
                  }
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  View Submission Result
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : !isWorkbookAssessment ? (
                <button
                  onClick={handleStartAttempt}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Start Assessment IDE
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : null}

              <button
                onClick={() => router.push("/student/assessments")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Back to Assessments
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── RUNNER MODE IDE WORKSPACE (Image 2 style with Resizer Slider) ─────── */}
      {mode === "RUNNER" && currentQ && (
        <>
          {/* Top Navbar Header */}
          <header className="h-14 bg-white border-b border-zinc-200 px-4 flex items-center justify-between shrink-0 z-30 shadow-2xs">
            {/* Left: Back + Title + Question Pills */}
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

            {/* Right: Timer + XP + Action Buttons */}
            <div className="flex items-center gap-3">
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

              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-900 font-mono">
                <span className="text-zinc-500 text-[11px] font-sans font-semibold">
                  Total XP
                </span>
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>
                  {user?.totalXp !== undefined
                    ? user.totalXp.toLocaleString()
                    : "0"}
                </span>
              </div>

              <button
                title="Bookmark Problem"
                className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
              </button>

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

              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
            </div>
          </header>

          {/* ── MAIN WORKSPACE SPLIT WITH DRAGGABLE RESIZER SLIDER ────────────────── */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Far Left Navigation Icon Rail */}
            <aside className="w-12 bg-white border-r border-zinc-200 flex flex-col items-center justify-between py-3 shrink-0 z-10">
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => {
                    setActiveLeftTab("question");
                    setIsLeftCollapsed(false);
                  }}
                  title="Question Statement"
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    activeLeftTab === "question" && !isLeftCollapsed
                      ? "text-zinc-900 bg-zinc-100 font-bold"
                      : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setActiveLeftTab("ai");
                    setIsLeftCollapsed(false);
                  }}
                  title="AI Tutor Assistant"
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    activeLeftTab === "ai" && !isLeftCollapsed
                      ? "text-[#0066FF] bg-blue-50 font-bold"
                      : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setActiveLeftTab("hints");
                    setIsLeftCollapsed(false);
                  }}
                  title="Hints & Guidance"
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    activeLeftTab === "hints" && !isLeftCollapsed
                      ? "text-amber-600 bg-amber-50 font-bold"
                      : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  setActiveLeftTab("settings");
                  setIsLeftCollapsed(false);
                }}
                title="IDE Settings"
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  activeLeftTab === "settings" && !isLeftCollapsed
                    ? "text-zinc-900 bg-zinc-100 font-bold"
                    : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>
            </aside>

            {/* ── LEFT PANEL: CLICKABLE & SWITCHABLE TABS ────────────────────── */}
            <section
              style={{
                width: isLeftCollapsed ? "0px" : `${leftWidthPercent}%`,
              }}
              className="bg-white border-r border-zinc-200 flex flex-col overflow-hidden transition-[width] duration-75 shrink-0"
            >
              {/* Header Bar */}
              <div className="h-10 border-b border-zinc-200 px-4 flex items-center justify-between bg-zinc-50/60 shrink-0">
                <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase text-zinc-500 tracking-wider">
                  {activeLeftTab === "question" && (
                    <>
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        QUESTION {currentIdx + 1} OF {questions.length}
                      </span>
                    </>
                  )}
                  {activeLeftTab === "ai" && (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>AI TUTOR ASSISTANT</span>
                    </>
                  )}
                  {activeLeftTab === "hints" && (
                    <>
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>HINTS & APPROACH</span>
                    </>
                  )}
                  {activeLeftTab === "settings" && (
                    <>
                      <Sliders className="w-3.5 h-3.5 text-zinc-700" />
                      <span>IDE PREFERENCES</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 text-zinc-400">
                  <button
                    onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
                    title="Collapse Sidebar"
                    className="hover:text-zinc-700 cursor-pointer"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* TAB CONTENT 1: QUESTION STATEMENT */}
              {activeLeftTab === "question" && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-800 text-xs leading-relaxed font-sans">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">
                      {currentQ.questionText}
                    </h2>
                  </div>

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

                  <div className="text-[11px] font-mono text-zinc-400">
                    Time Limit: 2s, Memory Limit: 128000
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-zinc-900 text-xs">
                      User Task:
                    </h3>
                    <p className="text-zinc-600 leading-relaxed font-sans">
                      Read the question logic carefully and select or write the
                      appropriate solution to complete the task.
                    </p>
                  </div>

                  {/* NON-CODING OPTIONS */}
                  {currentQ.questionType !== "CODING" && (
                    <div className="pt-2 space-y-3">
                      <h3 className="font-bold text-zinc-900 text-xs">
                        Select Your Answer:
                      </h3>

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

                      {currentQ.questionType === "TRUE_FALSE" && (
                        <div className="grid grid-cols-2 gap-3">
                          {[true, false].map((val) => {
                            const isSelected =
                              selectedAnswers[currentQ.id]?.booleanAnswer ===
                              val;

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
              )}

              {/* TAB CONTENT 2: AI TUTOR CHAT */}
              {activeLeftTab === "ai" && (
                <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4 font-sans text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        handleSendAiMessage("How do I approach this question?")
                      }
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[11px] font-medium text-zinc-700 cursor-pointer"
                    >
                      💡 Approach Hint
                    </button>
                    <button
                      onClick={() =>
                        handleSendAiMessage(
                          "Can you explain the problem constraints?",
                        )
                      }
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[11px] font-medium text-zinc-700 cursor-pointer"
                    >
                      ⚡ Explain Constraints
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {aiChatHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${
                          item.sender === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                            item.sender === "user"
                              ? "bg-[#0066FF] text-white rounded-br-none"
                              : "bg-zinc-100 text-zinc-900 rounded-bl-none border border-zinc-200"
                          }`}
                        >
                          {item.message}
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
                        <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        AI thinking...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-200">
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendAiMessage()
                      }
                      placeholder="Ask AI Tutor..."
                      className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-purple-600"
                    />
                    <button
                      onClick={() => handleSendAiMessage()}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 3: HINTS */}
              {activeLeftTab === "hints" && (
                <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs">
                  <h3 className="font-bold text-sm text-zinc-900">
                    Question Hints
                  </h3>
                  <p className="text-zinc-500 text-xs">
                    Review helpful steps to guide your response.
                  </p>

                  <div className="space-y-3 pt-2">
                    {[
                      {
                        id: 1,
                        title: "Hint 1: Core Concept",
                        text: "Identify the primary data structure or logic pattern required for this question.",
                      },
                      {
                        id: 2,
                        title: "Hint 2: Edge Cases",
                        text: "Ensure your code/answer accounts for edge boundary limits (e.g. N=1 or negative values).",
                      },
                    ].map((hint) => (
                      <div
                        key={hint.id}
                        className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900">
                            {hint.title}
                          </span>
                          <button
                            onClick={() =>
                              setUnlockedHints((prev) => ({
                                ...prev,
                                [hint.id]: !prev[hint.id],
                              }))
                            }
                            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                          >
                            {unlockedHints[hint.id] ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            {unlockedHints[hint.id]
                              ? "Hide Hint"
                              : "Reveal Hint"}
                          </button>
                        </div>
                        {unlockedHints[hint.id] && (
                          <p className="text-zinc-700 leading-relaxed pt-1 border-t border-zinc-200">
                            {hint.text}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT 4: IDE SETTINGS */}
              {activeLeftTab === "settings" && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans text-xs">
                  <h3 className="font-bold text-sm text-zinc-900">
                    IDE Preferences
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-zinc-900">
                          Editor Theme
                        </h4>
                        <p className="text-[11px] text-zinc-500">
                          Switch between VS Dark and Light themes
                        </p>
                      </div>
                      <select
                        value={editorTheme}
                        onChange={(e: any) => setEditorTheme(e.target.value)}
                        className="bg-white border border-zinc-300 rounded px-2.5 py-1 text-xs font-mono"
                      >
                        <option value="vs-dark">VS Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <div>
                        <h4 className="font-semibold text-zinc-900">
                          Font Size
                        </h4>
                        <p className="text-[11px] text-zinc-500">
                          Adjust code font size in Monaco Editor
                        </p>
                      </div>
                      <select
                        value={editorFontSize}
                        onChange={(e) =>
                          setEditorFontSize(Number(e.target.value))
                        }
                        className="bg-white border border-zinc-300 rounded px-2.5 py-1 text-xs font-mono"
                      >
                        <option value={12}>12px</option>
                        <option value={14}>14px</option>
                        <option value={16}>16px</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Previous / Next Footer Nav */}
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

            {/* ── DRAGGABLE RESIZER SLIDER BAR ────────────────────────────────────── */}
            <div
              onMouseDown={handleMouseDown}
              className={`w-2 hover:w-2.5 bg-zinc-200 hover:bg-blue-600 cursor-col-resize flex items-center justify-center transition-all shrink-0 select-none z-20 ${
                isDragging ? "bg-blue-600 w-2.5" : ""
              }`}
              title="Drag left or right to resize panels"
            >
              <div className="w-0.5 h-8 bg-zinc-400 rounded-full" />
            </div>

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
                  theme={editorTheme}
                  fontSize={editorFontSize}
                  height="100%"
                />
              </div>

              {/* Bottom Console Panel (INPUT / OUTPUT / ERROR / TEST RESULTS) */}
              <div className="h-52 border-t border-zinc-200 flex flex-col bg-white shrink-0">
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

                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-zinc-50/40">
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
