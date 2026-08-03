'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import {
  StudentTopicMasteryDTO,
  StudentOverviewDTO,
  StudentPerformanceDTO,
  ClassTopicDTO,
  ClassStudentRankingDTO,
} from '@/types';
import {
  ArrowLeftIcon,
  TargetIcon,
  BarChartIcon,
  ReaderIcon,
  PersonIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  LightningBoltIcon,
  ClockIcon,
  TriangleUpIcon,
} from '@radix-ui/react-icons';

// Demo data for when backend is offline
const DEMO_TOPICS: StudentTopicMasteryDTO[] = [
  { topic: 'Arrays', masteryScore: 82, accuracy: 82, totalAttempts: 10, correctAnswers: 8, assessmentCount: 3, lastPracticedAt: '', status: 'Mastered', isWeak: false },
  { topic: 'Loops', masteryScore: 64, accuracy: 64, totalAttempts: 8, correctAnswers: 5, assessmentCount: 2, lastPracticedAt: '', status: 'Proficient', isWeak: false },
  { topic: 'Recursion', masteryScore: 31, accuracy: 31, totalAttempts: 6, correctAnswers: 2, assessmentCount: 2, lastPracticedAt: '', status: 'Needs Improvement', isWeak: true },
  { topic: 'Sorting Algorithms', masteryScore: 75, accuracy: 75, totalAttempts: 4, correctAnswers: 3, assessmentCount: 2, lastPracticedAt: '', status: 'Proficient', isWeak: false },
  { topic: 'Graphs', masteryScore: 20, accuracy: 20, totalAttempts: 3, correctAnswers: 0, assessmentCount: 1, lastPracticedAt: '', status: 'Needs Improvement', isWeak: true },
  { topic: 'Dynamic Programming', masteryScore: 15, accuracy: 15, totalAttempts: 2, correctAnswers: 0, assessmentCount: 1, lastPracticedAt: '', status: 'Needs Improvement', isWeak: true },
  { topic: 'Data Structures', masteryScore: 90, accuracy: 90, totalAttempts: 12, correctAnswers: 11, assessmentCount: 4, lastPracticedAt: '', status: 'Mastered', isWeak: false },
];

const DEMO_OVERVIEW: StudentOverviewDTO = {
  studentId: 'demo',
  totalXp: 1250,
  currentStreak: 5,
  maxStreak: 12,
  gradeLevel: '1st Sem',
  totalAssessmentsAttempted: 8,
  averageScorePercentage: 67,
  weakTopicsCount: 3,
  masteredTopicsCount: 2,
  totalTopicsTracked: 7,
};

const DEMO_PERFORMANCE: StudentPerformanceDTO[] = [
  { attemptId: '1', assessmentTitle: 'Arrays Quiz', className: 'Class 10-A', topic: 'Arrays', assessmentType: 'QUIZ', totalScore: 18, maxScore: 25, percentage: 72, submittedAt: '', startedAt: '' },
  { attemptId: '2', assessmentTitle: 'Loops & Iteration', className: 'Class 10-A', topic: 'Loops', assessmentType: 'QUIZ', totalScore: 22, maxScore: 25, percentage: 88, submittedAt: '', startedAt: '' },
  { attemptId: '3', assessmentTitle: 'Recursion Fundamentals', className: 'Class 10-A', topic: 'Recursion', assessmentType: 'EXAM', totalScore: 10, maxScore: 30, percentage: 33, submittedAt: '', startedAt: '' },
  { attemptId: '4', assessmentTitle: 'Algorithm Complexity', className: 'Class 10-A', topic: 'Sorting', assessmentType: 'QUIZ', totalScore: 20, maxScore: 25, percentage: 80, submittedAt: '', startedAt: '' },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<StudentOverviewDTO>(DEMO_OVERVIEW);
  const [topics, setTopics] = useState<StudentTopicMasteryDTO[]>(DEMO_TOPICS);
  const [performance, setPerformance] = useState<StudentPerformanceDTO[]>(DEMO_PERFORMANCE);
  const [classTopics, setClassTopics] = useState<ClassTopicDTO[]>([]);
  const [classStudents, setClassStudents] = useState<ClassStudentRankingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'student' | 'class'>('student');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [overviewRes, topicsRes, perfRes] = await Promise.allSettled([
          apiFetch<StudentOverviewDTO>('/analytics/student/me'),
          apiFetch<StudentTopicMasteryDTO[]>('/analytics/student/topics'),
          apiFetch<StudentPerformanceDTO[]>('/analytics/student/performance'),
        ]);
        if (overviewRes.status === 'fulfilled' && overviewRes.value) setOverview(overviewRes.value);
        if (topicsRes.status === 'fulfilled' && topicsRes.value?.length > 0) setTopics(topicsRes.value);
        if (perfRes.status === 'fulfilled' && perfRes.value?.length > 0) setPerformance(perfRes.value);

        if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
          const [classTopicsRes, classStudentsRes] = await Promise.allSettled([
            apiFetch<ClassTopicDTO[]>('/analytics/classes/Class 10-A/topics'),
            apiFetch<ClassStudentRankingDTO[]>('/analytics/classes/Class 10-A/students'),
          ]);
          if (classTopicsRes.status === 'fulfilled' && classTopicsRes.value) setClassTopics(classTopicsRes.value);
          if (classStudentsRes.status === 'fulfilled' && classStudentsRes.value) setClassStudents(classStudentsRes.value);
        }
      } catch {}
      finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [user]);

  const getMasteryColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-600';
    if (score >= 50) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  const getMasteryBadge = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (score >= 50) return 'bg-blue-100 text-blue-800 border border-blue-200';
    return 'bg-amber-100 text-amber-800 border border-amber-200';
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-700';
    if (pct >= 50) return 'text-blue-700';
    return 'text-red-600';
  };

  const weakTopics = topics.filter((t) => t.isWeak).sort((a, b) => a.masteryScore - b.masteryScore);

  return (
    <div className="min-h-screen bg-[#F9F9FB] text-[#111111] font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-zinc-200 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 text-xs text-zinc-600 rounded-md hover:bg-zinc-100"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" /> Dashboard
            </button>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Analytics Engine</span>
              <h1 className="font-serif text-3xl font-normal text-[#111111] mt-0.5">Academic Performance Report</h1>
            </div>
          </div>

          {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
            <div className="flex items-center bg-zinc-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('student')}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'student' ? 'bg-white text-[#111111] shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                My Stats
              </button>
              <button
                onClick={() => setActiveTab('class')}
                className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeTab === 'class' ? 'bg-white text-[#111111] shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                Class View
              </button>
            </div>
          )}
        </header>

        {/* ── STUDENT VIEW ── */}
        {activeTab === 'student' && (
          <>
            {/* Overview Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total XP', value: overview.totalXp.toLocaleString(), icon: <LightningBoltIcon className="w-4 h-4" /> },
                { label: 'Streak', value: `${overview.currentStreak} days`, icon: <ClockIcon className="w-4 h-4" /> },
                { label: 'Avg Score', value: `${overview.averageScorePercentage}%`, icon: <BarChartIcon className="w-4 h-4" /> },
                { label: 'Mastered', value: `${overview.masteredTopicsCount} topics`, icon: <CheckCircledIcon className="w-4 h-4" /> },
                { label: 'Need Focus', value: `${overview.weakTopicsCount} topics`, icon: <CrossCircledIcon className="w-4 h-4" /> },
              ].map((stat) => (
                <div key={stat.label} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-zinc-500">{stat.icon}<span className="text-[10px] font-mono uppercase tracking-wider">{stat.label}</span></div>
                  <p className="font-serif text-2xl text-[#111111]">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Weak Topics Alert */}
            {weakTopics.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CrossCircledIcon className="w-4 h-4 text-amber-700" />
                  <h3 className="font-semibold text-sm text-amber-900">Topics Requiring Immediate Focus</h3>
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">MASTERY &lt; 50%</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {weakTopics.map((topic) => (
                    <div key={topic.topic} className="bg-white rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#111111]">{topic.topic}</span>
                        <span className="text-xs font-mono font-bold text-amber-700">{Math.round(topic.masteryScore)}%</span>
                      </div>
                      <div className="w-full bg-amber-100 rounded-full h-1.5 mb-1.5">
                        <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${topic.masteryScore}%` }} />
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono">{topic.correctAnswers}/{topic.totalAttempts} correct</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Topic Mastery Breakdown */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                <TargetIcon className="w-4 h-4 text-[#111111]" />
                <div>
                  <h3 className="font-serif text-xl font-normal text-[#111111]">Topic Mastery Breakdown</h3>
                </div>
              </div>

              <div className="space-y-4">
                {topics.map((topic) => (
                  <div key={topic.topic}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#111111] w-40">{topic.topic}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded ${getMasteryBadge(topic.masteryScore)}`}>
                          {topic.status}
                        </span>
                      </div>
                      <span className="text-sm font-mono font-bold text-[#111111]">{Math.round(topic.masteryScore)}%</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-700 ${getMasteryColor(topic.masteryScore)}`}
                        style={{ width: `${Math.min(100, topic.masteryScore)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400 font-mono">
                      <span>{topic.correctAnswers}/{topic.totalAttempts} correct · {topic.assessmentCount} assessment{topic.assessmentCount !== 1 ? 's' : ''}</span>
                      <span>Accuracy: {Math.round(topic.accuracy)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Trend Table */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                <BarChartIcon className="w-4 h-4 text-[#111111]" />
                <div>
                  <h3 className="font-serif text-xl font-normal text-[#111111]">Assessment Performance History</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Score trend across all evaluated attempts</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="text-left py-2 font-mono text-zinc-400 uppercase tracking-wider font-semibold">Assessment</th>
                      <th className="text-left py-2 font-mono text-zinc-400 uppercase tracking-wider font-semibold">Topic</th>
                      <th className="text-left py-2 font-mono text-zinc-400 uppercase tracking-wider font-semibold">Type</th>
                      <th className="text-right py-2 font-mono text-zinc-400 uppercase tracking-wider font-semibold">Score</th>
                      <th className="text-right py-2 font-mono text-zinc-400 uppercase tracking-wider font-semibold">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {performance.map((p) => (
                      <tr key={p.attemptId} className="hover:bg-zinc-50">
                        <td className="py-3 font-medium text-[#111111]">{p.assessmentTitle}</td>
                        <td className="py-3 text-zinc-500 font-mono">{p.topic || '—'}</td>
                        <td className="py-3">
                          <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 font-mono rounded text-[10px]">{p.assessmentType}</span>
                        </td>
                        <td className="py-3 text-right font-mono font-semibold text-[#111111]">{p.totalScore}/{p.maxScore}</td>
                        <td className={`py-3 text-right font-mono font-bold ${getScoreColor(p.percentage)}`}>
                          <span className="flex items-center justify-end gap-0.5">
                            {p.percentage >= 50 && <TriangleUpIcon className="w-3 h-3" />}
                            {p.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── CLASS VIEW (Teacher) ── */}
        {activeTab === 'class' && (user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <>
            {/* Class Topic Breakdown */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                <BarChartIcon className="w-4 h-4 text-[#111111]" />
                <div>
                  <h3 className="font-serif text-xl font-normal text-[#111111]">Class Topic Performance</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Aggregate mastery across Class 10-A</p>
                </div>
              </div>

              {classTopics.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-6 text-center">No class data available yet. Publish assessments and have students submit attempts.</p>
              ) : (
                <div className="space-y-3">
                  {classTopics.map((topic) => (
                    <div key={topic.topic} className="flex items-center gap-4">
                      <span className="text-xs font-medium text-[#111111] w-36 shrink-0">{topic.topic}</span>
                      <div className="flex-1 bg-zinc-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${getMasteryColor(topic.averageMastery)}`} style={{ width: `${topic.averageMastery}%` }} />
                      </div>
                      <span className="text-xs font-mono font-bold text-[#111111] w-10 text-right">{topic.averageMastery}%</span>
                      <div className="flex gap-1.5">
                        <span className="text-[10px] font-mono text-red-600">{topic.weakStudentsCount} weak</span>
                        <span className="text-[10px] font-mono text-emerald-600">{topic.masteredStudentsCount} mastered</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Rankings */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                <PersonIcon className="w-4 h-4 text-[#111111]" />
                <div>
                  <h3 className="font-serif text-xl font-normal text-[#111111]">Student Mastery Rankings</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Ordered by average assessment score</p>
                </div>
              </div>

              {classStudents.length === 0 ? (
                <p className="text-xs text-zinc-400 italic py-6 text-center">No student data available yet.</p>
              ) : (
                <div className="space-y-2">
                  {classStudents.map((s) => (
                    <div key={s.studentId} className="p-4 bg-[#F4F4F6] rounded-lg flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-zinc-400 w-6">#{s.rank}</span>
                        <div>
                          <p className="text-sm font-medium text-[#111111]">{s.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{s.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="text-center">
                          <span className="text-zinc-400 block text-[10px]">AVG SCORE</span>
                          <span className={`font-bold ${getScoreColor(s.averageScore)}`}>{s.averageScore}%</span>
                        </div>
                        <div className="text-center">
                          <span className="text-zinc-400 block text-[10px]">TOTAL XP</span>
                          <span className="font-bold text-[#111111]">{s.totalXp}</span>
                        </div>
                        {s.weakTopics.length > 0 && (
                          <div className="flex gap-1">
                            {s.weakTopics.slice(0, 2).map((t) => (
                              <span key={t.topic} className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-mono rounded border border-amber-200">
                                {t.topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
