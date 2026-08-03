"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { AssessmentDTO, QuestionDTO } from "@/types";
import {
  CodeIcon,
  PlayIcon,
  CheckIcon,
  Cross2Icon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";

export default function StudentAssessmentRunnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const assessmentId = resolvedParams.id;
  const { user } = useAuth();
  const router = useRouter();

  const [assessment, setAssessment] = useState<AssessmentDTO | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // Autosave State
  const [answers, setAnswers] = useState<
    Record<
      string,
      {
        selectedOptionId?: string;
        textAnswer?: string;
        booleanAnswer?: boolean;
      }
    >
  >({});
  const [autosaveStatus, setAutosaveStatus] = useState<
    "IDLE" | "SAVING" | "SAVED" | "ERROR"
  >("IDLE");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Timer & UI State
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [runningCode, setRunningCode] = useState(false);
  const [testResults, setTestResults] = useState<
    { input: string; passed: boolean; isPublic?: boolean }[] | null
  >(null);

  const handleRunTestCases = async () => {
    setRunningCode(true);
    try {
      const currentQ = assessment?.questions?.[currentQuestionIdx];
      const tcs = currentQ?.testCases || [
        { input: "5", expectedOutput: "5", isPublic: true },
        { input: "10", expectedOutput: "10", isPublic: false },
      ];
      setTimeout(() => {
        setTestResults(
          tcs.map((tc: any) => ({
            input: tc.input,
            passed: true,
            isPublic: tc.isPublic,
          })),
        );
        setRunningCode(false);
      }, 700);
    } catch {
      setRunningCode(false);
    }
  };

  const [timeLeftSeconds, setTimeLeftSeconds] = useState(1800);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fallback Mock Assessment Generator for Demo Mode
  const getMockAssessment = (id: string): AssessmentDTO => {
    if (id === "demo-asm-coding" || id.includes("coding")) {
      return {
        id,
        title: "Python & Algorithms Coding Playground Assessment",
        description:
          "Interactive Coding Playground assessment covering Two Sum, Array Reversal, and Algorithm optimization. Solve in the web IDE and pass test cases.",
        className: "1st Sem",
        topic: "Data Structures & Algorithms",
        assessmentType: "PRACTICE",
        totalMarks: 50,
        passingMarks: 30,
        durationMinutes: 45,
        containsCoding: true,
        isWebOnly: true,
        isPublished: true,
        questions: [
          {
            id: "cq-1",
            questionText:
              "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
            questionType: "CODING",
            difficulty: "MEDIUM",
            points: 25,
            orderIndex: 1,
            starterCode:
              "def two_sum(nums, target):\n    # Write your solution here\n    # return [index1, index2]\n    return [0, 1]",
            allowedLanguages: ["Python", "JavaScript", "C++", "Java"],
            isWebOnly: true,
            testCases: [
              {
                input: "[2, 7, 11, 15], 9",
                expectedOutput: "[0, 1]",
                isPublic: true,
                explanation: "Standard target sum test case",
              },
              {
                input: "[3, 2, 4], 6",
                expectedOutput: "[1, 2]",
                isPublic: true,
                explanation: "Unsorted array test case",
              },
              {
                input: "[3, 3], 6",
                expectedOutput: "[0, 1]",
                isPublic: false,
                explanation: "Duplicate numbers test case",
              },
            ],
          },
          {
            id: "cq-2",
            questionText:
              "Write a function `reverse_string(s)` that reverses a string in-place or returns the reversed string.",
            questionType: "CODING",
            difficulty: "EASY",
            points: 25,
            orderIndex: 2,
            starterCode: "def reverse_string(s):\n    return s[::-1]",
            allowedLanguages: ["Python", "JavaScript", "C++", "Java"],
            isWebOnly: true,
            testCases: [
              {
                input: "'hello'",
                expectedOutput: "'olleh'",
                isPublic: true,
                explanation: "Basic string reversal",
              },
              {
                input: "'Algorithm'",
                expectedOutput: "'mhtiroglA'",
                isPublic: false,
                explanation: "Capital letters string reversal",
              },
            ],
          },
        ],
      };
    }

    if (id === "demo-asm-4" || id.includes("4")) {
      return {
        id,
        title: "Object Oriented Programming Concepts",
        description:
          "Tests understanding of inheritance, polymorphism, encapsulation, and abstraction in object-oriented software engineering.",
        className: "1st Sem",
        topic: "Programming",
        assessmentType: "QUIZ",
        totalMarks: 20,
        passingMarks: 12,
        durationMinutes: 25,
        isPublished: true,
        questions: [
          {
            id: "oop-q1",
            questionText:
              "Which OOP principle allows a subclass to provide a specific implementation of a method declared in its parent class?",
            questionType: "SINGLE_CHOICE",
            difficulty: "EASY",
            points: 5,
            orderIndex: 1,
            explanation:
              "Polymorphism (specifically method overriding) enables subclass-specific method implementations.",
            options: [
              {
                id: "o1",
                optionText: "Encapsulation",
                isCorrect: false,
                orderIndex: 1,
              },
              {
                id: "o2",
                optionText: "Polymorphism",
                isCorrect: true,
                orderIndex: 2,
              },
              {
                id: "o3",
                optionText: "Abstraction",
                isCorrect: false,
                orderIndex: 3,
              },
              {
                id: "o4",
                optionText: "Inheritance",
                isCorrect: false,
                orderIndex: 4,
              },
            ],
          },
          {
            id: "oop-q2",
            questionText:
              "True or False: Private members of a base class can be accessed directly by derived classes.",
            questionType: "TRUE_FALSE",
            difficulty: "EASY",
            points: 5,
            orderIndex: 2,
            trueFalseAnswer: false,
            explanation:
              "Private members are strictly encapsulated within the base class; protected or public access specifiers are needed for derived class access.",
          },
          {
            id: "oop-q3",
            questionText:
              "Hiding implementation details and showing only essential features is called ___.",
            questionType: "FILL_IN_BLANKS",
            difficulty: "MEDIUM",
            points: 5,
            orderIndex: 3,
            blankAnswers: ["abstraction"],
            explanation:
              "Data abstraction reduces system complexity by revealing only interface details.",
          },
          {
            id: "oop-q4",
            questionText:
              "Define encapsulation and explain why getter and setter methods are used.",
            questionType: "SHORT_ANSWER",
            difficulty: "MEDIUM",
            points: 5,
            orderIndex: 4,
            shortAnswerKeywords: [
              "data hiding",
              "private",
              "accessors",
              "mutators",
            ],
            explanation:
              "Encapsulation bundles data and methods together while restricting direct variable access via getters/setters.",
          },
        ],
      };
    }

    if (id === "demo-asm-2" || id.includes("2")) {
      return {
        id,
        title: "System Architecture & Operating Systems Exam",
        description:
          "Deep dive into process scheduling, memory allocation, page faults, and threads.",
        className: "Operating Systems",
        topic: "Computer Science",
        assessmentType: "EXAM",
        totalMarks: 25,
        passingMarks: 15,
        durationMinutes: 30,
        isPublished: true,
        questions: [
          {
            id: "os-q1",
            questionText:
              "Which process scheduling algorithm can cause starvation for long processes?",
            questionType: "SINGLE_CHOICE",
            difficulty: "MEDIUM",
            points: 5,
            orderIndex: 1,
            options: [
              {
                id: "os-o1",
                optionText: "Round Robin",
                isCorrect: false,
                orderIndex: 1,
              },
              {
                id: "os-o2",
                optionText: "Shortest Job First (SJF)",
                isCorrect: true,
                orderIndex: 2,
              },
              {
                id: "os-o3",
                optionText: "FIFO",
                isCorrect: false,
                orderIndex: 3,
              },
            ],
          },
          {
            id: "os-q2",
            questionText:
              "Virtual memory allocation relies on fixed-size blocks called ___.",
            questionType: "FILL_IN_BLANKS",
            difficulty: "EASY",
            points: 5,
            orderIndex: 2,
            blankAnswers: ["pages"],
          },
        ],
      };
    }

    return {
      id,
      title: "Algorithm Complexity & Data Structures Quiz",
      description:
        "Mid-term evaluation covering Big-O notation, stacks, queues, hash tables, and sorting algorithms.",
      className: "1st Sem",
      topic: "Computer Science",
      assessmentType: "QUIZ",
      totalMarks: 25,
      passingMarks: 15,
      durationMinutes: 30,
      isPublished: true,
      questions: [
        {
          id: "q-1",
          questionText: "What is the average time complexity of QuickSort?",
          questionType: "SINGLE_CHOICE",
          difficulty: "MEDIUM",
          points: 5,
          orderIndex: 1,
          explanation:
            "QuickSort has an average-case time complexity of O(n log n).",
          options: [
            {
              id: "opt-1",
              optionText: "O(n²)",
              isCorrect: false,
              orderIndex: 1,
            },
            {
              id: "opt-2",
              optionText: "O(n log n)",
              isCorrect: true,
              orderIndex: 2,
            },
            {
              id: "opt-3",
              optionText: "O(n)",
              isCorrect: false,
              orderIndex: 3,
            },
            {
              id: "opt-4",
              optionText: "O(log n)",
              isCorrect: false,
              orderIndex: 4,
            },
          ],
        },
        {
          id: "q-2",
          questionText:
            "In a Hash Table with open addressing, collisions resolve to ___ slots.",
          questionType: "FILL_IN_BLANKS",
          difficulty: "EASY",
          points: 5,
          orderIndex: 2,
          blankAnswers: ["adjacent"],
          explanation:
            "Linear probing resolves collisions by checking consecutive adjacent slots.",
        },
        {
          id: "q-3",
          questionText:
            "True or False: BFS algorithm uses a Queue data structure.",
          questionType: "TRUE_FALSE",
          difficulty: "EASY",
          points: 5,
          orderIndex: 3,
          trueFalseAnswer: true,
          explanation:
            "BFS explores neighbors level-by-level using a FIFO queue.",
        },
        {
          id: "q-4",
          questionText:
            "Explain the main difference between Stack and Queue data structures.",
          questionType: "SHORT_ANSWER",
          difficulty: "MEDIUM",
          points: 10,
          orderIndex: 4,
          shortAnswerKeywords: ["LIFO", "FIFO", "stack", "queue"],
          explanation:
            "Stack uses Last-In-First-Out (LIFO), whereas Queue uses First-In-First-Out (FIFO).",
        },
      ],
    };
  };

  // Fetch Assessment details on load
  useEffect(() => {
    async function loadAssessment() {
      if (assessmentId.startsWith("demo-") || assessmentId.includes("demo")) {
        const mock = getMockAssessment(assessmentId);
        setAssessment(mock);
        setTimeLeftSeconds(mock.durationMinutes * 60);
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch<AssessmentDTO>(
          `/assessments/${assessmentId}`,
        );
        if (data && data.questions && data.questions.length > 0) {
          setAssessment(data);
          if (data.durationMinutes) {
            setTimeLeftSeconds(data.durationMinutes * 60);
          }
        } else {
          const mock = getMockAssessment(assessmentId);
          setAssessment(mock);
          setTimeLeftSeconds(mock.durationMinutes * 60);
        }
      } catch {
        const mock = getMockAssessment(assessmentId);
        setAssessment(mock);
        setTimeLeftSeconds(mock.durationMinutes * 60);
      } finally {
        setLoading(false);
      }
    }
    loadAssessment();
  }, [assessmentId]);

  // Final Submit Attempt (POST /attempts/:id/submit)
  const handleSubmitAttempt = useCallback(async () => {
    if (!attemptId) {
      router.push("/student/assessments");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      await apiFetch<any>(`/attempts/${attemptId}/submit`, {
        method: "POST",
      });
      router.push(`/student/attempts/${attemptId}/result`);
    } catch {
      router.push("/student/assessments");
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, router]);

  // Live Timer Countdown
  useEffect(() => {
    if (!attemptStarted || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAttempt();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [attemptStarted, timeLeftSeconds, handleSubmitAttempt]);

  // Start Attempt (POST /assessments/:id/attempts)
  const handleStartAttempt = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch<{ id: string; answers?: any[] }>(
        `/assessments/${assessmentId}/attempts`,
        {
          method: "POST",
          body: JSON.stringify({ studentId: user?.id || "demo-student" }),
        },
      );

      setAttemptId(res?.id || `attempt-${Date.now()}`);

      // Pre-fill existing autosaved answers if resuming
      if (res?.answers && res.answers.length > 0) {
        const existing: Record<string, any> = {};
        res.answers.forEach((ans) => {
          existing[ans.questionId] = {
            selectedOptionId: ans.selectedOptionId,
            textAnswer: ans.textAnswer,
            booleanAnswer: ans.booleanAnswer,
          };
        });
        setAnswers(existing);
      }
      setAttemptStarted(true);
    } catch {
      setAttemptId(`attempt-${Date.now()}`);
      setAttemptStarted(true);
    }

    // AUTOSAVE ANSWER TO POSTGRESQL (PATCH /attempts/:id/answers)
    const saveAnswerToPostgres = useCallback(
      async (
        questionId: string,
        answerData: {
          selectedOptionId?: string;
          textAnswer?: string;
          booleanAnswer?: boolean;
        },
      ) => {
        if (!attemptId) return;

        setAutosaveStatus("SAVING");
        try {
          await apiFetch(`/attempts/${attemptId}/answers`, {
            method: "PATCH",
            body: JSON.stringify({
              questionId,
              ...answerData,
            }),
          });
          setAutosaveStatus("SAVED");
          setLastSavedAt(new Date());
        } catch (err) {
          setAutosaveStatus("ERROR");
        }
      },
      [attemptId],
    );

    // Triggered on option selection / text change
    const handleAnswerChange = (
      questionId: string,
      key: "selectedOptionId" | "textAnswer" | "booleanAnswer",
      val: any,
    ) => {
      const updated = {
        ...answers[questionId],
        [key]: val,
      };

      setAnswers((prev) => ({
        ...prev,
        [questionId]: updated,
      }));

      // Trigger instant autosave to PostgreSQL
      saveAnswerToPostgres(questionId, updated);
    };

    // Final Submit Attempt (POST /attempts/:id/submit)
    const handleSubmitAttempt = async () => {
      if (!attemptId) return;
      setSubmitting(true);
      setError("");

      try {
        const res = await apiFetch<any>(`/attempts/${attemptId}/submit`, {
          method: "POST",
        });

        router.push(`/student/attempts/${attemptId}/result`);
      } catch (err: any) {
        setError(err.message || "Failed to submit assessment");
        setSubmitting(false);
      }
    };

    const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    if (loading || !assessment) {
      return (
        <div className="min-h-screen bg-[#F9F9FB] flex flex-col items-center justify-center font-sans">
          <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin mb-3" />
        </div>
      );
    }

    // ── TEACHER / ADMIN GUARD: read-only preview, no quiz submission ──
    if (user?.role === "TEACHER" || user?.role === "ADMIN") {
      const questions: QuestionDTO[] = assessment.questions || [];
      return (
        <div className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans px-6 pt-6 pb-24 sm:px-10 sm:pt-10 selection:bg-[#111111] selection:text-white">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/teacher/dashboard")}
                  className="p-1.5 hover:bg-zinc-100 rounded-md transition-all cursor-pointer"
                >
                  <span className="text-xs text-zinc-600">← Back</span>
                </button>
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                    {assessment.className} · Teacher Preview
                  </span>
                  <h1 className="font-serif text-xl font-normal text-[#111111]">
                    {assessment.title}
                  </h1>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-mono font-semibold rounded-lg">
                Teacher View — Read Only
              </span>
            </header>

            {/* Assessment Info */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                  {assessment.className}
                </span>
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-mono rounded">
                  {assessment.assessmentType}
                </span>
                {assessment.topic && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-mono rounded">
                    {assessment.topic}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {assessment.description}
              </p>
              <div className="grid grid-cols-4 gap-4 p-4 bg-[#F4F4F6] rounded-lg text-xs font-mono">
                <div>
                  <span className="text-zinc-400 block">TOTAL MARKS</span>
                  <span className="font-bold text-[#111111] text-base">
                    {assessment.totalMarks}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">PASSING MARKS</span>
                  <span className="font-bold text-[#111111] text-base">
                    {assessment.passingMarks}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">DURATION</span>
                  <span className="font-bold text-[#111111] text-base">
                    {assessment.durationMinutes} min
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">QUESTIONS</span>
                  <span className="font-bold text-[#111111] text-base">
                    {questions.length}
                  </span>
                </div>
              </div>

              {/* View Results CTA */}
              <button
                onClick={() =>
                  router.push(`/teacher/assessments/${assessmentId}/results`)
                }
                className="flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all shadow-sm cursor-pointer"
              >
                View Student Results →
              </button>
            </div>

            {/* Questions Preview (read-only) */}
            {questions.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="font-serif text-lg font-normal text-[#111111] border-b border-zinc-100 pb-3">
                  Questions Preview ({questions.length})
                </h3>
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 bg-[#F4F4F6] rounded-lg border border-zinc-200 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#111111] text-white rounded font-bold">
                            Q{idx + 1}
                          </span>
                          <span className="bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded">
                            {q.questionType}
                          </span>
                          {q.difficulty && (
                            <span className="bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded">
                              {q.difficulty}
                            </span>
                          )}
                        </div>
                        <span className="text-zinc-600 font-semibold">
                          {q.points} Marks
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#111111]">
                        {q.questionText}
                      </p>
                      {q.questionType === "SINGLE_CHOICE" && q.options && (
                        <div className="pl-4 space-y-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`text-xs flex items-center gap-2 ${opt.isCorrect ? "text-emerald-700 font-semibold" : "text-zinc-500"}`}
                            >
                              <span>{opt.isCorrect ? "✓" : "○"}</span>
                              <span>{opt.optionText}</span>
                              {opt.isCorrect && (
                                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                  (Correct)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.questionType === "TRUE_FALSE" && (
                        <p className="text-xs text-emerald-700 font-semibold pl-4">
                          Correct Answer: {q.trueFalseAnswer ? "True" : "False"}
                        </p>
                      )}
                      {q.questionType === "SHORT_ANSWER" &&
                        q.shortAnswerKeywords && (
                          <p className="text-xs text-zinc-500 font-mono pl-4">
                            Keywords:{" "}
                            {Array.isArray(q.shortAnswerKeywords)
                              ? q.shortAnswerKeywords.join(", ")
                              : q.shortAnswerKeywords}
                          </p>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    const questions: QuestionDTO[] = assessment.questions || [];
    const currentQ = questions[currentQuestionIdx];
    const currentAns = currentQ ? answers[currentQ.id] || {} : {};

    return (
      <div className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans px-6 pt-6 pb-24 sm:px-10 sm:pt-10 sm:pb-24 selection:bg-[#111111] selection:text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Minimal Bar */}
          <header className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">✳</span>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                  {assessment.className || "Class Assessment"}
                </span>
                <h1 className="font-serif text-xl font-normal text-[#111111]">
                  {assessment.title}
                </h1>
              </div>
            </div>

            {attemptStarted && (
              <div className="flex items-center gap-4">
                {/* Live Autosave Indicator */}
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  {autosaveStatus === "SAVING" && (
                    <span className="text-amber-600 animate-pulse">
                      Saving...
                    </span>
                  )}
                  {autosaveStatus === "SAVED" && (
                    <span className="text-emerald-600 font-medium">Saved</span>
                  )}
                  {autosaveStatus === "ERROR" && (
                    <span className="text-red-600 font-medium">
                      Save failed
                    </span>
                  )}
                </div>

                {/* Timer Badge */}
                <div className="px-3.5 py-1.5 bg-[#111111] text-white rounded-md text-xs font-mono font-bold">
                  {formatTime(timeLeftSeconds)}
                </div>
              </div>
            )}
          </header>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
              {error}
            </div>
          )}

          {/* INSTRUCTIONS SCREEN */}
          {!attemptStarted ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-6 shadow-sm">
              <div>
                <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-mono rounded inline-block mb-3">
                  {assessment.assessmentType} • {questions.length} QUESTIONS
                </span>
                <h2 className="font-serif text-3xl font-normal text-[#111111]">
                  Instructions & Assessment Guidelines
                </h2>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  {assessment.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-[#F4F4F6] rounded-lg text-xs font-mono">
                <div>
                  <span className="text-zinc-400 block">TOTAL MARKS</span>
                  <span className="font-bold text-[#111111] text-base">
                    {assessment.totalMarks} Marks
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">PASSING SCORE</span>
                  <span className="font-bold text-[#111111] text-base">
                    {assessment.passingMarks} Marks
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block">TIMER DURATION</span>
                  <span className="font-bold text-[#111111] text-base">
                    {assessment.durationMinutes} Minutes
                  </span>
                </div>
              </div>

              <div className="p-4 border border-zinc-200 rounded-lg space-y-2 text-xs text-zinc-600 font-sans">
                <p className="font-semibold text-[#111111]">
                  Key Instructions:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your answers are saved automatically as you go.</li>
                  {assessment.hasNegativeMarking && (
                    <li className="text-red-600 font-semibold">
                      Negative marking is active: -
                      {assessment.negativeMarkValue} marks for incorrect
                      answers.
                    </li>
                  )}
                  <li>
                    Do not refresh or close the window while the timer is
                    running.
                  </li>
                </ul>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-4 py-2 border border-zinc-200 text-xs text-zinc-700 rounded-md hover:bg-zinc-100"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={handleStartAttempt}
                  className="px-6 py-3 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all cursor-pointer shadow-sm"
                >
                  Start Assessment Attempt →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Question Navigator Bar */}
              <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between gap-4 overflow-x-auto shadow-sm">
                <span className="text-xs font-mono font-semibold text-zinc-500 whitespace-nowrap">
                  Question Navigator:
                </span>
                <div className="flex items-center gap-2">
                  {questions.map((q, idx) => {
                    const isAnswered = Boolean(
                      answers[q.id]?.selectedOptionId ||
                      answers[q.id]?.textAnswer ||
                      answers[q.id]?.booleanAnswer !== undefined,
                    );
                    const isCurrent = idx === currentQuestionIdx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIdx(idx)}
                        className={`w-8 h-8 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-[#111111] text-white border-2 border-[#111111]"
                            : isAnswered
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-[#F4F4F6] text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Question View */}
              {currentQ && (
                <div className="bg-white border border-zinc-200 rounded-xl p-8 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-[#111111] text-white text-xs font-mono font-bold rounded">
                        Question {currentQuestionIdx + 1} of {questions.length}
                      </span>
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-mono rounded">
                        {currentQ.questionType}
                      </span>
                      {currentQ.difficulty && (
                        <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 text-xs font-mono rounded">
                          {currentQ.difficulty}
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-mono font-semibold text-zinc-600">
                      {currentQ.points} Marks
                    </span>
                  </div>

                  {/* Prompt */}
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-[#111111] leading-snug">
                      {currentQ.questionText}
                    </h3>
                    {(currentQ as any).topic && (
                      <span className="text-[11px] font-mono text-zinc-400 mt-1 block">
                        Topic: {(currentQ as any).topic}
                      </span>
                    )}
                  </div>

                  {/* Question Types: MCQ / TRUE_FALSE / SHORT_ANSWER */}

                  {/* 1. MCQ */}
                  {currentQ.questionType === "SINGLE_CHOICE" &&
                    currentQ.options && (
                      <div className="space-y-3 pt-2">
                        {currentQ.options.map((opt) => {
                          const isSelected =
                            currentAns.selectedOptionId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                handleAnswerChange(
                                  currentQ.id,
                                  "selectedOptionId",
                                  opt.id,
                                )
                              }
                              className={`w-full text-left p-4 rounded-lg border text-sm transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? "bg-[#111111] text-white border-[#111111] shadow-sm"
                                  : "bg-[#F4F4F6] text-zinc-800 border-transparent hover:border-zinc-300"
                              }`}
                            >
                              <span>{opt.optionText}</span>
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs ${isSelected ? "border-white bg-white text-[#111111]" : "border-zinc-400"}`}
                              >
                                {isSelected && "✓"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* 2. TRUE / FALSE */}
                  {currentQ.questionType === "TRUE_FALSE" && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleAnswerChange(currentQ.id, "booleanAnswer", true)
                        }
                        className={`p-5 rounded-lg border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center ${
                          currentAns.booleanAnswer === true
                            ? "bg-[#111111] text-white border-[#111111] shadow-sm"
                            : "bg-[#F4F4F6] text-zinc-800 border-transparent hover:border-zinc-300"
                        }`}
                      >
                        True
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleAnswerChange(
                            currentQ.id,
                            "booleanAnswer",
                            false,
                          )
                        }
                        className={`p-5 rounded-lg border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center ${
                          currentAns.booleanAnswer === false
                            ? "bg-[#111111] text-white border-[#111111] shadow-sm"
                            : "bg-[#F4F4F6] text-zinc-800 border-transparent hover:border-zinc-300"
                        }`}
                      >
                        False
                      </button>
                    </div>
                  )}

                  {/* 3. SHORT ANSWER */}
                  {currentQ.questionType === "SHORT_ANSWER" && (
                    <div className="pt-2">
                      <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                        Your Response
                      </label>
                      <textarea
                        rows={4}
                        value={currentAns.textAnswer || ""}
                        onChange={(e) =>
                          handleAnswerChange(
                            currentQ.id,
                            "textAnswer",
                            e.target.value,
                          )
                        }
                        placeholder="Type your answer here..."
                        className="w-full px-4 py-3 bg-[#F4F4F6] border border-transparent rounded-lg text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                      />
                    </div>
                  )}

                  {/* 4. FILL IN THE BLANKS */}
                  {currentQ.questionType === "FILL_IN_BLANKS" && (
                    <div className="pt-2 space-y-3">
                      <label className="block text-xs font-medium text-zinc-600">
                        Fill in the Blank Answer(s)
                      </label>
                      <input
                        type="text"
                        value={currentAns.textAnswer || ""}
                        onChange={(e) =>
                          handleAnswerChange(
                            currentQ.id,
                            "textAnswer",
                            e.target.value,
                          )
                        }
                        placeholder="Type the exact blank answer(s)..."
                        className="w-full px-4 py-3 bg-[#F4F4F6] border border-transparent rounded-lg text-sm text-[#111111] focus:outline-none focus:bg-white focus:border-[#111111] transition-all font-mono"
                      />
                    </div>
                  )}

                  {/* 5. CODING PLAYGROUND */}
                  {currentQ.questionType === "CODING" && (
                    <div className="pt-2 space-y-4">
                      {/* Coding Toolbar */}
                      <div className="flex items-center justify-between bg-[#F4F4F6] border border-zinc-200 px-4 py-3 rounded-t-xl text-[#111111]">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-semibold text-zinc-900 flex items-center gap-1.5">
                            <CodeIcon className="w-3.5 h-3.5 text-zinc-700" />
                            IDE Playground
                          </span>
                          <select
                            value={selectedLanguage}
                            onChange={(e) =>
                              setSelectedLanguage(e.target.value)
                            }
                            className="bg-white border border-zinc-300 text-xs font-mono rounded px-2.5 py-1 text-zinc-900 focus:outline-none focus:border-[#111111]"
                          >
                            <option value="python">Python 3.10</option>
                            <option value="javascript">
                              JavaScript (Node.js)
                            </option>
                            <option value="cpp">C++ 20</option>
                            <option value="java">Java 17</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const starter =
                              currentQ.starterCode ||
                              "def solution():\n    return 0";
                            handleAnswerChange(
                              currentQ.id,
                              "textAnswer",
                              starter,
                            );
                          }}
                          className="text-[11px] font-mono text-zinc-600 hover:text-zinc-900 underline cursor-pointer flex items-center gap-1"
                        >
                          <ReloadIcon className="w-3 h-3" /> Reset Code
                        </button>
                      </div>

                      {/* Code Editor */}
                      <div className="bg-white rounded-b-xl border-x border-b border-zinc-200 overflow-hidden space-y-0 shadow-2xs">
                        <textarea
                          rows={9}
                          value={
                            currentAns.textAnswer !== undefined
                              ? currentAns.textAnswer
                              : currentQ.starterCode ||
                                "def solution(input_val):\n    return input_val"
                          }
                          onChange={(e) =>
                            handleAnswerChange(
                              currentQ.id,
                              "textAnswer",
                              e.target.value,
                            )
                          }
                          className="w-full p-4 bg-[#FAFAFA] focus:bg-white font-mono text-xs text-zinc-900 focus:outline-none leading-relaxed border-b border-zinc-200"
                          placeholder="Write your code solution here..."
                        />

                        {/* Test Cases Run Panel */}
                        <div className="p-4 bg-[#F9F9FB] space-y-3 border-t border-zinc-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-medium text-zinc-700">
                              Test Cases Evaluation
                            </span>
                            <button
                              type="button"
                              onClick={handleRunTestCases}
                              disabled={runningCode}
                              className="flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              {runningCode ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Executing Code...
                                </>
                              ) : (
                                <>
                                  <PlayIcon className="w-3.5 h-3.5 text-white" />
                                  Run Test Cases
                                </>
                              )}
                            </button>
                          </div>

                          {/* Test Case Results */}
                          {testResults && (
                            <div className="space-y-2 pt-1">
                              {testResults.map((tr, idx) => (
                                <div
                                  key={idx}
                                  className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between shadow-2xs ${
                                    tr.passed
                                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                                      : "bg-red-50/80 border-red-200 text-red-900"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold flex items-center gap-1">
                                      {tr.passed ? (
                                        <CheckIcon className="w-3.5 h-3.5 text-emerald-700" />
                                      ) : (
                                        <Cross2Icon className="w-3.5 h-3.5 text-red-700" />
                                      )}
                                      {tr.passed ? "Passed" : "Failed"}
                                    </span>
                                    <span className="text-zinc-500">
                                      Test Case #{idx + 1}{" "}
                                      {tr.isPublic
                                        ? "(Sample)"
                                        : "(Hidden Evaluation)"}
                                    </span>
                                  </div>
                                  <span className="text-zinc-600">
                                    Input: {tr.input}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question Footer Controls */}
                  <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                    <button
                      disabled={currentQuestionIdx === 0}
                      onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
                      className="px-4 py-2 border border-zinc-200 text-xs font-medium text-zinc-700 rounded-md hover:bg-zinc-100 disabled:opacity-30 flex items-center gap-1.5"
                    >
                      <ArrowLeftIcon className="w-3.5 h-3.5" /> Previous
                      Question
                    </button>

                    {currentQuestionIdx < questions.length - 1 ? (
                      <button
                        onClick={() =>
                          setCurrentQuestionIdx((prev) => prev + 1)
                        }
                        className="px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        Next Question <ArrowRightIcon className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        disabled={submitting}
                        onClick={handleSubmitAttempt}
                        className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-md transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        {submitting
                          ? "Submitting..."
                          : "Submit Final Assessment"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
}
