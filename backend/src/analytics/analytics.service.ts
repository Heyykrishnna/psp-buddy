import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '@/database';

@Injectable()
export class AnalyticsService {
  // ── Student Analytics ──────────────────────────────────────────────────────

  /**
   * GET /analytics/student/me
   * Overall student stats: XP, streak, total assessments, global accuracy
   */
  async getStudentOverview(studentId: string) {
    const student = await db.student.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] },
      include: {
        topicMasteries: {
          orderBy: { masteryScore: 'asc' },
        },
        attempts: {
          where: { status: 'EVALUATED' },
          select: { totalScore: true, maxScore: true, submittedAt: true },
          orderBy: { submittedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    const evaluatedAttempts = student.attempts;
    const totalAttempts = evaluatedAttempts.length;
    const averageScore =
      totalAttempts > 0
        ? Math.round(
            evaluatedAttempts.reduce((sum: number, a: any) => {
              const pct = a.maxScore && a.maxScore > 0 ? ((a.totalScore || 0) / a.maxScore) * 100 : 0;
              return sum + pct;
            }, 0) / totalAttempts
          )
        : 0;

    const weakTopics = student.topicMasteries.filter((t: any) => t.masteryScore < 50);
    const masteredTopics = student.topicMasteries.filter((t: any) => t.masteryScore >= 80);

    return {
      studentId: student.id,
      totalXp: student.totalXp,
      currentStreak: student.currentStreak,
      maxStreak: student.maxStreak,
      gradeLevel: student.gradeLevel,
      totalAssessmentsAttempted: totalAttempts,
      averageScorePercentage: averageScore,
      weakTopicsCount: weakTopics.length,
      masteredTopicsCount: masteredTopics.length,
      totalTopicsTracked: student.topicMasteries.length,
    };
  }

  /**
   * GET /analytics/student/topics
   * Topic-by-topic mastery breakdown (the mastery bar chart data)
   * masteryScore < 50 → Needs Improvement (WEAK)
   * 50–79 → Proficient
   * 80+ → Mastered
   */
  async getStudentTopicMastery(studentId: string) {
    const student = await db.student.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] },
    });

    if (!student) throw new NotFoundException('Student not found');

    const masteries = await db.studentTopicMastery.findMany({
      where: { studentId: student.id },
      orderBy: { masteryScore: 'desc' },
    });

    return masteries.map((m: any) => ({
      topic: m.topic,
      masteryScore: m.masteryScore,
      accuracy: m.accuracy,
      totalAttempts: m.totalAttempts,
      correctAnswers: m.correctAnswers,
      assessmentCount: m.assessmentCount,
      lastPracticedAt: m.lastPracticedAt,
      status:
        m.masteryScore >= 80
          ? 'Mastered'
          : m.masteryScore >= 50
          ? 'Proficient'
          : 'Needs Improvement',
      isWeak: m.masteryScore < 50,
    }));
  }

  /**
   * GET /analytics/student/performance
   * Assessment history with score trend
   */
  async getStudentPerformance(studentId: string) {
    const student = await db.student.findFirst({
      where: { OR: [{ id: studentId }, { userId: studentId }] },
    });

    if (!student) throw new NotFoundException('Student not found');

    const attempts = await db.assessmentAttempt.findMany({
      where: { studentId: student.id, status: 'EVALUATED' },
      include: {
        assessment: {
          select: { title: true, className: true, topic: true, assessmentType: true },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    return attempts.map((a: any) => ({
      attemptId: a.id,
      assessmentTitle: a.assessment.title,
      className: a.assessment.className,
      topic: a.assessment.topic,
      assessmentType: a.assessment.assessmentType,
      totalScore: a.totalScore || 0,
      maxScore: a.maxScore || 0,
      percentage: a.maxScore && a.maxScore > 0 ? Math.round(((a.totalScore || 0) / a.maxScore) * 100) : 0,
      submittedAt: a.submittedAt,
      startedAt: a.startedAt,
    }));
  }

  // ── Class Analytics (Teacher View) ────────────────────────────────────────

  /**
   * GET /analytics/classes/:className
   * Class-level summary: students, average score, top performers
   */
  async getClassOverview(className: string) {
    const assessments = await db.assessment.findMany({
      where: { className },
      include: {
        _count: { select: { attempts: true, questions: true } },
        attempts: {
          where: { status: 'EVALUATED' },
          select: { totalScore: true, maxScore: true, studentId: true },
        },
      },
    });

    const allAttempts = assessments.flatMap((a: any) => a.attempts);
    const totalAttempts = allAttempts.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            allAttempts.reduce((sum: number, a: any) => {
              const pct = a.maxScore && a.maxScore > 0 ? ((a.totalScore || 0) / a.maxScore) * 100 : 0;
              return sum + pct;
            }, 0) / totalAttempts
          )
        : 0;

    return {
      className,
      totalAssessments: assessments.length,
      totalAttempts,
      averageClassScore: avgScore,
      assessments: assessments.map((a: any) => ({
        id: a.id,
        title: a.title,
        topic: a.topic,
        isPublished: a.isPublished,
        questionCount: a._count.questions,
        attemptCount: a._count.attempts,
      })),
    };
  }

  /**
   * GET /analytics/classes/:className/topics
   * Aggregate topic strength across all students in a class
   */
  async getClassTopicBreakdown(className: string) {
    const assessments = await db.assessment.findMany({
      where: { className },
      include: { attempts: { where: { status: 'EVALUATED' }, select: { studentId: true } } },
    });

    const studentIds = [
      ...new Set(assessments.flatMap((a: any) => a.attempts.map((att: any) => att.studentId))),
    ] as string[];

    if (studentIds.length === 0) return [];

    const masteries = await db.studentTopicMastery.findMany({
      where: { studentId: { in: studentIds } },
    });

    // Aggregate by topic
    const topicMap: Record<string, { scores: number[]; totalStudents: number }> = {};
    for (const m of masteries) {
      if (!topicMap[m.topic]) topicMap[m.topic] = { scores: [], totalStudents: 0 };
      topicMap[m.topic].scores.push(m.masteryScore);
      topicMap[m.topic].totalStudents += 1;
    }

    return Object.entries(topicMap)
      .map(([topic, data]) => ({
        topic,
        studentsTracked: data.totalStudents,
        averageMastery: Math.round(data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length),
        weakStudentsCount: data.scores.filter((s: number) => s < 50).length,
        masteredStudentsCount: data.scores.filter((s: number) => s >= 80).length,
      }))
      .sort((a, b) => a.averageMastery - b.averageMastery);
  }

  /**
   * GET /analytics/classes/:className/students
   * Per-student mastery rankings within a class
   */
  async getClassStudentRankings(className: string) {
    const assessments = await db.assessment.findMany({
      where: { className },
      include: {
        attempts: {
          where: { status: 'EVALUATED' },
          select: { studentId: true, totalScore: true, maxScore: true },
        },
      },
    });

    const studentScoreMap: Record<string, { scores: number[]; studentId: string }> = {};
    for (const assessment of assessments) {
      for (const attempt of assessment.attempts) {
        if (!studentScoreMap[attempt.studentId]) {
          studentScoreMap[attempt.studentId] = { scores: [], studentId: attempt.studentId };
        }
        const pct = attempt.maxScore && attempt.maxScore > 0 ? ((attempt.totalScore || 0) / attempt.maxScore) * 100 : 0;
        studentScoreMap[attempt.studentId].scores.push(pct);
      }
    }

    const studentIds = Object.keys(studentScoreMap);
    if (studentIds.length === 0) return [];

    const students = await db.student.findMany({
      where: { id: { in: studentIds } },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        topicMasteries: { orderBy: { masteryScore: 'asc' }, take: 3 },
      },
    });

    const rankings = students
      .map((s: any) => {
        const scoreData = studentScoreMap[s.id];
        const avgScore =
          scoreData.scores.length > 0
            ? Math.round(scoreData.scores.reduce((a: number, b: number) => a + b, 0) / scoreData.scores.length)
            : 0;

        return {
          studentId: s.id,
          name: `${s.user.firstName} ${s.user.lastName}`,
          email: s.user.email,
          totalXp: s.totalXp,
          averageScore: avgScore,
          assessmentsAttempted: scoreData.scores.length,
          weakTopics: s.topicMasteries
            .filter((t: any) => t.masteryScore < 50)
            .map((t: any) => ({ topic: t.topic, masteryScore: t.masteryScore })),
        };
      })
      .sort((a: any, b: any) => b.averageScore - a.averageScore)
      .map((s: any, idx: number) => ({ ...s, rank: idx + 1 }));

    return rankings;
  }
}
