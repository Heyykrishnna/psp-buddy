"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { SlidingTabs } from "@/components/SlidingTabs";
import {
  AssessmentDTO,
  ClassStudentRankingDTO,
  ClassTopicDTO,
  StudentPerformanceDTO,
} from "@/types";
import {
  BarChartIcon,
  ReaderIcon,
  ExitIcon,
  TargetIcon,
  RocketIcon,
  PersonIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  Cross2Icon,
  CheckCircledIcon,
  CrossCircledIcon,
  MagnifyingGlassIcon,
  PlusCircledIcon,
  ClockIcon,
  ArrowLeftIcon,
  TrashIcon,
  EyeOpenIcon,
  Pencil1Icon,
  PlusIcon,
} from "@radix-ui/react-icons";

// ------------- Mock Data -------------
const MOCK_STUDENTS: ClassStudentRankingDTO[] = [
  {
    rank: 1,
    studentId: "stu-001",
    name: "Aarav Mehta",
    email: "aarav.mehta@student.edu",
    totalXp: 2450,
    averageScore: 87,
    assessmentsAttempted: 6,
    weakTopics: [{ topic: "Recursion", masteryScore: 42 }],
  },
  {
    rank: 2,
    studentId: "stu-002",
    name: "Priya Sharma",
    email: "priya.sharma@student.edu",
    totalXp: 2100,
    averageScore: 81,
    assessmentsAttempted: 5,
    weakTopics: [{ topic: "Graphs", masteryScore: 35 }],
  },
  {
    rank: 3,
    studentId: "stu-003",
    name: "Rohan Kulkarni",
    email: "rohan.k@student.edu",
    totalXp: 1880,
    averageScore: 73,
    assessmentsAttempted: 6,
    weakTopics: [
      { topic: "Trees", masteryScore: 38 },
      { topic: "DP", masteryScore: 29 },
    ],
  },
  {
    rank: 4,
    studentId: "stu-004",
    name: "Sneha Patil",
    email: "sneha.p@student.edu",
    totalXp: 1540,
    averageScore: 68,
    assessmentsAttempted: 4,
    weakTopics: [{ topic: "Sorting", masteryScore: 50 }],
  },
  {
    rank: 5,
    studentId: "stu-005",
    name: "Dev Agarwal",
    email: "dev.a@student.edu",
    totalXp: 1200,
    averageScore: 61,
    assessmentsAttempted: 5,
    weakTopics: [
      { topic: "Recursion", masteryScore: 28 },
      { topic: "Graphs", masteryScore: 22 },
    ],
  },
  {
    rank: 6,
    studentId: "stu-006",
    name: "Ananya Singh",
    email: "ananya.s@student.edu",
    totalXp: 980,
    averageScore: 55,
    assessmentsAttempted: 3,
    weakTopics: [
      { topic: "Arrays", masteryScore: 45 },
      { topic: "Recursion", masteryScore: 31 },
    ],
  },
];

const MOCK_TOPICS: ClassTopicDTO[] = [
  {
    topic: "Arrays & Strings",
    studentsTracked: 6,
    averageMastery: 76,
    weakStudentsCount: 1,
    masteredStudentsCount: 3,
  },
  {
    topic: "Sorting Algorithms",
    studentsTracked: 6,
    averageMastery: 68,
    weakStudentsCount: 2,
    masteredStudentsCount: 2,
  },
  {
    topic: "Recursion",
    studentsTracked: 6,
    averageMastery: 41,
    weakStudentsCount: 4,
    masteredStudentsCount: 0,
  },
  {
    topic: "Trees & Heaps",
    studentsTracked: 5,
    averageMastery: 52,
    weakStudentsCount: 2,
    masteredStudentsCount: 1,
  },
  {
    topic: "Graphs",
    studentsTracked: 5,
    averageMastery: 38,
    weakStudentsCount: 3,
    masteredStudentsCount: 0,
  },
  {
    topic: "Dynamic Programming",
    studentsTracked: 4,
    averageMastery: 33,
    weakStudentsCount: 3,
    masteredStudentsCount: 0,
  },
];

const MOCK_ASSESSMENTS: AssessmentDTO[] = [
  {
    id: "asm-t1",
    title: "Algorithm Complexity & Data Structures Quiz",
    description: "Mid-term evaluation covering Big-O analysis and sorting.",
    className: "1st Sem",
    topic: "Computer Science",
    assessmentType: "QUIZ",
    totalMarks: 25,
    passingMarks: 15,
    durationMinutes: 30,
    hasNegativeMarking: true,
    negativeMarkValue: 0.25,
    isPublished: true,
    _count: { questions: 10, attempts: 5 },
  },
  {
    id: "asm-t2",
    title: "Discrete Mathematics & Logic Gates Exam",
    description: "Propositional logic, set theory, and boolean algebra.",
    className: "2nd Sem",
    topic: "Mathematics",
    assessmentType: "EXAM",
    totalMarks: 40,
    passingMarks: 24,
    durationMinutes: 60,
    hasNegativeMarking: false,
    negativeMarkValue: 0,
    isPublished: true,
    _count: { questions: 15, attempts: 6 },
  },
  {
    id: "asm-t3",
    title: "OOP & Design Patterns Practice",
    description: "Inheritance, polymorphism, and SOLID principles.",
    className: "1st Sem",
    topic: "Programming",
    assessmentType: "PRACTICE",
    totalMarks: 20,
    passingMarks: 12,
    durationMinutes: 25,
    hasNegativeMarking: false,
    negativeMarkValue: 0,
    isPublished: false,
    _count: { questions: 8, attempts: 0 },
  },
];

// Mock per-student history (keyed by studentId)
const MOCK_STUDENT_HISTORY: Record<string, StudentPerformanceDTO[]> = {
  "stu-001": [
    {
      attemptId: "att-a1",
      assessmentTitle: "Algorithm Complexity & Data Structures Quiz",
      className: "1st Sem",
      topic: "Computer Science",
      assessmentType: "QUIZ",
      totalScore: 22,
      maxScore: 25,
      percentage: 88,
      submittedAt: "2026-07-28T09:45:00Z",
      startedAt: "2026-07-28T09:15:00Z",
    },
    {
      attemptId: "att-a2",
      assessmentTitle: "Discrete Mathematics & Logic Gates Exam",
      className: "2nd Sem",
      topic: "Mathematics",
      assessmentType: "EXAM",
      totalScore: 34,
      maxScore: 40,
      percentage: 85,
      submittedAt: "2026-07-20T11:00:00Z",
      startedAt: "2026-07-20T10:00:00Z",
    },
  ],
  "stu-002": [
    {
      attemptId: "att-b1",
      assessmentTitle: "Algorithm Complexity & Data Structures Quiz",
      className: "1st Sem",
      topic: "Computer Science",
      assessmentType: "QUIZ",
      totalScore: 19,
      maxScore: 25,
      percentage: 76,
      submittedAt: "2026-07-28T10:20:00Z",
      startedAt: "2026-07-28T09:50:00Z",
    },
  ],
  "stu-003": [
    {
      attemptId: "att-c1",
      assessmentTitle: "Algorithm Complexity & Data Structures Quiz",
      className: "1st Sem",
      topic: "Computer Science",
      assessmentType: "QUIZ",
      totalScore: 16,
      maxScore: 25,
      percentage: 64,
      submittedAt: "2026-07-28T10:00:00Z",
      startedAt: "2026-07-28T09:30:00Z",
    },
    {
      attemptId: "att-c2",
      assessmentTitle: "OOP & Design Patterns Practice",
      className: "1st Sem",
      topic: "Programming",
      assessmentType: "PRACTICE",
      totalScore: 14,
      maxScore: 20,
      percentage: 70,
      submittedAt: "2026-07-22T14:00:00Z",
      startedAt: "2026-07-22T13:35:00Z",
    },
  ],
  "stu-004": [
    {
      attemptId: "att-d1",
      assessmentTitle: "Discrete Mathematics & Logic Gates Exam",
      className: "2nd Sem",
      topic: "Mathematics",
      assessmentType: "EXAM",
      totalScore: 26,
      maxScore: 40,
      percentage: 65,
      submittedAt: "2026-07-20T11:45:00Z",
      startedAt: "2026-07-20T10:45:00Z",
    },
  ],
  "stu-005": [
    {
      attemptId: "att-e1",
      assessmentTitle: "Algorithm Complexity & Data Structures Quiz",
      className: "1st Sem",
      topic: "Computer Science",
      assessmentType: "QUIZ",
      totalScore: 13,
      maxScore: 25,
      percentage: 52,
      submittedAt: "2026-07-28T10:45:00Z",
      startedAt: "2026-07-28T10:15:00Z",
    },
    {
      attemptId: "att-e2",
      assessmentTitle: "Discrete Mathematics & Logic Gates Exam",
      className: "2nd Sem",
      topic: "Mathematics",
      assessmentType: "EXAM",
      totalScore: 22,
      maxScore: 40,
      percentage: 55,
      submittedAt: "2026-07-20T12:00:00Z",
      startedAt: "2026-07-20T11:00:00Z",
    },
  ],
  "stu-006": [
    {
      attemptId: "att-f1",
      assessmentTitle: "OOP & Design Patterns Practice",
      className: "1st Sem",
      topic: "Programming",
      assessmentType: "PRACTICE",
      totalScore: 10,
      maxScore: 20,
      percentage: 50,
      submittedAt: "2026-07-22T15:00:00Z",
      startedAt: "2026-07-22T14:35:00Z",
    },
  ],
};

// ------------- Helper Components -------------

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex flex-col gap-1">
      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
        {label}
      </span>
      <span
        className={`text-3xl font-bold font-mono ${accent || "text-[#111111]"}`}
      >
        {value}
      </span>
      {sub && <span className="text-[11px] text-zinc-400">{sub}</span>}
    </div>
  );
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

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    QUIZ: "bg-blue-50 text-blue-700",
    EXAM: "bg-red-50 text-red-700",
    PRACTICE: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${styles[type] || "bg-zinc-100 text-zinc-600"}`}
    >
      {type}
    </span>
  );
}

// ------------- Main Page -------------

type ActiveTab = "overview" | "students" | "topics" | "assessments";

export default function TeacherDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [students, setStudents] = useState<ClassStudentRankingDTO[]>([]);
  const [topics, setTopics] = useState<ClassTopicDTO[]>([]);
  const [assessments, setAssessments] = useState<AssessmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [assessmentFilter, setAssessmentFilter] = useState<
    "ALL" | "PUBLISHED" | "DRAFT"
  >("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Launch / Publish draft assessment
  const handleLaunchAssessment = async (assessmentId: string) => {
    try {
      await apiFetch(`/assessments/${assessmentId}/publish`, {
        method: "POST",
      });
    } catch {}
    setAssessments((prev) =>
      prev.map((asm) =>
        asm.id === assessmentId ? { ...asm, isPublished: true } : asm,
      ),
    );
    setToastMessage(
      "Assessment launched successfully! Students can now attempt it.",
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Delete assessment state & handler
  const [deleteConfirmAsm, setDeleteConfirmAsm] =
    useState<AssessmentDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDeleteAssessment = async (assessmentId: string) => {
    setIsDeleting(true);
    try {
      await apiFetch(`/assessments/${assessmentId}`, {
        method: "DELETE",
      });
      setAssessments((prev) => prev.filter((asm) => asm.id !== assessmentId));
      setToastMessage("Assessment deleted successfully.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to delete assessment");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmAsm(null);
    }
  };

  // Preview & Edit assessment state & handlers
  const [previewAsmId, setPreviewAsmId] = useState<string | null>(null);
  const [previewAsmData, setPreviewAsmData] = useState<AssessmentDTO | null>(
    null,
  );
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const [isEditingPreview, setIsEditingPreview] = useState<boolean>(false);
  const [editedAsmData, setEditedAsmData] = useState<AssessmentDTO | null>(
    null,
  );
  const [isSavingPreview, setIsSavingPreview] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const handlePreviewAssessment = async (assessmentId: string) => {
    setPreviewAsmId(assessmentId);
    setPreviewLoading(true);
    setIsEditingPreview(false);
    setIsDirty(false);
    try {
      const data = await apiFetch<AssessmentDTO>(
        `/assessments/${assessmentId}`,
      );
      setPreviewAsmData(data);
      setEditedAsmData(JSON.parse(JSON.stringify(data)));
    } catch (err: any) {
      alert("Failed to load assessment preview details.");
      setPreviewAsmId(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const updateGeneralSetting = (field: string, value: any) => {
    if (!editedAsmData) return;
    setEditedAsmData({ ...editedAsmData, [field]: value });
    setIsDirty(true);
  };

  const updateQuestionField = (qIdx: number, field: string, value: any) => {
    if (!editedAsmData || !editedAsmData.questions) return;
    const updated = [...editedAsmData.questions];
    updated[qIdx] = { ...updated[qIdx], [field]: value };
    setEditedAsmData({ ...editedAsmData, questions: updated });
    setIsDirty(true);
  };

  const updateOptionField = (
    qIdx: number,
    oIdx: number,
    field: string,
    value: any,
  ) => {
    if (!editedAsmData || !editedAsmData.questions) return;
    const updatedQ = [...editedAsmData.questions];
    const targetQ = { ...updatedQ[qIdx] };
    if (!targetQ.options) return;
    const updatedOpts = targetQ.options.map((opt) => ({ ...opt }));

    if (field === "isCorrect" && targetQ.questionType === "SINGLE_CHOICE") {
      updatedOpts.forEach((opt, idx) => {
        opt.isCorrect = idx === oIdx ? Boolean(value) : false;
      });
    } else {
      updatedOpts[oIdx] = { ...updatedOpts[oIdx], [field]: value };
    }

    targetQ.options = updatedOpts;
    updatedQ[qIdx] = targetQ;
    setEditedAsmData({ ...editedAsmData, questions: updatedQ });
    setIsDirty(true);
  };

  const addOptionToQuestion = (qIdx: number) => {
    if (!editedAsmData || !editedAsmData.questions) return;
    const updatedQ = [...editedAsmData.questions];
    const targetQ = { ...updatedQ[qIdx] };
    const opts = targetQ.options ? targetQ.options.map((o) => ({ ...o })) : [];
    opts.push({
      id: `opt-${Date.now()}-${Math.random()}`,
      optionText: `Option ${String.fromCharCode(65 + opts.length)}`,
      isCorrect: false,
      orderIndex: opts.length + 1,
    });
    targetQ.options = opts;
    updatedQ[qIdx] = targetQ;
    setEditedAsmData({ ...editedAsmData, questions: updatedQ });
    setIsDirty(true);
  };

  const removeOptionFromQuestion = (qIdx: number, oIdx: number) => {
    if (!editedAsmData || !editedAsmData.questions) return;
    const updatedQ = [...editedAsmData.questions];
    const targetQ = { ...updatedQ[qIdx] };
    if (!targetQ.options) return;
    targetQ.options = targetQ.options.filter((_, idx) => idx !== oIdx);
    updatedQ[qIdx] = targetQ;
    setEditedAsmData({ ...editedAsmData, questions: updatedQ });
    setIsDirty(true);
  };

  const addNewQuestion = () => {
    if (!editedAsmData) return;
    const existing = editedAsmData.questions
      ? editedAsmData.questions.map((q) => ({ ...q }))
      : [];
    existing.push({
      id: `q-${Date.now()}`,
      assessmentId: editedAsmData.id,
      questionText: "New Question Text",
      questionType: "SINGLE_CHOICE",
      points: 1,
      orderIndex: existing.length + 1,
      options: [
        {
          id: `opt-1-${Date.now()}`,
          optionText: "Option A",
          isCorrect: true,
          orderIndex: 1,
        },
        {
          id: `opt-2-${Date.now()}`,
          optionText: "Option B",
          isCorrect: false,
          orderIndex: 2,
        },
      ],
    });
    setEditedAsmData({ ...editedAsmData, questions: existing });
    setIsDirty(true);
  };

  const removeQuestion = (qIdx: number) => {
    if (!editedAsmData || !editedAsmData.questions) return;
    const updated = editedAsmData.questions.filter((_, idx) => idx !== qIdx);
    setEditedAsmData({ ...editedAsmData, questions: updated });
    setIsDirty(true);
  };

  const handleSaveEditedAssessment = async () => {
    if (!editedAsmData) return;
    setIsSavingPreview(true);
    try {
      const updated = await apiFetch<AssessmentDTO>(
        `/assessments/${editedAsmData.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editedAsmData.title,
            description: editedAsmData.description,
            className: editedAsmData.className,
            topic: editedAsmData.topic,
            assessmentType: editedAsmData.assessmentType,
            totalMarks: Number(editedAsmData.totalMarks),
            passingMarks: Number(editedAsmData.passingMarks),
            durationMinutes: Number(editedAsmData.durationMinutes),
            hasNegativeMarking: editedAsmData.hasNegativeMarking,
            negativeMarkValue: Number(editedAsmData.negativeMarkValue || 0),
            isWorkbook: editedAsmData.isWorkbook,
            workbookUrl: editedAsmData.workbookUrl,
            questions: (editedAsmData.questions || []).map((q, idx) => ({
              questionText: q.questionText,
              questionType: q.questionType,
              points: Number(q.points || 1),
              explanation: q.explanation,
              trueFalseAnswer: q.trueFalseAnswer,
              shortAnswerKeywords: Array.isArray(q.shortAnswerKeywords)
                ? q.shortAnswerKeywords
                : typeof q.shortAnswerKeywords === "string"
                  ? (q.shortAnswerKeywords as string)
                      .split(",")
                      .map((s) => s.trim())
                  : [],
              options: (q.options || []).map((opt, oIdx) => ({
                optionText: opt.optionText,
                isCorrect: Boolean(opt.isCorrect),
                orderIndex: oIdx + 1,
              })),
            })),
          }),
        },
      );

      setPreviewAsmData(updated);
      setEditedAsmData(JSON.parse(JSON.stringify(updated)));
      setIsDirty(false);

      setAssessments((prev) =>
        prev.map((asm) =>
          asm.id === updated.id ? { ...asm, ...updated } : asm,
        ),
      );

      alert("Assessment & questions updated successfully!");
    } catch (err: any) {
      alert(err?.message || "Failed to save assessment edits.");
    } finally {
      setIsSavingPreview(false);
    }
  };

  // Selected student for drill-down history view
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [studentHistory, setStudentHistory] = useState<StudentPerformanceDTO[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [studentsRes, topicsRes, assessmentsRes] =
          await Promise.allSettled([
            apiFetch<ClassStudentRankingDTO[]>("/analytics/class/students"),
            apiFetch<ClassTopicDTO[]>("/analytics/class/topics"),
            apiFetch<AssessmentDTO[]>("/assessments"),
          ]);

        setStudents(
          studentsRes.status === "fulfilled" ? studentsRes.value || [] : [],
        );
        setTopics(
          topicsRes.status === "fulfilled" ? topicsRes.value || [] : [],
        );
        setAssessments(
          assessmentsRes.status === "fulfilled"
            ? assessmentsRes.value || []
            : [],
        );
      } catch {
        setStudents([]);
        setTopics([]);
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const openStudentHistory = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setHistoryLoading(true);
    try {
      const data = await apiFetch<StudentPerformanceDTO[]>(
        `/analytics/student/${studentId}/performance`,
      );
      setStudentHistory(data || []);
    } catch {
      setStudentHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectedStudent = students.find(
    (s) => s.studentId === selectedStudentId,
  );

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Overview stats
  const totalStudents = students.length;
  const publishedAssessments = assessments.filter((a) => a.isPublished).length;
  const avgScore =
    students.length > 0
      ? Math.round(
          students.reduce((sum, s) => sum + s.averageScore, 0) /
            students.length,
        )
      : 0;
  const passRate =
    students.length > 0
      ? Math.round(
          (students.filter((s) => s.averageScore >= 50).length /
            students.length) *
            100,
        )
      : 0;

  const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <BarChartIcon className="w-3.5 h-3.5" />,
    },
    {
      id: "students",
      label: "Students",
      icon: <PersonIcon className="w-3.5 h-3.5" />,
    },
    {
      id: "topics",
      label: "Topic Analysis",
      icon: <TargetIcon className="w-3.5 h-3.5" />,
    },
    {
      id: "assessments",
      label: "Assessments",
      icon: <ReaderIcon className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans px-6 pt-6 pb-24 md:px-12 md:pt-12 selection:bg-[#111111] selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-[#111111] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-zinc-700 animate-in fade-in slide-in-from-top-3 duration-300">
            <CheckCircledIcon className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* ── Top Navbar ── */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#111111] rounded-lg flex items-center justify-center">
              <ReaderIcon className="text-white w-4 h-4" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-normal text-[#111111]">
                PSP Lumora
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Teacher Portal ·{" "}
                <span className="font-semibold text-[#111111]">
                  {user?.firstName} {user?.lastName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/teacher/assessments/new")}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#5451FF] hover:bg-[#4340e0] text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer"
            >
              <PlusCircledIcon className="w-3.5 h-3.5" />
              New Assessment
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all shadow-sm cursor-pointer"
            >
              <ExitIcon className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        {/* ── Role Banner ── */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 rounded bg-[#5451FF] text-white text-[10px] font-mono uppercase tracking-wider font-semibold">
              TEACHER
            </span>
            <h2 className="font-serif text-2xl font-normal text-[#111111] mt-3">
              Class Management & Analytics
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Monitor student performance, track progress, and manage
              assessments.
            </p>
          </div>
          <div className="flex items-center gap-6 text-center">
            <div>
              <p className="text-2xl font-bold font-mono text-[#111111]">
                {totalStudents}
              </p>
              <p className="text-[10px] font-mono text-zinc-400 uppercase">
                Students
              </p>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div>
              <p className="text-2xl font-bold font-mono text-[#111111]">
                {publishedAssessments}
              </p>
              <p className="text-[10px] font-mono text-zinc-400 uppercase">
                Published
              </p>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div>
              <p
                className={`text-2xl font-bold font-mono ${avgScore >= 70 ? "text-emerald-600" : avgScore >= 50 ? "text-blue-600" : "text-red-600"}`}
              >
                {avgScore}%
              </p>
              <p className="text-[10px] font-mono text-zinc-400 uppercase">
                Avg Score
              </p>
            </div>
          </div>
        </div>

        {/* ── Sliding Tabs ── */}
        <SlidingTabs<ActiveTab>
          tabs={TABS}
          activeId={activeTab}
          onChange={setActiveTab}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-8 h-8 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-zinc-400">
              Loading class data...
            </span>
          </div>
        ) : (
          <>
            {/* ══════════════════════════════════════════
                TAB: OVERVIEW
            ══════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Students"
                    value={totalStudents}
                    sub="Enrolled in class"
                  />
                  <StatCard
                    label="Class Avg Score"
                    value={`${avgScore}%`}
                    sub="Across all assessments"
                    accent={
                      avgScore >= 70
                        ? "text-emerald-600"
                        : avgScore >= 50
                          ? "text-blue-600"
                          : "text-red-600"
                    }
                  />
                  <StatCard
                    label="Pass Rate"
                    value={`${passRate}%`}
                    sub="Students ≥ 50%"
                    accent={
                      passRate >= 70
                        ? "text-emerald-600"
                        : passRate >= 50
                          ? "text-blue-600"
                          : "text-red-600"
                    }
                  />
                  <StatCard
                    label="Assessments"
                    value={`${publishedAssessments}/${assessments.length}`}
                    sub="Published / Total"
                  />
                </div>

                {/* Top Performers + At Risk */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Performers */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-3">
                      <CheckCircledIcon className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-serif text-lg font-normal text-[#111111]">
                        Top Performers
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {students
                        .filter((s) => s.averageScore >= 75)
                        .slice(0, 4)
                        .map((s) => (
                          <div
                            key={s.studentId}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#111111]">
                                  {s.name}
                                </p>
                                <p className="text-[11px] font-mono text-zinc-400">
                                  {s.assessmentsAttempted} attempts
                                </p>
                              </div>
                            </div>
                            <ScoreBadge pct={s.averageScore} />
                          </div>
                        ))}
                      {students.filter((s) => s.averageScore >= 75).length ===
                        0 && (
                        <p className="text-xs text-zinc-400 italic text-center py-4">
                          No students above 75% yet.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* At Risk */}
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-3">
                      <CrossCircledIcon className="w-4 h-4 text-red-500" />
                      <h3 className="font-serif text-lg font-normal text-[#111111]">
                        Needs Attention
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {students
                        .filter((s) => s.averageScore < 65)
                        .map((s) => (
                          <div
                            key={s.studentId}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-50 border border-red-200 rounded-full flex items-center justify-center text-xs font-bold text-red-700">
                                {s.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#111111]">
                                  {s.name}
                                </p>
                                <p className="text-[11px] font-mono text-zinc-400">
                                  Weak:{" "}
                                  {s.weakTopics.map((t) => t.topic).join(", ")}
                                </p>
                              </div>
                            </div>
                            <ScoreBadge pct={s.averageScore} />
                          </div>
                        ))}
                      {students.filter((s) => s.averageScore < 65).length ===
                        0 && (
                        <p className="text-xs text-zinc-400 italic text-center py-4">
                          All students performing well!
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hardest Topics */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5 border-b border-zinc-100 pb-3">
                    <TargetIcon className="w-4 h-4 text-[#111111]" />
                    <h3 className="font-serif text-xl font-normal text-[#111111]">
                      Class Topic Mastery Snapshot
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {topics.map((t) => (
                      <div key={t.topic} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#111111] w-44">
                              {t.topic}
                            </span>
                            <span className="text-zinc-400 font-mono">
                              {t.studentsTracked} students
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {t.weakStudentsCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-mono rounded border border-red-200">
                                {t.weakStudentsCount} weak
                              </span>
                            )}
                            <span className="font-mono font-bold text-[#111111]">
                              {Math.round(t.averageMastery)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${t.averageMastery >= 70 ? "bg-emerald-500" : t.averageMastery >= 50 ? "bg-blue-500" : "bg-red-400"}`}
                            style={{
                              width: `${Math.min(100, t.averageMastery)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Assessments */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-5">
                    <div className="flex items-center gap-2">
                      <ReaderIcon className="w-4 h-4 text-[#111111]" />
                      <h3 className="font-serif text-xl font-normal text-[#111111]">
                        Recent Assessments
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("assessments")}
                      className="text-xs font-medium text-[#111111] underline hover:no-underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {assessments.slice(0, 3).map((asm) => (
                      <div
                        key={asm.id}
                        className="flex items-center justify-between p-4 bg-[#F4F4F6] rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                              {asm.className}
                            </span>
                            <TypeBadge type={String(asm.assessmentType)} />
                            {!asm.isPublished && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-mono rounded border border-amber-200">
                                DRAFT
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-[#111111]">
                            {asm.title}
                          </p>
                          <p className="text-[11px] font-mono text-zinc-400">
                            {asm._count?.attempts || 0} attempts ·{" "}
                            {asm._count?.questions || 0} questions ·{" "}
                            {asm.totalMarks} marks
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button
                            onClick={() => handlePreviewAssessment(asm.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-medium rounded-md transition-all cursor-pointer"
                            title="Preview questions and correct options"
                          >
                            <EyeOpenIcon className="w-3.5 h-3.5 text-zinc-600" />
                            Preview
                          </button>
                          {!asm.isPublished && (
                            <button
                              onClick={() => handleLaunchAssessment(asm.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer whitespace-nowrap"
                            >
                              <RocketIcon className="w-3.5 h-3.5" />
                              Launch
                            </button>
                          )}
                          <button
                            onClick={() =>
                              router.push(
                                `/teacher/assessments/${asm.id}/results`,
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all shadow-sm whitespace-nowrap cursor-pointer"
                          >
                            Results
                            <ChevronRightIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmAsm(asm)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-red-50/50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-md transition-all cursor-pointer"
                            title="Delete assessment"
                          >
                            <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                TAB: STUDENTS
            ══════════════════════════════════════════ */}
            {activeTab === "students" && (
              <div className="space-y-4">
                {/* Student History Drawer with smooth entrance animation */}
                {selectedStudentId && selectedStudent && (
                  <div className="bg-white border-2 border-[#5451FF] rounded-xl p-6 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 transform transition-all">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedStudentId(null)}
                          className="p-1.5 hover:bg-zinc-100 rounded-md transition-all cursor-pointer"
                        >
                          <ArrowLeftIcon className="w-4 h-4 text-zinc-600" />
                        </button>
                        <div className="w-9 h-9 bg-[#5451FF] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {selectedStudent.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-normal text-[#111111]">
                            {selectedStudent.name}
                          </h3>
                          <p className="text-xs text-zinc-500">
                            {selectedStudent.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedStudentId(null)}
                        className="p-1.5 hover:bg-zinc-100 rounded-md transition-all cursor-pointer"
                      >
                        <Cross2Icon className="w-4 h-4 text-zinc-600" />
                      </button>
                    </div>

                    {/* Student Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[#F4F4F6] rounded-lg p-3 text-center">
                        <p className="text-[10px] font-mono text-zinc-400 uppercase">
                          Avg Score
                        </p>
                        <p
                          className={`text-2xl font-bold font-mono mt-1 ${selectedStudent.averageScore >= 70 ? "text-emerald-600" : selectedStudent.averageScore >= 50 ? "text-blue-600" : "text-red-600"}`}
                        >
                          {selectedStudent.averageScore}%
                        </p>
                      </div>
                      <div className="bg-[#F4F4F6] rounded-lg p-3 text-center">
                        <p className="text-[10px] font-mono text-zinc-400 uppercase">
                          Attempts
                        </p>
                        <p className="text-2xl font-bold font-mono mt-1 text-[#111111]">
                          {selectedStudent.assessmentsAttempted}
                        </p>
                      </div>
                      <div className="bg-[#F4F4F6] rounded-lg p-3 text-center">
                        <p className="text-[10px] font-mono text-zinc-400 uppercase">
                          Weak Topics
                        </p>
                        <p className="text-2xl font-bold font-mono mt-1 text-red-600">
                          {selectedStudent.weakTopics.length}
                        </p>
                      </div>
                    </div>

                    {/* Weak Topics */}
                    {selectedStudent.weakTopics.length > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1.5">
                          <CrossCircledIcon className="w-3.5 h-3.5" />
                          Weak Topics Requiring Attention
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.weakTopics.map((wt) => (
                            <span
                              key={wt.topic}
                              className="px-2.5 py-1 bg-white text-red-700 border border-red-200 text-xs font-mono rounded-md"
                            >
                              {wt.topic} · {wt.masteryScore}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assessment History */}
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">
                        Assessment History
                      </h4>
                      {historyLoading ? (
                        <div className="flex items-center gap-2 py-4 text-xs text-zinc-400">
                          <div className="w-4 h-4 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
                          Loading history...
                        </div>
                      ) : studentHistory.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic">
                          No assessment history yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {studentHistory.map((h) => (
                            <div
                              key={h.attemptId}
                              className="p-4 bg-[#F4F4F6] rounded-lg flex items-center justify-between gap-4"
                            >
                              <div className="space-y-0.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <TypeBadge type={h.assessmentType} />
                                  <span className="text-[10px] font-mono text-zinc-400">
                                    {h.className}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-[#111111] truncate">
                                  {h.assessmentTitle}
                                </p>
                                <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                                  <span className="flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    {new Date(h.submittedAt).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )}
                                  </span>
                                  <span>
                                    {h.totalScore}/{h.maxScore} marks
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <ScoreBadge pct={h.percentage} />
                                <p className="text-[10px] font-mono text-zinc-400 mt-1">
                                  {h.percentage >= 50 ? "Passed" : "Failed"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Search */}
                <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search students by name or email..."
                      className="w-full pl-9 pr-4 py-2.5 bg-[#F4F4F6] border border-transparent rounded-md text-sm text-[#111111] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#111111] transition-all"
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-400 whitespace-nowrap">
                    {filteredStudents.length} students
                  </span>
                </div>

                {/* Student Table */}
                <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-100 bg-[#F9F9FB]">
                          <th className="text-left px-5 py-3.5 text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="text-left px-5 py-3.5 text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="text-left px-5 py-3.5 text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                            Avg Score
                          </th>
                          <th className="text-left px-5 py-3.5 text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                            Attempts
                          </th>
                          <th className="text-left px-5 py-3.5 text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                            Weak Topics
                          </th>
                          <th className="text-left px-5 py-3.5 text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-right px-5 py-3.5 text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                            History
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredStudents.map((s) => (
                          <tr
                            key={s.studentId}
                            className={`hover:bg-[#F4F4F6] transition-colors ${selectedStudentId === s.studentId ? "bg-[#F4F4F6]" : ""}`}
                          >
                            <td className="px-5 py-4">
                              <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono ${s.rank === 1 ? "bg-amber-100 text-amber-700" : s.rank === 2 ? "bg-zinc-200 text-zinc-700" : s.rank === 3 ? "bg-orange-100 text-orange-700" : "bg-zinc-100 text-zinc-500"}`}
                              >
                                {s.rank}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#5451FF]/10 border border-[#5451FF]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#5451FF]">
                                  {s.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-[#111111]">
                                    {s.name}
                                  </p>
                                  <p className="text-[11px] font-mono text-zinc-400">
                                    {s.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <ScoreBadge pct={s.averageScore} />
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-mono text-zinc-600">
                                {s.assessmentsAttempted}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {s.weakTopics.length === 0 ? (
                                <span className="text-[11px] font-mono text-zinc-400">
                                  —
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {s.weakTopics.map((wt) => (
                                    <span
                                      key={wt.topic}
                                      className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-mono rounded border border-red-200"
                                    >
                                      {wt.topic}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {s.averageScore >= 70 ? (
                                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-mono">
                                  <CheckCircledIcon className="w-3.5 h-3.5" />{" "}
                                  On Track
                                </span>
                              ) : s.averageScore >= 50 ? (
                                <span className="flex items-center gap-1 text-[11px] text-blue-600 font-mono">
                                  Average
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] text-red-600 font-mono">
                                  <CrossCircledIcon className="w-3.5 h-3.5" />{" "}
                                  At Risk
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => openStudentHistory(s.studentId)}
                                className="flex items-center gap-1 ml-auto px-3 py-1.5 text-xs font-medium text-[#111111] border border-zinc-200 rounded-md hover:bg-zinc-100 transition-all cursor-pointer"
                              >
                                History
                                <ChevronDownIcon className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                TAB: TOPIC ANALYSIS
            ══════════════════════════════════════════ */}
            {activeTab === "topics" && (
              <div className="space-y-4">
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-zinc-100 pb-3">
                    <TargetIcon className="w-4 h-4 text-[#111111]" />
                    <h3 className="font-serif text-xl font-normal text-[#111111]">
                      Class-wide Topic Mastery
                    </h3>
                  </div>
                  <div className="space-y-5">
                    {topics.map((t) => (
                      <div key={t.topic} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-[#111111] w-48">
                              {t.topic}
                            </span>
                            <span className="text-zinc-400 font-mono">
                              {t.studentsTracked} students tracked
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono rounded border border-emerald-200">
                              {t.masteredStudentsCount} mastered
                            </span>
                            {t.weakStudentsCount > 0 && (
                              <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-mono rounded border border-red-200">
                                {t.weakStudentsCount} weak
                              </span>
                            )}
                            <span className="font-mono font-bold text-[#111111] text-sm w-12 text-right">
                              {Math.round(t.averageMastery)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-700 ${t.averageMastery >= 70 ? "bg-emerald-500" : t.averageMastery >= 50 ? "bg-blue-500" : "bg-red-400"}`}
                            style={{
                              width: `${Math.min(100, t.averageMastery)}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400 pt-0.5">
                          <span>
                            Class avg: {Math.round(t.averageMastery)}%
                          </span>
                          <span>·</span>
                          <span>
                            {t.masteredStudentsCount}/{t.studentsTracked}{" "}
                            mastered
                          </span>
                          <span>·</span>
                          <span
                            className={
                              t.weakStudentsCount > 0
                                ? "text-red-500"
                                : "text-zinc-400"
                            }
                          >
                            {t.weakStudentsCount} need support
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Topic → Students breakdown */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-5 border-b border-zinc-100 pb-3">
                    <CrossCircledIcon className="w-4 h-4 text-red-500" />
                    <h3 className="font-serif text-xl font-normal text-[#111111]">
                      Students Needing Topic Support
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {topics
                      .filter((t) => t.weakStudentsCount > 0)
                      .map((t) => (
                        <div
                          key={t.topic}
                          className="p-4 bg-[#F4F4F6] rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-[#111111]">
                              {t.topic}
                            </span>
                            <span className="text-xs font-mono text-red-600">
                              {t.weakStudentsCount} student
                              {t.weakStudentsCount !== 1 ? "s" : ""} weak
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {students
                              .filter((s) =>
                                s.weakTopics.some((wt) => wt.topic === t.topic),
                              )
                              .map((s) => {
                                const wt = s.weakTopics.find(
                                  (w) => w.topic === t.topic,
                                );
                                return (
                                  <span
                                    key={s.studentId}
                                    className="px-2.5 py-1 bg-white text-zinc-700 border border-zinc-200 text-xs font-mono rounded-md"
                                  >
                                    {s.name} · {wt?.masteryScore}%
                                  </span>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                TAB: ASSESSMENTS
            ══════════════════════════════════════════ */}
            {activeTab === "assessments" && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <h3 className="font-serif text-xl font-normal text-[#111111]">
                      All Assessments ({assessments.length})
                    </h3>
                    <SlidingTabs<"ALL" | "PUBLISHED" | "DRAFT">
                      tabs={[
                        { id: "ALL", label: "All" },
                        { id: "PUBLISHED", label: "Published" },
                        { id: "DRAFT", label: "Drafts" },
                      ]}
                      activeId={assessmentFilter}
                      onChange={setAssessmentFilter}
                      size="sm"
                    />
                  </div>

                  <button
                    onClick={() => router.push("/teacher/assessments/new")}
                    className="flex items-center gap-2 px-4 py-2 bg-[#5451FF] hover:bg-[#4340e0] text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer"
                  >
                    <PlusCircledIcon className="w-3.5 h-3.5" />
                    New Assessment
                  </button>
                </div>

                <div className="space-y-3">
                  {assessments
                    .filter((asm) => {
                      if (assessmentFilter === "PUBLISHED")
                        return asm.isPublished;
                      if (assessmentFilter === "DRAFT") return !asm.isPublished;
                      return true;
                    })
                    .map((asm) => (
                      <div
                        key={asm.id}
                        className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                                {asm.className}
                              </span>
                              <TypeBadge type={String(asm.assessmentType)} />
                              {!asm.isPublished && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-mono rounded border border-amber-200">
                                  DRAFT
                                </span>
                              )}
                              {asm.isPublished && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono rounded border border-emerald-200">
                                  PUBLISHED
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-semibold text-[#111111] truncate">
                              {asm.title}
                            </h4>
                            <p className="text-xs text-zinc-400 line-clamp-1">
                              {asm.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 flex-wrap pt-0.5">
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {asm.durationMinutes} mins
                              </span>
                              <span>
                                {asm.totalMarks} marks · Pass {asm.passingMarks}
                              </span>
                              <span>
                                {asm._count?.questions || 0} questions
                              </span>
                              <span className="font-semibold text-[#111111]">
                                {asm._count?.attempts || 0} student attempts
                              </span>
                              {asm.hasNegativeMarking && (
                                <span className="text-red-500">
                                  -{asm.negativeMarkValue} marking
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              onClick={() => handlePreviewAssessment(asm.id)}
                              className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-medium rounded-md transition-all cursor-pointer"
                              title="Preview questions and correct options"
                            >
                              <EyeOpenIcon className="w-3.5 h-3.5 text-zinc-600" />
                              Preview
                            </button>
                            {!asm.isPublished && (
                              <button
                                onClick={() => handleLaunchAssessment(asm.id)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer whitespace-nowrap"
                              >
                                <RocketIcon className="w-3.5 h-3.5" />
                                Launch Assessment
                              </button>
                            )}
                            <button
                              onClick={() =>
                                router.push(
                                  `/teacher/assessments/${asm.id}/results`,
                                )
                              }
                              className="flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all shadow-sm cursor-pointer"
                            >
                              <BarChartIcon className="w-3.5 h-3.5" />
                              Results
                            </button>
                            <button
                              onClick={() => setDeleteConfirmAsm(asm)}
                              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 bg-red-50/50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-md transition-all cursor-pointer"
                              title="Delete assessment"
                            >
                              <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmAsm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <TrashIcon className="w-5 h-5" />
              </div>
              <button
                onClick={() => setDeleteConfirmAsm(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md transition-all cursor-pointer"
              >
                <Cross2Icon className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#111111]">
                Delete Assessment?
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-zinc-800">
                  "{deleteConfirmAsm.title}"
                </span>
                ? This will permanently remove the assessment, all associated
                questions, and student attempts. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmAsm(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAssessment(deleteConfirmAsm.id)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Delete Assessment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assessment Preview & Edit Modal ── */}
      {previewAsmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-4xl w-full shadow-2xl my-auto overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-[#111111] text-white text-[10px] font-mono font-bold rounded">
                    {editedAsmData?.className || "Assessment"}
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-mono font-semibold rounded border border-blue-200">
                    {editedAsmData?.assessmentType || "QUIZ"}
                  </span>
                  {editedAsmData?.isPublished ? (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono rounded border border-emerald-200 font-bold">
                      PUBLISHED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-mono rounded border border-amber-200 font-bold">
                      DRAFT
                    </span>
                  )}
                  {isEditingPreview ? (
                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-mono font-bold rounded animate-pulse">
                      EDIT MODE
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-zinc-200 text-zinc-700 text-[10px] font-mono font-bold rounded">
                      PREVIEW MODE
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Auto-detected Save Button */}
                {isDirty && (
                  <button
                    onClick={handleSaveEditedAssessment}
                    disabled={isSavingPreview}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                  >
                    <CheckCircledIcon className="w-4 h-4" />
                    {isSavingPreview ? "Saving..." : "Save Changes"}
                  </button>
                )}

                <button
                  onClick={() => setIsEditingPreview(!isEditingPreview)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    isEditingPreview
                      ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  <Pencil1Icon className="w-3.5 h-3.5" />
                  {isEditingPreview ? "Exit Edit Mode" : "Edit Assessment"}
                </button>

                <button
                  onClick={() => {
                    setPreviewAsmId(null);
                    setPreviewAsmData(null);
                    setEditedAsmData(null);
                    setIsEditingPreview(false);
                    setIsDirty(false);
                  }}
                  className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 transition-all cursor-pointer"
                >
                  <Cross2Icon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {previewLoading ? (
                <div className="py-12 text-center text-zinc-400 text-xs font-mono">
                  Loading assessment questions & details...
                </div>
              ) : !editedAsmData ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No details found for this assessment.
                </div>
              ) : isEditingPreview ? (
                /* ── EDIT MODE FORM ── */
                <div className="space-y-6">
                  {/* General Settings Section */}
                  <div className="bg-zinc-50/80 border border-zinc-200 rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-700 flex items-center gap-2">
                      <Pencil1Icon className="w-4 h-4 text-purple-600" />
                      General Assessment Settings
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="space-y-1">
                        <label className="font-semibold text-zinc-700 block">
                          Assessment Title
                        </label>
                        <input
                          type="text"
                          value={editedAsmData.title || ""}
                          onChange={(e) =>
                            updateGeneralSetting("title", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-zinc-700 block">
                          Class Name
                        </label>
                        <input
                          type="text"
                          value={editedAsmData.className || ""}
                          onChange={(e) =>
                            updateGeneralSetting("className", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-zinc-700 block">
                          Topic / Category
                        </label>
                        <input
                          type="text"
                          value={editedAsmData.topic || ""}
                          onChange={(e) =>
                            updateGeneralSetting("topic", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-zinc-700 block">
                          Assessment Type
                        </label>
                        <select
                          value={editedAsmData.assessmentType || "QUIZ"}
                          onChange={(e) =>
                            updateGeneralSetting(
                              "assessmentType",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="QUIZ">QUIZ</option>
                          <option value="EXAM">EXAM</option>
                          <option value="PRACTICE">PRACTICE</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-zinc-700 block">
                          Duration (Minutes)
                        </label>
                        <input
                          type="number"
                          value={editedAsmData.durationMinutes || 15}
                          onChange={(e) =>
                            updateGeneralSetting(
                              "durationMinutes",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-zinc-700 block">
                          Total Marks
                        </label>
                        <input
                          type="number"
                          value={editedAsmData.totalMarks || 100}
                          onChange={(e) =>
                            updateGeneralSetting(
                              "totalMarks",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-zinc-700 block">
                          Passing Marks
                        </label>
                        <input
                          type="number"
                          value={editedAsmData.passingMarks || 40}
                          onChange={(e) =>
                            updateGeneralSetting(
                              "passingMarks",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-zinc-700 block">
                          Negative Marking
                        </label>
                        <div className="flex items-center gap-3 pt-1">
                          <label className="flex items-center gap-1.5 text-xs text-zinc-700 font-medium">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                editedAsmData.hasNegativeMarking,
                              )}
                              onChange={(e) =>
                                updateGeneralSetting(
                                  "hasNegativeMarking",
                                  e.target.checked,
                                )
                              }
                              className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                            />
                            Enable
                          </label>
                          {editedAsmData.hasNegativeMarking && (
                            <input
                              type="number"
                              step="0.25"
                              value={editedAsmData.negativeMarkValue || 0.25}
                              onChange={(e) =>
                                updateGeneralSetting(
                                  "negativeMarkValue",
                                  Number(e.target.value),
                                )
                              }
                              placeholder="Deduction per wrong ans"
                              className="w-32 px-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="font-semibold text-zinc-700 block">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={editedAsmData.description || ""}
                        onChange={(e) =>
                          updateGeneralSetting("description", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Workbook options */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2 text-xs">
                      <label className="flex items-center gap-2 font-bold text-amber-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editedAsmData.isWorkbook)}
                          onChange={(e) =>
                            updateGeneralSetting("isWorkbook", e.target.checked)
                          }
                          className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        Workbook Assessment (Physical Solution Submission)
                      </label>
                      {editedAsmData.isWorkbook && (
                        <input
                          type="url"
                          value={editedAsmData.workbookUrl || ""}
                          onChange={(e) =>
                            updateGeneralSetting("workbookUrl", e.target.value)
                          }
                          placeholder="Teacher's Workbook File / PDF URL (e.g. https://...)"
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      )}
                    </div>
                  </div>

                  {/* Questions List Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-700">
                        Edit Questions & Answers (
                        {(editedAsmData.questions || []).length})
                      </h4>
                      <button
                        onClick={addNewQuestion}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Add Question
                      </button>
                    </div>

                    {(editedAsmData.questions || []).map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-4 relative"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center font-mono">
                              {qIdx + 1}
                            </span>
                            <select
                              value={q.questionType || "SINGLE_CHOICE"}
                              onChange={(e) =>
                                updateQuestionField(
                                  qIdx,
                                  "questionType",
                                  e.target.value,
                                )
                              }
                              className="px-2 py-1 bg-zinc-100 border border-zinc-300 rounded text-xs font-mono font-semibold text-zinc-700 focus:outline-none"
                            >
                              <option value="SINGLE_CHOICE">
                                Single Choice (MCQ)
                              </option>
                              <option value="MULTIPLE_CHOICE">
                                Multiple Choice
                              </option>
                              <option value="TRUE_FALSE">True / False</option>
                              <option value="SHORT_ANSWER">Short Answer</option>
                              <option value="CODING">Coding</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs font-mono text-zinc-600">
                              <span>Points:</span>
                              <input
                                type="number"
                                value={q.points || 1}
                                onChange={(e) =>
                                  updateQuestionField(
                                    qIdx,
                                    "points",
                                    Number(e.target.value),
                                  )
                                }
                                className="w-16 px-2 py-1 border border-zinc-300 rounded text-xs text-center font-bold focus:outline-none"
                              />
                            </div>
                            <button
                              onClick={() => removeQuestion(qIdx)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                              title="Delete Question"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-mono uppercase text-zinc-500 font-semibold block">
                            Question Statement
                          </label>
                          <textarea
                            rows={2}
                            value={q.questionText || ""}
                            onChange={(e) =>
                              updateQuestionField(
                                qIdx,
                                "questionText",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Options Editor for MCQ / Single Choice */}
                        {(q.questionType === "SINGLE_CHOICE" ||
                          q.questionType === "MULTIPLE_CHOICE") && (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono uppercase text-zinc-500 font-semibold">
                                Options & Correct Answer Check
                              </span>
                              <button
                                onClick={() => addOptionToQuestion(qIdx)}
                                className="text-[11px] font-mono text-purple-600 font-bold hover:underline cursor-pointer"
                              >
                                + Add Option
                              </button>
                            </div>

                            {(q.options || []).map((opt, oIdx) => (
                              <div
                                key={opt.id || oIdx}
                                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                  opt.isCorrect
                                    ? "bg-emerald-50 border-emerald-300"
                                    : "bg-zinc-50 border-zinc-200"
                                }`}
                              >
                                <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                                  <input
                                    type={
                                      q.questionType === "SINGLE_CHOICE"
                                        ? "radio"
                                        : "checkbox"
                                    }
                                    name={`correct-${qIdx}`}
                                    checked={Boolean(opt.isCorrect)}
                                    onChange={(e) =>
                                      updateOptionField(
                                        qIdx,
                                        oIdx,
                                        "isCorrect",
                                        e.target.checked,
                                      )
                                    }
                                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <span className="font-mono text-xs font-bold text-zinc-400">
                                    {String.fromCharCode(65 + oIdx)}.
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  value={opt.optionText || ""}
                                  onChange={(e) =>
                                    updateOptionField(
                                      qIdx,
                                      oIdx,
                                      "optionText",
                                      e.target.value,
                                    )
                                  }
                                  className="flex-1 px-3 py-1.5 bg-white border border-zinc-300 rounded text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                                {(q.options || []).length > 2 && (
                                  <button
                                    onClick={() =>
                                      removeOptionFromQuestion(qIdx, oIdx)
                                    }
                                    className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer"
                                  >
                                    <Cross2Icon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* True / False Editor */}
                        {q.questionType === "TRUE_FALSE" && (
                          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
                            <span className="text-xs font-semibold text-zinc-700 block">
                              Select Correct Answer:
                            </span>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2 text-xs font-bold text-emerald-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`tf-${qIdx}`}
                                  checked={q.trueFalseAnswer === true}
                                  onChange={() =>
                                    updateQuestionField(
                                      qIdx,
                                      "trueFalseAnswer",
                                      true,
                                    )
                                  }
                                  className="text-emerald-600 focus:ring-emerald-500"
                                />
                                TRUE
                              </label>
                              <label className="flex items-center gap-2 text-xs font-bold text-red-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`tf-${qIdx}`}
                                  checked={q.trueFalseAnswer === false}
                                  onChange={() =>
                                    updateQuestionField(
                                      qIdx,
                                      "trueFalseAnswer",
                                      false,
                                    )
                                  }
                                  className="text-red-600 focus:ring-red-500"
                                />
                                FALSE
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Short Answer Keywords */}
                        {q.questionType === "SHORT_ANSWER" && (
                          <div className="space-y-1">
                            <label className="text-[11px] font-mono uppercase text-zinc-500 font-semibold block">
                              Accepted Keywords (Comma Separated)
                            </label>
                            <input
                              type="text"
                              value={
                                Array.isArray(q.shortAnswerKeywords)
                                  ? q.shortAnswerKeywords.join(", ")
                                  : q.shortAnswerKeywords || ""
                              }
                              onChange={(e) =>
                                updateQuestionField(
                                  qIdx,
                                  "shortAnswerKeywords",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g. recursion, divide and conquer"
                              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        )}

                        {/* Explanation */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-mono uppercase text-zinc-500 font-semibold block">
                            Answer Explanation / Solution Hint
                          </label>
                          <textarea
                            rows={2}
                            value={q.explanation || ""}
                            onChange={(e) =>
                              updateQuestionField(
                                qIdx,
                                "explanation",
                                e.target.value,
                              )
                            }
                            placeholder="Optional explanation visible after student completes test..."
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* ── READ-ONLY PREVIEW MODE ── */
                <div className="space-y-6">
                  {/* Summary bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-200/80 text-xs font-mono text-zinc-600">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">
                        DURATION
                      </span>
                      <span className="font-bold text-[#111111]">
                        {previewAsmData.durationMinutes} mins
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">
                        TOTAL MARKS
                      </span>
                      <span className="font-bold text-[#111111]">
                        {previewAsmData.totalMarks} Marks
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">
                        PASSING MARKS
                      </span>
                      <span className="font-bold text-[#111111]">
                        {previewAsmData.passingMarks} Marks
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">
                        QUESTIONS
                      </span>
                      <span className="font-bold text-[#111111]">
                        {(previewAsmData.questions || []).length} Questions
                      </span>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-400">
                      Questions & Correct Options (
                      {(previewAsmData.questions || []).length})
                    </h4>
                    {(previewAsmData.questions || []).map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#5451FF]/10 text-[#5451FF] font-bold text-xs flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded">
                              {q.questionType}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
                            {q.points || 1} mark
                            {(q.points || 1) !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-[#111111] whitespace-pre-wrap leading-relaxed">
                          {q.questionText}
                        </p>

                        {/* Options */}
                        {q.options && q.options.length > 0 && (
                          <div className="space-y-2 pt-1">
                            {q.options.map((opt, optIdx) => (
                              <div
                                key={opt.id || optIdx}
                                className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
                                  opt.isCorrect
                                    ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium"
                                    : "bg-zinc-50/50 border-zinc-200 text-zinc-700"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="font-mono text-zinc-400 font-semibold">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  {opt.optionText}
                                </span>
                                {opt.isCorrect && (
                                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                                    <CheckCircledIcon className="w-3 h-3 text-emerald-600" />
                                    CORRECT OPTION
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* True / False */}
                        {q.questionType === "TRUE_FALSE" &&
                          q.trueFalseAnswer !== undefined && (
                            <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-lg text-xs flex items-center justify-between text-emerald-950">
                              <span>
                                Correct Answer:{" "}
                                <strong className="font-mono">
                                  {q.trueFalseAnswer ? "TRUE" : "FALSE"}
                                </strong>
                              </span>
                              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                                CORRECT
                              </span>
                            </div>
                          )}

                        {/* Short Answer keywords */}
                        {q.questionType === "SHORT_ANSWER" &&
                          q.shortAnswerKeywords &&
                          q.shortAnswerKeywords.length > 0 && (
                            <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-lg text-xs text-emerald-950 space-y-1">
                              <span className="font-semibold block text-[10px] text-emerald-800">
                                ACCEPTED KEYWORDS:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {(Array.isArray(q.shortAnswerKeywords)
                                  ? q.shortAnswerKeywords
                                  : []
                                ).map((kw, kwIdx) => (
                                  <span
                                    key={kwIdx}
                                    className="px-2 py-0.5 bg-emerald-200/60 text-emerald-900 rounded font-mono text-[11px]"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-blue-900 mt-2">
                            <span className="font-bold text-[10px] uppercase text-blue-700 block mb-0.5">
                              EXPLANATION:
                            </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-mono">
                  {isEditingPreview ? "Editing" : "Previewing"}{" "}
                  {editedAsmData?.title || previewAsmData?.title}
                </span>
                {isDirty && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-mono font-bold rounded">
                    UNSAVED CHANGES
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {isDirty && (
                  <button
                    onClick={handleSaveEditedAssessment}
                    disabled={isSavingPreview}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    {isSavingPreview ? "Saving..." : "Save Changes"}
                  </button>
                )}
                <button
                  onClick={() => {
                    setPreviewAsmId(null);
                    setPreviewAsmData(null);
                    setEditedAsmData(null);
                    setIsEditingPreview(false);
                    setIsDirty(false);
                  }}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm"
                >
                  Close Modal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
