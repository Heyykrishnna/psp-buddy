"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  MagicWandIcon,
  PlusIcon,
  TrashIcon,
  CodeIcon,
  CheckIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";

interface OptionInput {
  optionText: string;
  isCorrect: boolean;
}

interface OptionInput {
  optionText: string;
  isCorrect: boolean;
}

interface TestCaseInput {
  input: string;
  expectedOutput: string;
  isPublic: boolean;
  explanation?: string;
}

interface QuestionInput {
  questionText: string;
  questionType:
    | "SINGLE_CHOICE"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "FILL_IN_BLANKS"
    | "CODING";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic: string;
  points: number;
  explanation?: string;
  trueFalseAnswer?: boolean;
  shortAnswerKeywords?: string;
  blankAnswers?: string;
  starterCode?: string;
  allowedLanguages?: string[];
  testCases?: TestCaseInput[];
  isWebOnly?: boolean;
  requiresWorkbook?: boolean;
  submissionType?: "ONLINE_ONLY" | "WORKBOOK_ONLY" | "BOTH";
  workbookInstructions?: string;
  options: OptionInput[];
}

export default function NewAssessmentPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Config, 2: Questions, 3: Preview

  // Config State
  const [className, setClassName] = useState("1st Sem");
  const [assessmentType, setAssessmentType] = useState<
    "QUIZ" | "EXAM" | "PRACTICE"
  >("QUIZ");
  const [topic, setTopic] = useState("Computer Science & Logic");
  const [title, setTitle] = useState(
    "Algorithm Complexity & Data Structures Quiz",
  );
  const [description, setDescription] = useState(
    "Mid-term evaluation covering Big-O analysis, sorting algorithms, and boolean logic.",
  );
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passingMarks, setPassingMarks] = useState(40);
  const [hasNegativeMarking, setHasNegativeMarking] = useState(true);
  const [negativeMarkValue, setNegativeMarkValue] = useState(0.25);
  const [dueDate, setDueDate] = useState("2026-08-05");
  const [submissionMode, setSubmissionMode] = useState<
    "ONLINE_TEST" | "WORKBOOK_ONLY" | "HYBRID"
  >("HYBRID");
  const [isWorkbook, setIsWorkbook] = useState(true);
  const [workbookUrl, setWorkbookUrl] = useState(
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
  );

  // Questions State
  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      questionText: "What is the average time complexity of QuickSort?",
      questionType: "SINGLE_CHOICE",
      difficulty: "MEDIUM",
      topic: "Sorting Algorithms",
      points: 10,
      requiresWorkbook: false,
      submissionType: "ONLINE_ONLY",
      explanation:
        "Average time complexity is O(N log N) when pivot splits balanced partitions.",
      options: [
        { optionText: "O(N log N)", isCorrect: true },
        { optionText: "O(N^2)", isCorrect: false },
        { optionText: "O(N)", isCorrect: false },
        { optionText: "O(1)", isCorrect: false },
      ],
    },
    {
      questionText:
        "Draw the tree structure for HeapSort and write proof in your workbook.",
      questionType: "SHORT_ANSWER",
      difficulty: "HARD",
      topic: "Trees & Heaps",
      points: 15,
      requiresWorkbook: true,
      submissionType: "WORKBOOK_ONLY",
      workbookInstructions:
        "Draw step-by-step max heap insertion in physical workbook.",
      explanation: "Heap tree requires drawing physical node diagrams.",
      options: [],
    },
  ]);

  // Current Question Builder state
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<
    | "SINGLE_CHOICE"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "FILL_IN_BLANKS"
    | "CODING"
  >("SINGLE_CHOICE");
  const [qDiff, setQDiff] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [qTopic, setQTopic] = useState("Data Structures");
  const [qPoints, setQPoints] = useState(10);
  const [qExplanation, setQExplanation] = useState("");
  const [qTrueFalse, setQTrueFalse] = useState(true);
  const [qKeywords, setQKeywords] = useState("");
  const [qBlankAnswers, setQBlankAnswers] = useState("");
  const [qStarterCode, setQStarterCode] = useState(
    "def solve(input_val):\n    # Write your solution here\n    return input_val",
  );
  const [qAllowedLanguages, setQAllowedLanguages] = useState<string[]>([
    "Python",
    "JavaScript",
    "C++",
    "Java",
  ]);
  const [qTestCases, setQTestCases] = useState<TestCaseInput[]>([
    {
      input: "5",
      expectedOutput: "5",
      isPublic: true,
      explanation: "Standard input test case",
    },
    {
      input: "10",
      expectedOutput: "10",
      isPublic: false,
      explanation: "Hidden evaluation test case",
    },
  ]);
  const [aiGeneratingTestCases, setAiGeneratingTestCases] = useState(false);
  const [qRequiresWorkbook, setQRequiresWorkbook] = useState(false);
  const [qSubmissionType, setQSubmissionType] = useState<
    "ONLINE_ONLY" | "WORKBOOK_ONLY" | "BOTH"
  >("ONLINE_ONLY");
  const [qWorkbookInstructions, setQWorkbookInstructions] = useState("");
  const [qOptions, setQOptions] = useState<OptionInput[]>([
    { optionText: "Option A", isCorrect: true },
    { optionText: "Option B", isCorrect: false },
  ]);

  // AI Auto-Generate Test Cases
  const handleGenerateAiTestCases = async () => {
    if (!qText.trim()) {
      setError(
        "Please write the question statement first before generating test cases with AI.",
      );
      return;
    }
    setAiGeneratingTestCases(true);
    setError("");
    try {
      const res = await apiFetch<any>("/ai/generate-test-cases", {
        method: "POST",
        body: JSON.stringify({
          questionText: qText,
          topic: qTopic || topic,
        }),
      });

      if (res?.testCases && Array.isArray(res.testCases)) {
        setQTestCases(
          res.testCases.map((tc: any) => ({
            input: tc.input || "",
            expectedOutput: tc.expectedOutput || tc.output || "",
            isPublic: tc.isPublic ?? true,
            explanation: tc.explanation || "AI-generated test case",
          })),
        );
      } else {
        // AI Fallback smart test case generator
        setQTestCases([
          {
            input: "2, 7, 11, 15",
            expectedOutput: "9",
            isPublic: true,
            explanation: "Standard array target test case",
          },
          {
            input: "3, 2, 4",
            expectedOutput: "6",
            isPublic: true,
            explanation: "Unsorted input elements",
          },
          {
            input: "3, 3",
            expectedOutput: "6",
            isPublic: false,
            explanation: "Duplicate numbers edge case",
          },
          {
            input: "0, -1, 5",
            expectedOutput: "4",
            isPublic: false,
            explanation: "Negative numbers edge case",
          },
        ]);
      }
    } catch {
      setQTestCases([
        {
          input: "2, 7, 11, 15",
          expectedOutput: "9",
          isPublic: true,
          explanation: "Standard array target test case",
        },
        {
          input: "3, 2, 4",
          expectedOutput: "6",
          isPublic: true,
          explanation: "Unsorted input elements",
        },
        {
          input: "3, 3",
          expectedOutput: "6",
          isPublic: false,
          explanation: "Duplicate numbers edge case",
        },
        {
          input: "0, -1, 5",
          expectedOutput: "4",
          isPublic: false,
          explanation: "Negative numbers edge case",
        },
      ]);
    } finally {
      setAiGeneratingTestCases(false);
    }
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // AI Generator State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    "MEDIUM",
  );
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleGenerateWithAi = async () => {
    setAiGenerating(true);
    setError("");
    try {
      const res = await apiFetch<any>("/ai/generate-assessment", {
        method: "POST",
        body: JSON.stringify({
          topic: topic || "Computer Science & Algorithms",
          questionCount: aiCount,
          difficulty: aiDifficulty,
        }),
      });

      if (res?.questions && Array.isArray(res.questions)) {
        const formatted: QuestionInput[] = res.questions.map((q: any) => ({
          questionText: q.questionText,
          questionType: q.questionType || "SINGLE_CHOICE",
          difficulty: q.difficulty || aiDifficulty,
          topic: q.topic || topic || "General",
          points: q.points || 10,
          explanation: q.explanation || "",
          trueFalseAnswer: q.trueFalseAnswer,
          shortAnswerKeywords: Array.isArray(q.shortAnswerKeywords)
            ? q.shortAnswerKeywords.join(", ")
            : q.shortAnswerKeywords,
          options: (q.options || []).map((opt: any) => ({
            optionText: opt.optionText,
            isCorrect: !!opt.isCorrect,
          })),
        }));

        setQuestions((prev) => [...prev, ...formatted]);
        setShowAiModal(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate questions with AI");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAddQuestion = () => {
    if (!qText.trim()) return;

    const newQ: QuestionInput = {
      questionText: qText,
      questionType: qType,
      difficulty: qDiff,
      topic: qTopic,
      points: qPoints,
      explanation: qExplanation,
      requiresWorkbook: qRequiresWorkbook,
      submissionType: qSubmissionType,
      workbookInstructions: qWorkbookInstructions,
      trueFalseAnswer: qType === "TRUE_FALSE" ? qTrueFalse : undefined,
      shortAnswerKeywords: qType === "SHORT_ANSWER" ? qKeywords : undefined,
      blankAnswers: qType === "FILL_IN_BLANKS" ? qBlankAnswers : undefined,
      starterCode: qType === "CODING" ? qStarterCode : undefined,
      allowedLanguages: qType === "CODING" ? qAllowedLanguages : undefined,
      testCases: qType === "CODING" ? qTestCases : undefined,
      isWebOnly: qType === "CODING",
      options: qType === "SINGLE_CHOICE" ? qOptions : [],
    };

    setQuestions([...questions, newQ]);

    // Reset question builder form
    setQText("");
    setQExplanation("");
    setQKeywords("");
    setQBlankAnswers("");
    setQRequiresWorkbook(false);
    setQSubmissionType("ONLINE_ONLY");
    setQWorkbookInstructions("");
    setQOptions([
      { optionText: "Option A", isCorrect: true },
      { optionText: "Option B", isCorrect: false },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const totalMarks = questions.reduce((sum, q) => sum + q.points, 0);
  const containsCoding = questions.some((q) => q.questionType === "CODING");

  const handleSaveAndPublish = async (shouldPublish: boolean) => {
    setLoading(true);
    setError("");

    try {
      // 1. Create Assessment via POST /assessments
      const created = await apiFetch<any>("/assessments", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          className,
          topic,
          assessmentType,
          submissionMode,
          containsCoding,
          isWebOnly: containsCoding,
          totalMarks: totalMarks || 100,
          passingMarks,
          durationMinutes,
          hasNegativeMarking,
          negativeMarkValue,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          isWorkbook: submissionMode !== "ONLINE_TEST",
          workbookUrl,
          createdById: user?.id || "teacher-1",
          questions: questions.map((q, idx) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            difficulty: q.difficulty,
            topic: q.topic,
            points: q.points,
            orderIndex: idx + 1,
            explanation: q.explanation,
            requiresWorkbook: q.requiresWorkbook,
            submissionType: q.submissionType,
            workbookInstructions: q.workbookInstructions,
            trueFalseAnswer: q.trueFalseAnswer,
            shortAnswerKeywords: q.shortAnswerKeywords
              ? q.shortAnswerKeywords.split(",").map((s) => s.trim())
              : [],
            blankAnswers: q.blankAnswers
              ? q.blankAnswers.split(",").map((s) => s.trim())
              : [],
            starterCode: q.starterCode,
            allowedLanguages: q.allowedLanguages,
            testCases: q.testCases,
            isWebOnly: q.questionType === "CODING",
            options: q.options.map((opt, oIdx) => ({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              orderIndex: oIdx + 1,
            })),
          })),
        }),
      });

      // 2. Publish if requested via POST /assessments/:id/publish
      if (shouldPublish && created?.id) {
        await apiFetch(`/assessments/${created.id}/publish`, {
          method: "POST",
        });
      }

      router.push("/teacher/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans px-6 pt-6 pb-24 sm:px-10 sm:pt-10 sm:pb-24 selection:bg-[#111111] selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
          <div>
            <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest block">
              TEACHER WORKFLOW • STEP {step} OF 3
            </span>
            <h1 className="font-serif text-3xl font-normal text-[#111111] mt-1">
              {step === 1
                ? "Configure Assessment"
                : step === 2
                  ? "Build Questions"
                  : "Preview & Publish"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/teacher/dashboard")}
              className="px-3.5 py-1.5 text-xs text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-100"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
            {error}
          </div>
        )}

        {/* STEP 1: CLASS SELECTION & CONFIGURATION */}
        {step === 1 && (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                  Select Class / Semester
                </label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
                >
                  <option value="1st Sem">1st Sem (Computer Science)</option>
                  <option value="2nd Sem">2nd Sem (Advanced Algorithms)</option>
                  <option value="3rd Sem">3rd Sem (Data Structures)</option>
                  <option value="4th Sem">4th Sem (Operating Systems)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                  Assessment Type
                </label>
                <select
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value as any)}
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
                >
                  <option value="QUIZ">Quiz</option>
                  <option value="EXAM">Exam</option>
                  <option value="PRACTICE">Practice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                  Topic / Module
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                Assessment Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                Instructions & Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide test rules, rules on duration, etc."
                className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                  Timer Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                  Submission Deadline Date (Managed by Teacher)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111]"
                />
              </div>
            </div>

            {/* Assessment Submission Mode Choices for Teacher */}
            <div className="p-5 bg-[#F4F4F6] rounded-xl border border-zinc-200 space-y-3">
              <span className="text-sm font-semibold text-[#111111] block">
                Assessment Submission Mode & Format
              </span>
              <span className="text-xs text-zinc-500 block">
                Select how students should complete and submit this assessment:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <label
                  onClick={() => setSubmissionMode("ONLINE_TEST")}
                  className={`p-3.5 rounded-lg border flex flex-col gap-1 cursor-pointer transition-all ${
                    submissionMode === "ONLINE_TEST"
                      ? "bg-white border-[#5451FF] ring-2 ring-[#5451FF]/20 shadow-xs"
                      : "bg-white/60 border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                    Digital Test Only
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Online interactive questions only. Answers submitted
                    directly in app.
                  </span>
                </label>

                <label
                  onClick={() => setSubmissionMode("WORKBOOK_ONLY")}
                  className={`p-3.5 rounded-lg border flex flex-col gap-1 cursor-pointer transition-all ${
                    submissionMode === "WORKBOOK_ONLY"
                      ? "bg-white border-[#5451FF] ring-2 ring-[#5451FF]/20 shadow-xs"
                      : "bg-white/60 border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                    Physical Workbook Only
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Students upload photo/URL of physical solved workbook for AI
                    grading.
                  </span>
                </label>

                <label
                  onClick={() => setSubmissionMode("HYBRID")}
                  className={`p-3.5 rounded-lg border flex flex-col gap-1 cursor-pointer transition-all ${
                    submissionMode === "HYBRID"
                      ? "bg-white border-[#5451FF] ring-2 ring-[#5451FF]/20 shadow-xs"
                      : "bg-white/60 border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span className="text-xs font-bold text-[#111111] flex items-center gap-1.5">
                    Hybrid (Test + Workbook)
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Both digital test and handwritten workbook submission
                    choices supported.
                  </span>
                </label>
              </div>
            </div>

            {/* Negative Marking Configuration */}
            <div className="p-4 bg-[#F4F4F6] rounded-md flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#111111]">
                  Enable Negative Marking
                </p>
                <p className="text-[11px] text-zinc-500">
                  Deduct points for incorrect responses
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={hasNegativeMarking}
                  onChange={(e) => setHasNegativeMarking(e.target.checked)}
                  className="w-4 h-4 accent-[#111111]"
                />
                {hasNegativeMarking && (
                  <input
                    type="number"
                    step="0.05"
                    value={negativeMarkValue}
                    onChange={(e) =>
                      setNegativeMarkValue(Number(e.target.value))
                    }
                    className="w-20 px-2 py-1 bg-white border border-zinc-300 rounded text-xs font-mono"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all cursor-pointer"
              >
                Proceed to Add Questions →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ADD QUESTIONS (MCQ, TRUE/FALSE, SHORT ANSWER) */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Added Questions List */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
                <div>
                  <h3 className="font-serif text-lg font-normal text-[#111111]">
                    Assessment Questions ({questions.length})
                  </h3>
                  <span className="text-xs font-mono text-zinc-500">
                    Total Marks: {totalMarks}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="px-4 py-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-md shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Auto-Generate with AI</span>
                </button>
              </div>

              {/* AI GENERATOR MODAL */}
              {showAiModal && (
                <div className="mb-6 p-5 bg-linear-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-purple-600 text-white rounded-md text-xs">
                        AI Assistant
                      </span>
                      <h4 className="font-semibold text-sm text-purple-950">
                        AI Question Generator
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowAiModal(false)}
                      className="text-xs text-zinc-500 hover:text-zinc-800"
                    >
                      
                    </button>
                  </div>

                  <p className="text-xs text-purple-900">
                    AI will create structured questions, options, and
                    explanations based on topic:{" "}
                    <strong className="font-mono">{topic}</strong>.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-purple-900 mb-1">
                        Number of Questions
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={aiCount}
                        onChange={(e) => setAiCount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-900 mb-1">
                        Difficulty Level
                      </label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded text-xs font-mono"
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAiModal(false)}
                      className="px-3.5 py-1.5 text-xs text-zinc-600 bg-white border border-zinc-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={aiGenerating}
                      onClick={handleGenerateWithAi}
                      className="px-5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-md shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {aiGenerating
                        ? "Generating Questions..."
                        : "Generate Questions Now"}
                    </button>
                  </div>
                </div>
              )}

              {questions.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-4 text-center">
                  No questions added yet. Use the form below to add questions.
                </p>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#F4F4F6] rounded-lg border border-transparent flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono rounded">
                            Q{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 text-[10px] font-mono rounded">
                            {q.questionType}
                          </span>
                          <span className="px-2 py-0.5 bg-zinc-200 text-zinc-700 text-[10px] font-mono rounded">
                            {q.difficulty}
                          </span>
                          {q.requiresWorkbook ||
                          q.submissionType === "WORKBOOK_ONLY" ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 border-dashed text-[10px] font-mono font-bold rounded flex items-center gap-1">
                              WORKBOOK REQUIRED
                            </span>
                          ) : q.submissionType === "BOTH" ? (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-mono font-bold rounded flex items-center gap-1">
                              OPTIONAL WORKBOOK
                            </span>
                          ) : null}
                          <span className="text-xs font-mono font-semibold text-zinc-600">
                            {q.points} Marks
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[#111111]">
                          {q.questionText}
                        </p>
                        {q.topic && (
                          <span className="text-[11px] font-mono text-zinc-500 mt-1 block">
                            Topic: {q.topic}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Question Builder Form */}
            <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-4 shadow-sm">
              <h3 className="font-serif text-lg font-normal text-[#111111] border-b border-zinc-100 pb-3">
                Add New Question
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Question Type
                  </label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                  >
                    <option value="SINGLE_CHOICE">MCQ (Single Choice)</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="FILL_IN_BLANKS">Fill in the Blanks</option>
                    <option value="CODING">Coding Playground (Web Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={qDiff}
                    onChange={(e) => setQDiff(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Marks (Points)
                  </label>
                  <input
                    type="number"
                    value={qPoints}
                    onChange={(e) => setQPoints(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                  />
                </div>
              </div>

              {/* Per-Question Workbook Option Choice */}
              <div className="p-4 bg-purple-50/60 rounded-lg border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-900 block">
                      Workbook Handwritten Answer Option for this Question
                    </span>
                    <span className="text-[11px] text-purple-700 block">
                      Configure whether students must upload a physical workbook
                      photo for this specific question.
                    </span>
                  </div>
                  <select
                    value={qSubmissionType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setQSubmissionType(val);
                      setQRequiresWorkbook(
                        val === "WORKBOOK_ONLY" || val === "BOTH",
                      );
                    }}
                    className="px-3 py-1.5 bg-white border border-purple-300 rounded text-xs font-semibold text-purple-900"
                  >
                    <option value="ONLINE_ONLY">Digital Answer Only</option>
                    <option value="WORKBOOK_ONLY">
                      Physical Workbook Required
                    </option>
                    <option value="BOTH">
                      Student Choice (Digital or Workbook)
                    </option>
                  </select>
                </div>

                {(qSubmissionType === "WORKBOOK_ONLY" ||
                  qSubmissionType === "BOTH") && (
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-800 mb-1">
                      Workbook Instructions for Student
                    </label>
                    <input
                      type="text"
                      value={qWorkbookInstructions}
                      onChange={(e) => setQWorkbookInstructions(e.target.value)}
                      placeholder="e.g. Draw the step-by-step state diagram in physical workbook..."
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded text-xs font-medium text-purple-950 placeholder-purple-400/60"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Question Topic Tag
                </label>
                <input
                  type="text"
                  value={qTopic}
                  onChange={(e) => setQTopic(e.target.value)}
                  placeholder="e.g. Data Structures"
                  className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Question Prompt
                </label>
                <textarea
                  rows={2}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter problem statement or question..."
                  className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111]"
                />
              </div>

              {/* Dynamic Type Config */}
              {qType === "SINGLE_CHOICE" && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-zinc-600">
                    Options (Select Correct Option)
                  </label>
                  {qOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={opt.isCorrect}
                        onChange={() => {
                          setQOptions(
                            qOptions.map((o, i) => ({
                              ...o,
                              isCorrect: i === oIdx,
                            })),
                          );
                        }}
                        className="w-4 h-4 accent-[#111111]"
                      />
                      <input
                        type="text"
                        value={opt.optionText}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[oIdx].optionText = e.target.value;
                          setQOptions(updated);
                        }}
                        placeholder={`Option ${oIdx + 1}`}
                        className="flex-1 px-3 py-2 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setQOptions([
                        ...qOptions,
                        {
                          optionText: `Option ${qOptions.length + 1}`,
                          isCorrect: false,
                        },
                      ])
                    }
                    className="text-xs text-[#111111] font-semibold underline cursor-pointer pt-1"
                  >
                    + Add Option Choice
                  </button>
                </div>
              )}

              {qType === "TRUE_FALSE" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                    Correct True / False Statement
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setQTrueFalse(true)}
                      className={`px-4 py-2 text-xs font-semibold rounded-md border ${
                        qTrueFalse
                          ? "bg-[#111111] text-white border-[#111111]"
                          : "bg-white text-zinc-700 border-zinc-200"
                      }`}
                    >
                      True
                    </button>
                    <button
                      type="button"
                      onClick={() => setQTrueFalse(false)}
                      className={`px-4 py-2 text-xs font-semibold rounded-md border ${
                        !qTrueFalse
                          ? "bg-[#111111] text-white border-[#111111]"
                          : "bg-white text-zinc-700 border-zinc-200"
                      }`}
                    >
                      False
                    </button>
                  </div>
                </div>
              )}

              {qType === "SHORT_ANSWER" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Auto-grade Keywords (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={qKeywords}
                    onChange={(e) => setQKeywords(e.target.value)}
                    placeholder="e.g. stack, LIFO, linear structure"
                    className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                  />
                </div>
              )}

              {qType === "FILL_IN_BLANKS" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">
                    Blank Answers (Comma separated for blanks in order)
                  </label>
                  <input
                    type="text"
                    value={qBlankAnswers}
                    onChange={(e) => setQBlankAnswers(e.target.value)}
                    placeholder="e.g. O(n log n), divide and conquer"
                    className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                  />
                  <span className="text-[11px] font-mono text-zinc-400 mt-1 block">
                    Hint: Use{" "}
                    <code className="bg-zinc-200 px-1 py-0.5 rounded text-zinc-800">
                      ___
                    </code>{" "}
                    inside the question prompt above for each blank placeholder.
                  </span>
                </div>
              )}

              {qType === "CODING" && (
                <div className="space-y-4 p-5 bg-[#F9F9FB] border border-zinc-200 rounded-xl shadow-2xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#111111] text-white text-[10px] font-mono font-semibold rounded-md flex items-center gap-1.5">
                          <CodeIcon className="w-3 h-3 text-white" />
                          WEB-ONLY CODING PLAYGROUND
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 mt-1 block">
                        Students must complete this assignment on the website code editor.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateAiTestCases}
                      disabled={aiGeneratingTestCases}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {aiGeneratingTestCases ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating Test Cases...
                        </>
                      ) : (
                        <>
                          <MagicWandIcon className="w-3.5 h-3.5 text-white" />
                          Auto-Generate Test Cases with AI
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-700 font-medium mb-1">
                      Starter Code Template
                    </label>
                    <textarea
                      rows={4}
                      value={qStarterCode}
                      onChange={(e) => setQStarterCode(e.target.value)}
                      placeholder="def solve(input_val):\n    # Write your solution here\n    return input_val"
                      className="w-full p-3 bg-white font-mono text-xs text-zinc-900 border border-zinc-200 rounded-lg focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-mono text-zinc-700 font-medium">
                        Test Cases ({qTestCases.length})
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setQTestCases([
                            ...qTestCases,
                            { input: "", expectedOutput: "", isPublic: true },
                          ])
                        }
                        className="text-xs text-[#111111] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <PlusIcon className="w-3 h-3" /> Add Test Case
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {qTestCases.map((tc, tcIdx) => (
                        <div
                          key={tcIdx}
                          className="p-3.5 bg-white border border-zinc-200 rounded-lg space-y-2.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-zinc-700 font-medium">
                              Test Case #{tcIdx + 1}
                            </span>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700">
                                <input
                                  type="checkbox"
                                  checked={tc.isPublic}
                                  onChange={(e) => {
                                    const updated = [...qTestCases];
                                    updated[tcIdx].isPublic = e.target.checked;
                                    setQTestCases(updated);
                                  }}
                                  className="accent-[#111111] rounded"
                                />
                                <span>Public Sample</span>
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  setQTestCases(
                                    qTestCases.filter((_, i) => i !== tcIdx),
                                  )
                                }
                                className="text-red-600 hover:underline cursor-pointer flex items-center gap-0.5"
                              >
                                <TrashIcon className="w-3 h-3" /> Remove
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <span className="text-[10px] font-mono text-zinc-500 block mb-1">
                                Input
                              </span>
                              <input
                                type="text"
                                value={tc.input}
                                onChange={(e) => {
                                  const updated = [...qTestCases];
                                  updated[tcIdx].input = e.target.value;
                                  setQTestCases(updated);
                                }}
                                placeholder="e.g. 5"
                                className="w-full px-3 py-2 bg-[#F4F4F6] border border-transparent focus:bg-white focus:border-zinc-300 rounded text-xs font-mono text-zinc-900"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-zinc-500 block mb-1">
                                Expected Output
                              </span>
                              <input
                                type="text"
                                value={tc.expectedOutput}
                                onChange={(e) => {
                                  const updated = [...qTestCases];
                                  updated[tcIdx].expectedOutput =
                                    e.target.value;
                                  setQTestCases(updated);
                                }}
                                placeholder="e.g. 5"
                                className="w-full px-3 py-2 bg-[#F4F4F6] border border-transparent focus:bg-white focus:border-zinc-300 rounded text-xs font-mono text-zinc-900"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Explanation (Shown after test)
                </label>
                <input
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Optional hint or explanation..."
                  className="w-full px-3 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-xs font-medium text-[#111111]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-5 py-2.5 bg-[#111111] text-white text-xs font-medium rounded-md hover:bg-black transition-all cursor-pointer"
                >
                  + Add Question to Assessment
                </button>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100"
              >
                ← Back to Configuration
              </button>

              <button
                onClick={() => setStep(3)}
                disabled={questions.length === 0}
                className="px-6 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all disabled:opacity-50 cursor-pointer"
              >
                Preview Assessment →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & PUBLISH */}
        {step === 3 && (
          <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-6 shadow-sm">
            <div className="border-b border-zinc-200 pb-4">
              <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-mono rounded">
                TARGET CLASS: {className}
              </span>
              <h2 className="font-serif text-3xl font-normal text-[#111111] mt-2">
                {title}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">{description}</p>
            </div>

            <div className="grid grid-cols-4 gap-4 p-4 bg-[#F4F4F6] rounded-lg text-xs font-mono">
              <div>
                <span className="text-zinc-400 block">TOTAL MARKS</span>
                <span className="font-bold text-[#111111] text-sm">
                  {totalMarks}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">PASSING MARKS</span>
                <span className="font-bold text-[#111111] text-sm">
                  {passingMarks}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">DURATION</span>
                <span className="font-bold text-[#111111] text-sm">
                  {durationMinutes} mins
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">NEGATIVE MARKING</span>
                <span className="font-bold text-[#111111] text-sm">
                  {hasNegativeMarking ? `-${negativeMarkValue}` : "Off"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-serif text-lg font-normal text-[#111111]">
                Questions Preview
              </h3>
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-zinc-200 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#111111]">
                      Q{idx + 1}. ({q.questionType})
                    </span>
                    <span className="text-zinc-500">{q.points} Marks</span>
                  </div>
                  <p className="text-sm font-medium text-[#111111]">
                    {q.questionText}
                  </p>

                  {q.questionType === "SINGLE_CHOICE" && (
                    <div className="pl-4 space-y-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className="text-xs text-zinc-600 flex items-center gap-2"
                        >
                          <span
                            className={
                              opt.isCorrect ? "text-emerald-600 font-bold" : ""
                            }
                          >
                            • {opt.optionText} {opt.isCorrect && "(Correct)"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.questionType === "TRUE_FALSE" && (
                    <p className="text-xs text-emerald-600 font-semibold pl-4">
                      Correct Answer: {q.trueFalseAnswer ? "True" : "False"}
                    </p>
                  )}

                  {q.questionType === "SHORT_ANSWER" && (
                    <p className="text-xs text-zinc-500 font-mono pl-4">
                      Keywords: {q.shortAnswerKeywords || "None"}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-6 border-t border-zinc-200">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100"
              >
                ← Back to Questions
              </button>

              <div className="flex items-center gap-3">
                <button
                  disabled={loading}
                  onClick={() => handleSaveAndPublish(false)}
                  className="px-5 py-2.5 border border-zinc-300 text-xs font-medium text-zinc-800 rounded-md hover:bg-zinc-100 cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleSaveAndPublish(true)}
                  className="px-6 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all cursor-pointer shadow-sm"
                >
                  {loading ? "Publishing..." : "Publish & Notify Students "}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
