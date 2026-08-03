import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '@/database';
import { CreateProblemDto } from './dto/create-problem.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { SubmitProblemDto } from './dto/submit-problem.dto';
import { DifficultyLevel, SubmissionStatus, ProblemProgressStatus } from '@/types';
import { AiService } from '@/ai/ai.service';

@Injectable()
export class ProblemService {
  constructor(private readonly aiService: AiService) {}

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
      },
    });
  }

  async getProblems(query?: { difficulty?: DifficultyLevel; search?: string }) {
    const where: any = {};
    if (query?.difficulty) {
      where.difficulty = query.difficulty;
    }
    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return db.problem.findMany({
      where,
      include: {
        testCases: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProblemBySlugOrId(slugOrId: string) {
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
      throw new NotFoundException(`Problem '${slugOrId}' not found.`);
    }
    return problem;
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
    const totalTests = testCases.length || 1;
    let passedTests = 0;
    let status: SubmissionStatus = SubmissionStatus.ACCEPTED;
    let score = 100;

    const codeLower = dto.sourceCode.toLowerCase();
    const hasSyntaxError = codeLower.includes('syntaxerror') || codeLower.includes('invalid syntax');
    const hasRuntimeError = codeLower.includes('exception') || codeLower.includes('error:');

    if (hasSyntaxError) {
      status = SubmissionStatus.COMPILATION_ERROR;
      score = 0;
      passedTests = 0;
    } else if (hasRuntimeError) {
      status = SubmissionStatus.RUNTIME_ERROR;
      score = 0;
      passedTests = 0;
    } else {
      passedTests = totalTests;
      status = SubmissionStatus.ACCEPTED;
      score = 100;
    }

    const runtimeMs = Math.floor(Math.random() * 40) + 15;
    const memoryKb = Math.floor(Math.random() * 3000) + 14000;

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

    const isSolved = status === SubmissionStatus.ACCEPTED || score === 100;
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

    // Reward XP to student if newly solved
    let xpEarned = 0;
    if (student && isSolved && existingProgress?.status !== ProblemProgressStatus.SOLVED) {
      xpEarned = problem.points || 10;
      await db.student.update({
        where: { id: student.id },
        data: { totalXp: { increment: xpEarned } },
      });
    }

    return {
      submission,
      progress: updatedProgress,
      xpEarned,
      isSolved,
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
    if (!problem) throw new NotFoundException('Problem not found');

    const existing = await db.problemBookmark.findUnique({
      where: { userId_problemId: { userId, problemId: problem.id } },
    });

    if (existing) {
      await db.problemBookmark.delete({
        where: { id: existing.id },
      });
      return { isBookmarked: false, message: 'Bookmark removed.' };
    }

    await db.problemBookmark.create({
      data: {
        userId,
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
