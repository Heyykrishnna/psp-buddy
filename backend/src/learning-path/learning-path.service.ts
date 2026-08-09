import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '@/database';
import { SyncGateway } from '../gateway/sync.gateway';
import { SyncEventType } from '@/types';

type ActivityResult = {
  assessmentId: string;
  type: 'QUIZ' | 'WORKSHEET';
  score: number;
  completed: boolean;
  source: 'ATTEMPT' | 'WORKBOOK' | 'NONE';
};

@Injectable()
export class LearningPathService {
  constructor(private readonly syncGateway: SyncGateway) {}

  private async resolveStudent(studentRef?: string) {
    const student = await db.student.findFirst({
      where: studentRef
        ? { OR: [{ id: studentRef }, { userId: studentRef }] }
        : undefined,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  private async getPathDefinition() {
    return db.learningChapter.findMany({
      where: { isPublished: true },
      include: {
        levels: {
          where: { isPublished: true },
          orderBy: { orderIndex: 'asc' },
          include: {
            activities: {
              orderBy: { orderIndex: 'asc' },
              include: {
                assessment: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    assessmentType: true,
                    totalMarks: true,
                    passingMarks: true,
                    durationMinutes: true,
                    isWorkbook: true,
                    workbookUrl: true,
                    isPublished: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  private async getActivityResults(studentId: string, assessmentIds: string[]) {
    const [attempts, workbooks] = await Promise.all([
      db.assessmentAttempt.findMany({
        where: {
          studentId,
          assessmentId: { in: assessmentIds },
          status: { in: ['SUBMITTED', 'EVALUATED'] },
        },
        include: { assessment: { select: { totalMarks: true, passingMarks: true } } },
        orderBy: { totalScore: 'desc' },
      }),
      db.workbookUpload.findMany({
        where: { studentId, assessmentId: { in: assessmentIds }, status: 'EVALUATED' },
        select: { assessmentId: true, obtainedMarks: true, maxMarks: true },
        orderBy: { obtainedMarks: 'desc' },
      }),
    ]);

    const result = new Map<string, { score: number; completed: boolean; source: 'ATTEMPT' | 'WORKBOOK' }>();

    for (const attempt of attempts) {
      const maxScore = attempt.maxScore || attempt.assessment.totalMarks || 1;
      const score = Math.max(0, Math.min(100, ((attempt.totalScore || 0) / maxScore) * 100));
      const completed = (attempt.totalScore || 0) >= attempt.assessment.passingMarks;
      const existing = result.get(attempt.assessmentId);
      if (!existing || score > existing.score) result.set(attempt.assessmentId, { score, completed, source: 'ATTEMPT' });
    }

    for (const workbook of workbooks) {
      const score = Math.max(0, Math.min(100, (workbook.obtainedMarks / (workbook.maxMarks || 1)) * 100));
      const existing = result.get(workbook.assessmentId || '');
      if (!existing || score > existing.score || existing.source !== 'WORKBOOK') {
        result.set(workbook.assessmentId || '', { score, completed: true, source: 'WORKBOOK' });
      }
    }

    return result;
  }

  private async buildStudentPath(student: any, persist = true, notify = true) {
    const chapters = await this.getPathDefinition();
    const allActivities = chapters.flatMap((chapter: any) => chapter.levels.flatMap((level: any) => level.activities));
    const resultMap = await this.getActivityResults(
      student.id,
      allActivities.map((activity: any) => activity.assessmentId),
    );

    const payload: any[] = [];
    let previousCompleted = true;
    const changed: any[] = [];

    for (const chapter of chapters) {
      const levels: any[] = [];
      for (const level of chapter.levels) {
        const activities: ActivityResult[] = level.activities.map((activity: any) => {
          const result = resultMap.get(activity.assessmentId);
          return {
            assessmentId: activity.assessmentId,
            type: activity.type,
            score: Math.round(result?.score || 0),
            completed: Boolean(result?.completed),
            source: result?.source || 'NONE',
          };
        });

        const hasProgress = activities.some((activity) => activity.score > 0);
        const allActivitiesCompleted = activities.length > 0 && activities.every((activity) => activity.completed);
        const bestPercent = activities.length
          ? Math.round(activities.reduce((sum, activity) => sum + activity.score, 0) / activities.length)
          : 0;
        const isCompleted = allActivitiesCompleted && bestPercent >= level.passPercent;
        const isUnlocked = previousCompleted;
        const status = isCompleted
          ? 'COMPLETED'
          : !isUnlocked
            ? 'LOCKED'
            : hasProgress
              ? 'IN_PROGRESS'
              : 'UNLOCKED';

        const existing = await db.levelProgress.findUnique({
          where: { studentId_levelId: { studentId: student.id, levelId: level.id } },
        });

        let xpAwarded = existing?.xpAwarded || 0;
        if (isCompleted && !existing?.completedAt) xpAwarded = level.xpReward;

        if (persist) {
          const saved = await db.levelProgress.upsert({
            where: { studentId_levelId: { studentId: student.id, levelId: level.id } },
            update: {
              status,
              quizScore: activities.find((a) => a.type === 'QUIZ')?.score || 0,
              worksheetScore: activities.find((a) => a.type === 'WORKSHEET')?.score || 0,
              bestPercent,
              xpAwarded,
              unlockedAt: isUnlocked ? existing?.unlockedAt || new Date() : existing?.unlockedAt,
              completedAt: isCompleted ? existing?.completedAt || new Date() : existing?.completedAt,
            },
            create: {
              studentId: student.id,
              levelId: level.id,
              status,
              quizScore: activities.find((a) => a.type === 'QUIZ')?.score || 0,
              worksheetScore: activities.find((a) => a.type === 'WORKSHEET')?.score || 0,
              bestPercent,
              xpAwarded,
              unlockedAt: isUnlocked ? new Date() : null,
              completedAt: isCompleted ? new Date() : null,
            },
          });

          if (isCompleted && !existing?.completedAt) {
            await db.student.update({ where: { id: student.id }, data: { totalXp: { increment: level.xpReward } } });
            await db.xpTransaction.create({
              data: { studentId: student.id, amount: level.xpReward, reason: `Completed level: ${level.title}` },
            });
            changed.push({ levelId: level.id, status, bestPercent, xpAwarded: level.xpReward });
          } else if (existing?.status !== status || existing?.bestPercent !== bestPercent) {
            changed.push({ levelId: level.id, status, bestPercent, xpAwarded: 0 });
          }

          // Keep the persisted values authoritative if another device completed the level.
          xpAwarded = saved.xpAwarded;
        }

        levels.push({
          id: level.id,
          key: level.key,
          title: level.title,
          subtitle: level.subtitle,
          description: level.description,
          icon: level.icon,
          color: level.color,
          orderIndex: level.orderIndex,
          xpReward: level.xpReward,
          passPercent: level.passPercent,
          status,
          bestPercent,
          xpAwarded,
          activities: level.activities.map((activity: any, index: number) => ({
            id: activity.id,
            type: activity.type,
            orderIndex: index + 1,
            assessment: activity.assessment,
            progress: activities[index],
          })),
        });

        previousCompleted = isCompleted;
      }

      payload.push({
        id: chapter.id,
        key: chapter.key,
        title: chapter.title,
        subtitle: chapter.subtitle,
        description: chapter.description,
        icon: chapter.icon,
        color: chapter.color,
        orderIndex: chapter.orderIndex,
        levels,
      });
    }

    if (notify && changed.length > 0) {
      this.syncGateway.broadcastSyncEvent(SyncEventType.LEVEL_PROGRESS_UPDATED, student.userId, {
        studentId: student.id,
        changes: changed,
      });
    }

    return { student: { id: student.id, userId: student.userId, name: `${student.user.firstName} ${student.user.lastName}` }, chapters: payload };
  }

  async getLearningPath(studentRef?: string) {
    const student = await this.resolveStudent(studentRef);
    return this.buildStudentPath(student, true, false);
  }

  async syncStudentProgress(studentRef: string, _assessmentId?: string) {
    const student = await this.resolveStudent(studentRef);
    return this.buildStudentPath(student, true, true);
  }

  async getLevel(levelId: string, studentRef?: string) {
    const path = await this.getLearningPath(studentRef);
    for (const chapter of path.chapters) {
      const level = chapter.levels.find((candidate: any) => candidate.id === levelId || candidate.key === levelId);
      if (level) return { ...level, chapter: { id: chapter.id, title: chapter.title, color: chapter.color } };
    }
    throw new NotFoundException('Learning level not found');
  }

  async getTeacherOverview(className = '1st Sem') {
    const students = await db.student.findMany({
      where: { gradeLevel: className },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { totalXp: 'desc' },
    });

    const studentPaths = await Promise.all(students.map((student: any) => this.buildStudentPath(student, true, false)));
    const chapters = studentPaths[0]?.chapters || (await this.getPathDefinition()).map((chapter: any) => ({ ...chapter, levels: chapter.levels }));

    return {
      className,
      chapters: chapters.map((chapter: any) => ({
        id: chapter.id,
        key: chapter.key,
        title: chapter.title,
        color: chapter.color,
        levels: chapter.levels.map((level: any) => ({
          id: level.id,
          key: level.key,
          title: level.title,
          xpReward: level.xpReward,
          passPercent: level.passPercent,
          completedCount: studentPaths.filter((path: any) => path.chapters.some((c: any) => c.levels.some((l: any) => l.id === level.id && l.status === 'COMPLETED'))).length,
          studentCount: students.length,
        })),
      })),
      students: studentPaths.map((path: any, index: number) => ({
        studentId: students[index].id,
        name: path.student.name,
        avatarUrl: students[index].user.avatarUrl,
        totalXp: students[index].totalXp,
        levels: path.chapters.flatMap((chapter: any) => chapter.levels).map((level: any) => ({ id: level.id, title: level.title, status: level.status, bestPercent: level.bestPercent })),
      })),
    };
  }
}
