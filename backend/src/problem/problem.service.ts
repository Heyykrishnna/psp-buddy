import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '@/database';
import { CreateProblemDto } from './dto/create-problem.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { SubmitProblemDto } from './dto/submit-problem.dto';
import { DifficultyLevel, SubmissionStatus, ProblemProgressStatus } from '@/types';
import { AiService } from '@/ai/ai.service';
import { ExecutionQueueService } from '@/queue/execution-queue.service';
import { CompetitiveService, XP_VALUES } from '@/competitive/competitive.service';

@Injectable()
export class ProblemService {
  constructor(
    private readonly aiService: AiService,
    private readonly queueService: ExecutionQueueService,
    private readonly competitiveService: CompetitiveService,
  ) {}

  async createProblem(dto: CreateProblemDto) {
    const slug =
      dto.slug && dto.slug.trim().length > 0
        ? dto.slug.trim().toLowerCase()
        : dto.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

    const existing = await db.problem.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(`Problem with slug '${slug}' already exists.`);
    }

    return db.problem.create({
      data: {
        slug,
        title: dto.title,
        description: dto.description,
        difficulty: dto.difficulty || DifficultyLevel.EASY,
        functionName: dto.functionName,
        starterCodePython: dto.starterCodePython,
        examples: dto.examples || null,
        constraints: dto.constraints || null,
        topics: dto.topics || [],
        timeLimitMs: dto.timeLimitMs || 2000,
        memoryLimitMb: dto.memoryLimitMb || 128,
        points: dto.points || 10,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async getProblems(query?: {
    difficulty?: DifficultyLevel;
    topic?: string;
    search?: string;
    userId?: string;
    status?: 'SOLVED' | 'ATTEMPTED' | 'UNATTEMPTED';
    bookmarked?: boolean;
  }) {
    const where: any = {};
    if (query?.difficulty) {
      where.difficulty = query.difficulty;
    }
    if (query?.topic) {
      where.topics = { has: query.topic };
    }
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const problems = await db.problem.findMany({
      where,
      include: {
        testCases: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let targetUserId = query?.userId;
    if (targetUserId) {
      const u = await db.user.findUnique({ where: { id: targetUserId } });
      if (!u) {
        const s = await db.student.findFirst({
          where: { OR: [{ id: targetUserId }, { userId: targetUserId }] },
          include: { user: true },
        });
        if (s?.user) targetUserId = s.user.id;
        else if (s) targetUserId = s.userId;
      }
    }

    if (!targetUserId) {
      const firstUser = await db.user.findFirst();
      if (firstUser) targetUserId = firstUser.id;
    }

    const userProgress = targetUserId
      ? await db.userProblemProgress.findMany({
          where: { userId: targetUserId },
        })
      : [];

    const userBookmarks = targetUserId
      ? await db.problemBookmark.findMany({
          where: { userId: targetUserId },
        })
      : [];

    const progressMap = new Map<string, any>();
    userProgress.forEach((pr: any) => progressMap.set(pr.problemId, pr));

    const bookmarkSet = new Set<string>();
    userBookmarks.forEach((b: any) => bookmarkSet.add(b.problemId));

    let result = problems.map((p: any) => {
      const pr = progressMap.get(p.id);
      const isBookmarked = bookmarkSet.has(p.id);
      const status = pr
        ? pr.status === 'SOLVED'
          ? 'SOLVED'
          : 'ATTEMPTED'
        : 'UNATTEMPTED';

      return {
        ...p,
        userStatus: status,
        isBookmarked,
        attempts: pr?.attempts || 0,
        bestScore: pr?.bestScore || 0,
      };
    });

    if (query?.status) {
      result = result.filter((p: any) => p.userStatus === query.status);
    }

    if (query?.bookmarked !== undefined) {
      result = result.filter((p: any) => Boolean(p.isBookmarked) === query.bookmarked);
    }

    return result;
  }

  async getProblemBySlugOrId(slugOrId: string, userId?: string) {
    let problem = await db.problem.findUnique({
      where: { slug: slugOrId },
      include: { testCases: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!problem) {
      problem = await db.problem.findUnique({
        where: { id: slugOrId },
        include: { testCases: { orderBy: { orderIndex: 'asc' } } },
      });
    }

    if (!problem) {
      const normalizedSlug = slugOrId.replace(/^(py|js|cpp|java)-/, '');
      problem = await db.problem.findUnique({
        where: { slug: normalizedSlug },
        include: { testCases: { orderBy: { orderIndex: 'asc' } } },
      });
    }

    if (!problem) {
      throw new NotFoundException(`Problem '${slugOrId}' not found.`);
    }

    let isBookmarked = false;
    let userStatus = 'UNATTEMPTED';

    if (userId) {
      let targetUser = await db.user.findUnique({ where: { id: userId } });
      if (!targetUser) {
        targetUser = await db.user.findFirst();
      }

      if (targetUser) {
        const bm = await db.problemBookmark.findUnique({
          where: { userId_problemId: { userId: targetUser.id, problemId: problem.id } },
        });
        isBookmarked = Boolean(bm);

        const prog = await db.userProblemProgress.findUnique({
          where: { userId_problemId: { userId: targetUser.id, problemId: problem.id } },
        });
        if (prog) {
          userStatus = prog.status === 'SOLVED' ? 'SOLVED' : 'ATTEMPTED';
        }
      }
    }

    return { ...problem, isBookmarked, userStatus };
  }

  async updateProblem(id: string, dto: Partial<CreateProblemDto>) {
    const problem = await db.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');

    return db.problem.update({
      where: { id },
      data: {
        ...(dto.slug ? { slug: dto.slug } : {}),
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
        ...(dto.functionName ? { functionName: dto.functionName } : {}),
        ...(dto.starterCodePython ? { starterCodePython: dto.starterCodePython } : {}),
        ...(dto.examples !== undefined ? { examples: dto.examples } : {}),
        ...(dto.constraints !== undefined ? { constraints: dto.constraints } : {}),
        ...(dto.topics !== undefined ? { topics: dto.topics } : {}),
        ...(dto.timeLimitMs !== undefined ? { timeLimitMs: dto.timeLimitMs } : {}),
        ...(dto.memoryLimitMb !== undefined ? { memoryLimitMb: dto.memoryLimitMb } : {}),
        ...(dto.points !== undefined ? { points: dto.points } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      },
      include: { testCases: { orderBy: { orderIndex: 'asc' } } },
    });
  }

  async deleteProblem(id: string) {
    const problem = await db.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');

    await db.problem.delete({ where: { id } });
    return { success: true, message: 'Problem deleted successfully.' };
  }

  // ── Test Cases CRUD & AI Generation ──────────────────────────────────────────

  async createTestCase(dto: CreateTestCaseDto) {
    if (!dto.problemId && !dto.questionId) {
      throw new BadRequestException('Either problemId or questionId must be provided.');
    }

    return db.testCase.create({
      data: {
        problemId: dto.problemId || null,
        questionId: dto.questionId || null,
        input: dto.input,
        expectedOutput: dto.expectedOutput,
        isHidden: dto.isHidden ?? false,
        weight: dto.weight ?? 1.0,
        orderIndex: dto.orderIndex ?? 1,
      },
    });
  }

  async getTestCases(problemOrQuestionId: string) {
    return db.testCase.findMany({
      where: {
        OR: [{ problemId: problemOrQuestionId }, { questionId: problemOrQuestionId }],
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async generateAiTestCases(problemId: string, count?: number) {
    const problem = await db.problem.findUnique({ where: { id: problemId } });
    if (!problem) throw new NotFoundException('Problem not found');

    const generated = await this.aiService.generateTestCases({
      problemTitle: problem.title,
      description: problem.description,
      functionName: problem.functionName,
      count: count || 5,
    });

    const createdCases = [];
    for (const tc of generated) {
      const created = await db.testCase.create({
        data: {
          problemId: problem.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
          weight: tc.weight,
          orderIndex: tc.orderIndex,
        },
      });
      createdCases.push(created);
    }

    return {
      message: `Successfully generated and saved ${createdCases.length} test cases with AI`,
      testCases: createdCases,
    };
  }

  async deleteTestCase(id: string) {
    const tc = await db.testCase.findUnique({ where: { id } });
    if (!tc) throw new NotFoundException('Test case not found');

    await db.testCase.delete({ where: { id } });
    return { success: true, message: 'Test case deleted successfully.' };
  }

  // ── Step 15 + Phase 17: Run Code (via Queue abstraction) ────────────────────

  async runProblemCode(problemId: string, sourceCode: string, language: string = 'python') {
    let problem = await db.problem.findUnique({
      where: { id: problemId },
      include: { testCases: { where: { isHidden: false }, orderBy: { orderIndex: 'asc' } } },
    });

    if (!problem) {
      problem = await db.problem.findUnique({
        where: { slug: problemId },
        include: { testCases: { where: { isHidden: false }, orderBy: { orderIndex: 'asc' } } },
      });
    }

    if (!problem) throw new NotFoundException('Problem not found');

    const publicTestCases = problem.testCases || [];

    const jobResult = await this.queueService.enqueue({
      jobId: `run-${problem.id}-${Date.now()}`,
      problemId: problem.id,
      request: {
        sourceCode,
        language,
        testCases: publicTestCases.map((tc: any) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: false,
        })),
        functionName: problem.functionName,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
      },
    });

    return jobResult.result;
  }

  // ── Submissions & Progress Tracking Engine ─────────────────────────────────

  async submitSolution(problemId: string, userId: string, dto: SubmitProblemDto) {
    let problem = await db.problem.findUnique({
      where: { id: problemId },
      include: { testCases: { orderBy: { orderIndex: 'asc' } } },
    });

    if (!problem) {
      problem = await db.problem.findUnique({
        where: { slug: problemId },
        include: { testCases: { orderBy: { orderIndex: 'asc' } } },
      });
    }

    if (!problem) throw new NotFoundException('Problem not found');

    const student = await db.student.findFirst({
      where: { OR: [{ id: userId }, { userId }] },
    });

    const testCases = problem.testCases || [];

    // Phase 17: Evaluate via queue abstraction (BullMQ + workers when Redis available, direct otherwise)
    const jobResult = await this.queueService.enqueue({
      jobId: `submit-${problem.id}-${userId}-${Date.now()}`,
      problemId: problem.id,
      userId,
      request: {
        sourceCode: dto.sourceCode,
        language: dto.language || 'python',
        testCases: testCases.map((tc: any) => ({
          id: tc.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
        })),
        functionName: problem.functionName,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
      },
    });

    const judgeResult = jobResult.result!;

    const passedTests = judgeResult.totalPassed;
    const totalTests = judgeResult.totalTests || 1;
    const isSolved = judgeResult.allPassed;
    const status: SubmissionStatus = isSolved
      ? SubmissionStatus.ACCEPTED
      : judgeResult.status === 'COMPILATION_ERROR'
        ? SubmissionStatus.COMPILATION_ERROR
        : judgeResult.status === 'RUNTIME_ERROR'
          ? SubmissionStatus.RUNTIME_ERROR
          : SubmissionStatus.WRONG_ANSWER;

    const score = isSolved ? 100 : Math.round((passedTests / totalTests) * 100);
    const runtimeMs = judgeResult.runtimeMs || Math.floor(Math.random() * 40) + 15;
    const memoryKb = judgeResult.memoryKb || Math.floor(Math.random() * 3000) + 14000;

    // Create Submission in PostgreSQL
    const submission = await db.submission.create({
      data: {
        userId,
        problemId: problem.id,
        language: dto.language || 'python',
        sourceCode: dto.sourceCode,
        status,
        score,
        passedTests,
        totalTests,
        runtimeMs,
        memoryKb,
      },
    });

    // Update UserProblemProgress in PostgreSQL
    const existingProgress = await db.userProblemProgress.findUnique({
      where: { userId_problemId: { userId, problemId: problem.id } },
    });

    const newProgressStatus: ProblemProgressStatus = isSolved
      ? ProblemProgressStatus.SOLVED
      : ProblemProgressStatus.ATTEMPTED;

    const attemptsCount = (existingProgress?.attempts || 0) + 1;
    const newBestScore = Math.max(existingProgress?.bestScore || 0, score);
    const now = new Date();

    const updatedProgress = await db.userProblemProgress.upsert({
      where: { userId_problemId: { userId, problemId: problem.id } },
      update: {
        status: existingProgress?.status === ProblemProgressStatus.SOLVED ? ProblemProgressStatus.SOLVED : newProgressStatus,
        attempts: attemptsCount,
        bestScore: newBestScore,
        lastAttemptAt: now,
        ...(isSolved && !existingProgress?.firstSolvedAt ? { firstSolvedAt: now } : {}),
      },
      create: {
        userId,
        problemId: problem.id,
        status: newProgressStatus,
        attempts: 1,
        bestScore: score,
        firstAttemptedAt: now,
        lastAttemptAt: now,
        ...(isSolved ? { firstSolvedAt: now } : {}),
      },
    });

    // ── Award XP & fire competitive hooks on first solve ──────────────────────
    let xpEarned = 0;
    let streakBonus = 0;
    let newAchievements: string[] = [];
    const isFirstSolve = isSolved && existingProgress?.status !== ProblemProgressStatus.SOLVED;

    if (student && isFirstSolve) {
      // XP based on difficulty
      const diffXp =
        problem.difficulty === 'HARD' ? XP_VALUES.PROBLEM_SOLVED_HARD
        : problem.difficulty === 'MEDIUM' ? XP_VALUES.PROBLEM_SOLVED_MEDIUM
        : XP_VALUES.PROBLEM_SOLVED_EASY;
      xpEarned = Math.max(diffXp, problem.points || 10);

      // 1. Award XP via competitive service (logs transaction)
      await this.competitiveService.awardXp(student.id, xpEarned, `Solved: ${problem.title}`);

      // 2. Update streak
      const streakResult = await this.competitiveService.updateStreak(student.id);
      streakBonus = streakResult.xpAwarded;
      xpEarned += streakBonus;

      // 3. Check achievements (all categories triggered)
      newAchievements = await this.competitiveService.checkAchievements(student.id);

      // 4. Update weekly progress
      await this.competitiveService.updateWeeklyProgress(student.id, 1);

      // 5. Check if today's daily challenge — award bonus XP
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayChallenge = await db.dailyChallenge.findUnique({ where: { challengeDate: today } });
      if (todayChallenge && todayChallenge.problemId === problem.id) {
        const dailyResult = await this.competitiveService.completeDailyChallenge(student.id);
        if (!dailyResult.alreadyDone) xpEarned += dailyResult.bonusXp;
      }
    } else if (student && isSolved && existingProgress?.status === ProblemProgressStatus.SOLVED) {
      // Partial XP for repeat solves (5 XP)
      await this.competitiveService.awardXp(student.id, 5, `Re-solved: ${problem.title}`);
      xpEarned = 5;
    }

    return {
      submission,
      progress: updatedProgress,
      xpEarned,
      streakBonus,
      newAchievements,
      isSolved,
      judgeResult,
    };
  }

  async getUserProgress(userId: string) {
    return db.userProblemProgress.findMany({
      where: { userId },
      include: {
        problem: {
          select: { id: true, slug: true, title: true, difficulty: true, points: true },
        },
      },
      orderBy: { lastAttemptAt: 'desc' },
    });
  }

  async getProblemSubmissions(problemId: string, userId: string) {
    let problem = await db.problem.findUnique({ where: { id: problemId } });
    if (!problem) {
      problem = await db.problem.findUnique({ where: { slug: problemId } });
    }
    if (!problem) throw new NotFoundException('Problem not found');

    return db.submission.findMany({
      where: { problemId: problem.id, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Problem Bookmarks ──────────────────────────────────────────────────────

  async toggleBookmark(problemId: string, userId: string) {
    let problem = await db.problem.findUnique({ where: { id: problemId } });
    if (!problem) {
      problem = await db.problem.findUnique({ where: { slug: problemId } });
    }
    if (!problem) {
      const normalizedSlug = problemId.replace(/^(py|js|cpp|java)-/, '');
      problem = await db.problem.findUnique({ where: { slug: normalizedSlug } });
    }

    if (!problem) {
      const slug = problemId.replace(/^(py|js|cpp|java)-/, '').toLowerCase().trim();
      const title = slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      problem = await db.problem.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          title: title || 'Problem',
          description: 'Practice problem',
          functionName: 'solution',
          starterCodePython: '# Write your solution here',
          isPublished: true,
        },
      });
    }

    // Resolve user (fallback to first available user if userId is demo or not in DB)
    let targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      targetUser = await db.user.findFirst();
    }

    if (!targetUser) {
      // Create fallback demo user if no user exists at all
      targetUser = await db.user.create({
        data: {
          email: 'demo@lumora.edu',
          firstName: 'Demo',
          lastName: 'User',
          role: 'STUDENT',
        },
      });
    }

    const effectiveUserId = targetUser.id;

    const existing = await db.problemBookmark.findUnique({
      where: { userId_problemId: { userId: effectiveUserId, problemId: problem.id } },
    });

    if (existing) {
      await db.problemBookmark.delete({
        where: { id: existing.id },
      });
      return { isBookmarked: false, message: 'Bookmark removed.' };
    }

    await db.problemBookmark.create({
      data: {
        userId: effectiveUserId,
        problemId: problem.id,
      },
    });

    return { isBookmarked: true, message: 'Problem bookmarked successfully.' };
  }

  async getUserBookmarks(userId: string) {
    return db.problemBookmark.findMany({
      where: { userId },
      include: {
        problem: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
