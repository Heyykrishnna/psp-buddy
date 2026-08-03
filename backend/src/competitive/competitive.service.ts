import { Injectable, Logger } from '@nestjs/common';
import { db } from '@/database';

// ── XP values for each action ─────────────────────────────────────────────────
export const XP_VALUES = {
  PROBLEM_SOLVED_EASY: 10,
  PROBLEM_SOLVED_MEDIUM: 25,
  PROBLEM_SOLVED_HARD: 50,
  DAILY_CHALLENGE_SOLVED: 50,
  WEEKLY_CHALLENGE_COMPLETED: 200,
  STREAK_3_DAYS: 30,
  STREAK_7_DAYS: 75,
  STREAK_30_DAYS: 300,
  CONTEST_PARTICIPATION: 20,
};

// ── Achievement definitions (seeded on startup if missing) ────────────────────
export const ACHIEVEMENT_DEFS = [
  { key: 'first_blood', title: 'First Blood', description: 'Solve your first problem', icon: 'Swords', category: 'PROBLEMS_SOLVED', xpReward: 50, threshold: 1 },
  { key: 'problem_5', title: 'Getting Started', description: 'Solve 5 problems', icon: 'Star', category: 'PROBLEMS_SOLVED', xpReward: 75, threshold: 5 },
  { key: 'problem_25', title: 'Dedicated Coder', description: 'Solve 25 problems', icon: 'Trophy', category: 'PROBLEMS_SOLVED', xpReward: 150, threshold: 25 },
  { key: 'problem_100', title: 'Centurion', description: 'Solve 100 problems', icon: 'Medal', category: 'PROBLEMS_SOLVED', xpReward: 500, threshold: 100 },
  { key: 'streak_3', title: 'On Fire', description: 'Maintain a 3-day streak', icon: 'Flame', category: 'STREAK', xpReward: 30, threshold: 3 },
  { key: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: 'Zap', category: 'STREAK', xpReward: 75, threshold: 7 },
  { key: 'streak_30', title: 'Unstoppable', description: 'Maintain a 30-day streak', icon: 'Crown', category: 'STREAK', xpReward: 300, threshold: 30 },
  { key: 'xp_500', title: 'XP Collector', description: 'Earn 500 XP total', icon: 'Sparkles', category: 'XP', xpReward: 50, threshold: 500 },
  { key: 'xp_5000', title: 'XP Master', description: 'Earn 5000 XP total', icon: 'Gem', category: 'XP', xpReward: 200, threshold: 5000 },
  { key: 'contest_1', title: 'Contestant', description: 'Participate in a contest', icon: 'Flag', category: 'CONTEST', xpReward: 50, threshold: 1 },
  { key: 'contest_10', title: 'Arena Regular', description: 'Participate in 10 contests', icon: 'Shield', category: 'CONTEST', xpReward: 200, threshold: 10 },
  { key: 'speed_demon', title: 'Speed Demon', description: 'Solve a problem in under 5 minutes', icon: 'Timer', category: 'SPEED', xpReward: 100, threshold: 1 },
  { key: 'perfect_score', title: 'Perfectionist', description: 'Get a perfect score on a submission', icon: 'Check', category: 'PERFECT_SCORE', xpReward: 75, threshold: 1 },
];

@Injectable()
export class CompetitiveService {
  private readonly logger = new Logger(CompetitiveService.name);

  // ── Ensure achievements seeded ──────────────────────────────────────────────
  async seedAchievements() {
    for (const def of ACHIEVEMENT_DEFS) {
      await db.achievement.upsert({
        where: { key: def.key },
        update: {},
        create: { key: def.key, title: def.title, description: def.description, icon: def.icon, category: def.category as any, xpReward: def.xpReward, threshold: def.threshold },
      });
    }
  }

  // ── Award XP ────────────────────────────────────────────────────────────────
  async awardXp(studentId: string, amount: number, reason: string): Promise<void> {
    await db.xpTransaction.create({ data: { studentId, amount, reason } });
    await db.student.update({ where: { id: studentId }, data: { totalXp: { increment: amount } } });
  }

  // ── Streak Management ───────────────────────────────────────────────────────
  async updateStreak(studentId: string): Promise<{ streak: number; xpAwarded: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const student = await db.student.findUnique({ where: { id: studentId } });
    if (!student) return { streak: 0, xpAwarded: 0 };

    const todayLog = await db.streakLog.findUnique({
      where: { studentId_date: { studentId, date: today } },
    });

    if (todayLog) return { streak: student.currentStreak, xpAwarded: 0 };

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayLog = await db.streakLog.findUnique({
      where: { studentId_date: { studentId, date: yesterday } },
    });

    const newStreak = yesterdayLog ? student.currentStreak + 1 : 1;

    await db.streakLog.create({ data: { studentId, date: today } });
    await db.student.update({
      where: { id: studentId },
      data: {
        currentStreak: newStreak,
        maxStreak: Math.max(student.maxStreak, newStreak),
        lastActivityDate: today,
      },
    });

    // Streak milestone XP
    let xpAwarded = 0;
    if (newStreak === 3) { await this.awardXp(studentId, XP_VALUES.STREAK_3_DAYS, '3-day streak bonus'); xpAwarded = XP_VALUES.STREAK_3_DAYS; }
    else if (newStreak === 7) { await this.awardXp(studentId, XP_VALUES.STREAK_7_DAYS, '7-day streak bonus'); xpAwarded = XP_VALUES.STREAK_7_DAYS; }
    else if (newStreak === 30) { await this.awardXp(studentId, XP_VALUES.STREAK_30_DAYS, '30-day streak bonus'); xpAwarded = XP_VALUES.STREAK_30_DAYS; }

    // Check streak achievements
    await this.checkAchievements(studentId, 'STREAK');

    return { streak: newStreak, xpAwarded };
  }

  // ── Achievement Checker ─────────────────────────────────────────────────────
  async checkAchievements(studentId: string, category?: string): Promise<string[]> {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { userAchievements: { include: { achievement: true } } },
    });
    if (!student) return [];

    const unlockedKeys = new Set(student.userAchievements.map((a: any) => a.achievement.key));
    const defs = category ? ACHIEVEMENT_DEFS.filter((d) => d.category === category) : ACHIEVEMENT_DEFS;
    const newlyUnlocked: string[] = [];

    for (const def of defs) {
      if (unlockedKeys.has(def.key)) continue;

      let value = 0;
      if (def.category === 'PROBLEMS_SOLVED') {
        value = await db.userProblemProgress.count({ where: { userId: student.userId, status: 'SOLVED' } });
      } else if (def.category === 'STREAK') {
        value = student.currentStreak;
      } else if (def.category === 'XP') {
        value = student.totalXp;
      } else if (def.category === 'CONTEST') {
        value = student.contestsParticipated;
      }

      if (value >= def.threshold) {
        const achievement = await db.achievement.findUnique({ where: { key: def.key } });
        if (!achievement) continue;

        await db.userAchievement.create({ data: { studentId, achievementId: achievement.id } });
        await this.awardXp(studentId, achievement.xpReward, `Achievement unlocked: ${achievement.title}`);
        newlyUnlocked.push(def.title);
        this.logger.log(`Achievement unlocked: ${def.key} for student ${studentId}`);
      }
    }
    return newlyUnlocked;
  }

  // ── Daily Challenge ─────────────────────────────────────────────────────────
  async getTodayChallenge() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let challenge = await db.dailyChallenge.findUnique({
      where: { challengeDate: today },
      include: { problem: true, entries: { select: { studentId: true, solved: true } } },
    });

    if (!challenge) {
      // Auto-pick a random published problem for today
      const count = await db.problem.count({ where: { isPublished: true } });
      if (count === 0) return null;
      const skip = Math.floor(Math.random() * count);
      const problem = await db.problem.findFirst({ where: { isPublished: true }, skip });
      if (!problem) return null;

      challenge = await db.dailyChallenge.create({
        data: { problemId: problem.id, challengeDate: today, bonusXp: 50 },
        include: { problem: true, entries: { select: { studentId: true, solved: true } } },
      });
    }

    const totalSolved = challenge.entries.filter((e: any) => e.solved).length;
    return { ...challenge, totalSolved, totalAttempted: challenge.entries.length };
  }

  async completeDailyChallenge(studentId: string): Promise<{ bonusXp: number; alreadyDone: boolean }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const challenge = await db.dailyChallenge.findUnique({ where: { challengeDate: today } });
    if (!challenge) return { bonusXp: 0, alreadyDone: false };

    const existing = await db.dailyChallengeEntry.findUnique({
      where: { challengeId_studentId: { challengeId: challenge.id, studentId } },
    });

    if (existing?.bonusXpAwarded) return { bonusXp: 0, alreadyDone: true };

    await db.dailyChallengeEntry.upsert({
      where: { challengeId_studentId: { challengeId: challenge.id, studentId } },
      create: { challengeId: challenge.id, studentId, solved: true, bonusXpAwarded: true, solvedAt: new Date() },
      update: { solved: true, bonusXpAwarded: true, solvedAt: new Date() },
    });

    await this.awardXp(studentId, challenge.bonusXp, 'Daily Challenge completed');
    return { bonusXp: challenge.bonusXp, alreadyDone: false };
  }

  // ── Weekly Challenges ────────────────────────────────────────────────────────
  async getCurrentWeeklyChallenge() {
    const now = new Date();
    return db.weeklyChallenge.findFirst({
      where: { startDate: { lte: now }, endDate: { gte: now } },
      include: { userProgress: { select: { studentId: true, completed: true, progress: true } } },
    });
  }

  async getOrCreateWeeklyChallenge() {
    const now = new Date();
    let challenge = await db.weeklyChallenge.findFirst({
      where: { startDate: { lte: now }, endDate: { gte: now } },
    });

    if (!challenge) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const weekNum = this.getWeekNumber(now);
      challenge = await db.weeklyChallenge.upsert({
        where: { weekNumber_year: { weekNumber: weekNum, year: now.getFullYear() } },
        update: {},
        create: {
          title: `Week ${weekNum} Challenge`,
          description: 'Solve 5 problems this week to earn bonus XP!',
          weekNumber: weekNum,
          year: now.getFullYear(),
          startDate: startOfWeek,
          endDate: endOfWeek,
          xpReward: 200,
          goalType: 'PROBLEMS_SOLVED',
          goalTarget: 5,
        },
      });
    }
    return challenge;
  }

  async updateWeeklyProgress(studentId: string, solvedCount: number) {
    const challenge = await this.getOrCreateWeeklyChallenge();
    if (!challenge) return;

    const existing = await db.userWeeklyProgress.findUnique({
      where: { weeklyChallengeId_studentId: { weeklyChallengeId: challenge.id, studentId } },
    });

    const newProgress = (existing?.progress || 0) + 1;
    const completed = newProgress >= challenge.goalTarget;

    const progress = await db.userWeeklyProgress.upsert({
      where: { weeklyChallengeId_studentId: { weeklyChallengeId: challenge.id, studentId } },
      create: { weeklyChallengeId: challenge.id, studentId, progress: newProgress, completed, completedAt: completed ? new Date() : undefined },
      update: { progress: newProgress, completed, completedAt: completed && !existing?.completed ? new Date() : existing?.completedAt },
    });

    if (completed && !existing?.completed) {
      await this.awardXp(studentId, challenge.xpReward, 'Weekly challenge completed');
      await db.userWeeklyProgress.update({ where: { id: progress.id }, data: { xpAwarded: true } });
    }
  }

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  async getLeaderboard(timeframe: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' = 'ALL_TIME', limit = 50) {
    let dateFilter: Date | undefined;
    const now = new Date();
    if (timeframe === 'WEEKLY') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeframe === 'MONTHLY') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (timeframe === 'ALL_TIME') {
      const students = await db.student.findMany({
        orderBy: { totalXp: 'desc' },
        take: limit,
        include: { user: { select: { firstName: true, lastName: true, avatarUrl: true, email: true } } },
      });
      return students.map((s: any, i: number) => ({
        rank: i + 1,
        studentId: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        avatarUrl: s.user.avatarUrl,
        totalXp: s.totalXp,
        currentStreak: s.currentStreak,
        contestRating: s.contestRating,
      }));
    }

    // For weekly/monthly — aggregate XP from transactions
    const xpByStudent = await db.xpTransaction.groupBy({
      by: ['studentId'],
      where: { createdAt: { gte: dateFilter } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    const studentIds = xpByStudent.map((x: any) => x.studentId);
    const students = await db.student.findMany({
      where: { id: { in: studentIds } },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });
    const studentMap = new Map<string, any>(students.map((s: any) => [s.id, s]));

    return xpByStudent.map((x: any, i: number) => {
      const s = studentMap.get(x.studentId);
      return {
        rank: i + 1,
        studentId: x.studentId,
        name: s ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown',
        avatarUrl: s?.user?.avatarUrl,
        totalXp: x._sum.amount || 0,
        currentStreak: s?.currentStreak || 0,
        contestRating: s?.contestRating || 1200,
      };
    });
  }

  // ── Contests ─────────────────────────────────────────────────────────────────
  async getContests(status?: string) {
    return db.contest.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { startTime: 'desc' },
      include: { _count: { select: { participants: true } } },
    });
  }

  async getContest(contestId: string) {
    return db.contest.findUnique({
      where: { id: contestId },
      include: {
        participants: {
          orderBy: { rank: 'asc' },
          take: 50,
          include: { student: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } } },
        },
        _count: { select: { participants: true } },
      },
    });
  }

  async registerForContest(contestId: string, studentId: string) {
    const contest = await db.contest.findUnique({ where: { id: contestId } });
    if (!contest) throw new Error('Contest not found');
    if (contest.status === 'ENDED') throw new Error('Contest has ended');

    return db.contestParticipant.upsert({
      where: { contestId_studentId: { contestId, studentId } },
      create: { contestId, studentId },
      update: {},
    });
  }

  // ── Student competitive summary ───────────────────────────────────────────────
  async getStudentCompetitiveProfile(studentId: string) {
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true, email: true } },
        xpTransactions: { orderBy: { createdAt: 'desc' }, take: 10 },
        unlockedBadges: { include: { badge: true }, orderBy: { unlockedAt: 'desc' } },
        userAchievements: { include: { achievement: true }, orderBy: { unlockedAt: 'desc' } },
        streakLogs: { orderBy: { date: 'desc' }, take: 30 },
        contestParticipations: { include: { contest: { select: { title: true, status: true } } }, orderBy: { registeredAt: 'desc' }, take: 5 },
        weeklyProgress: { include: { weeklyChallenge: true }, orderBy: { updatedAt: 'desc' }, take: 4 },
        dailyChallengeEntries: { orderBy: { createdAt: 'desc' }, take: 7 },
      },
    });

    if (!student) return null;

    const problemsSolved = await db.userProblemProgress.count({
      where: { userId: student.userId, status: 'SOLVED' },
    });

    const [globalRank] = await db.$queryRaw<{ rank: number }[]>`
      SELECT CAST(rank() OVER (ORDER BY "total_xp" DESC) AS INT) as rank
      FROM students WHERE id = ${studentId}
    `;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayChallenge = await db.dailyChallenge.findUnique({ where: { challengeDate: today } });
    const todayChallengeEntry = todayChallenge
      ? await db.dailyChallengeEntry.findUnique({
        where: { challengeId_studentId: { challengeId: todayChallenge.id, studentId } },
      })
      : null;

    return {
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        avatarUrl: student.user.avatarUrl,
        email: student.user.email,
        totalXp: student.totalXp,
        currentStreak: student.currentStreak,
        maxStreak: student.maxStreak,
        contestRating: student.contestRating,
        contestsParticipated: student.contestsParticipated,
      },
      stats: { problemsSolved, globalRank: globalRank?.rank || null },
      badges: student.unlockedBadges,
      achievements: student.userAchievements,
      recentXp: student.xpTransactions,
      streakCalendar: student.streakLogs.map((l: any) => l.date),
      contests: student.contestParticipations,
      weeklyProgress: student.weeklyProgress,
      dailyChallenge: { completed: todayChallengeEntry?.solved || false, bonusXp: todayChallenge?.bonusXp || 50 },
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  private getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }
}
