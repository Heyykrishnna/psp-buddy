"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
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
          studentsRes.status === "fulfilled" && studentsRes.value?.length > 0
            ? studentsRes.value
            : MOCK_STUDENTS,
        );
        setTopics(
          topicsRes.status === "fulfilled" && topicsRes.value?.length > 0
            ? topicsRes.value
            : MOCK_TOPICS,
        );
        setAssessments(
          assessmentsRes.status === "fulfilled" &&
            assessmentsRes.value?.length > 0
            ? assessmentsRes.value
            : MOCK_ASSESSMENTS,
        );
      } catch {
        setStudents(MOCK_STUDENTS);
        setTopics(MOCK_TOPICS);
        setAssessments(MOCK_ASSESSMENTS);
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
      setStudentHistory(
        data?.length > 0 ? data : MOCK_STUDENT_HISTORY[studentId] || [],
      );
    } catch {
      setStudentHistory(MOCK_STUDENT_HISTORY[studentId] || []);
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

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl p-1.5 shadow-sm w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#111111] text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

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
                        <button
                          onClick={() =>
                            router.push(
                              `/teacher/assessments/${asm.id}/results`,
                            )
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all shadow-sm whitespace-nowrap cursor-pointer"
                        >
                          View Results
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </button>
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
                {/* Student History Drawer */}
                {selectedStudentId && selectedStudent && (
                  <div className="bg-white border border-[#5451FF] rounded-xl p-6 shadow-md space-y-4">
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
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-normal text-[#111111]">
                    All Assessments ({assessments.length})
                  </h3>
                  <button
                    onClick={() => router.push("/teacher/assessments/new")}
                    className="flex items-center gap-2 px-4 py-2 bg-[#5451FF] hover:bg-[#4340e0] text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer"
                  >
                    <PlusCircledIcon className="w-3.5 h-3.5" />
                    New Assessment
                  </button>
                </div>

                <div className="space-y-3">
                  {assessments.map((asm) => (
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
                            <span>{asm._count?.questions || 0} questions</span>
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
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              router.push(
                                `/teacher/assessments/${asm.id}/results`,
                              )
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-md transition-all shadow-sm cursor-pointer"
                          >
                            <BarChartIcon className="w-3.5 h-3.5" />
                            Results
                          </button>
                          <button
                            onClick={() =>
                              router.push("/teacher/assessments/new")
                            }
                            className="flex items-center gap-2 px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-md transition-all cursor-pointer"
                          >
                            <RocketIcon className="w-3.5 h-3.5" />
                            Duplicate
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
    </main>
  );
}
