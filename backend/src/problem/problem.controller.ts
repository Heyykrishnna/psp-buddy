import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ProblemService } from './problem.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { SubmitProblemDto } from './dto/submit-problem.dto';
import { DifficultyLevel } from '@/types';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { ExecutionQueueService } from '@/queue/execution-queue.service';
import { ExecutionSecurityGuard, SubmitSecurityGuard, EXECUTION_LIMITS } from '@/security/execution.guard';

@Controller('problems')
export class ProblemController {
  constructor(
    private readonly problemService: ProblemService,
    private readonly queueService: ExecutionQueueService,
  ) {}

  // ── Problem CRUD ─────────────────────────────────────────────────────────────

  // 1. POST /problems - Create Problem (Teacher only)
  @Post()
  async createProblem(@Body() body: CreateProblemDto) {
    return this.problemService.createProblem(body);
  }

  // 2. GET /problems - List Problems with filters & progress
  @SkipThrottle()
  @Get()
  async getProblems(
    @Request() req: any,
    @Query('difficulty') difficulty?: DifficultyLevel,
    @Query('topic') topic?: string,
    @Query('search') search?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: 'SOLVED' | 'ATTEMPTED' | 'UNATTEMPTED',
    @Query('bookmarked') bookmarked?: string,
  ) {
    const isBookmarked =
      bookmarked === 'true' ? true : bookmarked === 'false' ? false : undefined;

    const effectiveUserId = userId || req?.user?.sub || req?.user?.id;

    return this.problemService.getProblems({
      difficulty,
      topic,
      search,
      userId: effectiveUserId,
      status,
      bookmarked: isBookmarked,
    });
  }

  // 3. GET /problems/user/progress
  @UseGuards(JwtAuthGuard)
  @Get('user/progress')
  async getUserProgress(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.problemService.getUserProgress(userId);
  }

  // 4. GET /problems/user/bookmarks
  @UseGuards(JwtAuthGuard)
  @Get('user/bookmarks')
  async getUserBookmarks(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.problemService.getUserBookmarks(userId);
  }

  // 16. GET /problems/queue/stats - BullMQ health (must come before :slugOrId)
  @SkipThrottle()
  @Get('queue/stats')
  async getQueueStats() {
    return this.queueService.getQueueStats();
  }

  // 5. GET /problems/:slugOrId - Get Problem by Slug or ID
  @SkipThrottle()
  @Get(':slugOrId')
  async getProblemBySlugOrId(
    @Param('slugOrId') slugOrId: string,
    @Query('userId') userId?: string,
  ) {
    return this.problemService.getProblemBySlugOrId(slugOrId, userId);
  }

  // 6. PATCH /problems/:id - Update Problem
  @Patch(':id')
  async updateProblem(
    @Param('id') id: string,
    @Body() body: Partial<CreateProblemDto>,
  ) {
    return this.problemService.updateProblem(id, body);
  }

  // 7. DELETE /problems/:id - Delete Problem
  @Delete(':id')
  async deleteProblem(@Param('id') id: string) {
    return this.problemService.deleteProblem(id);
  }

  // ── Test Cases API ──────────────────────────────────────────────────────────

  // 8. POST /problems/:id/test-cases
  @Post(':id/test-cases')
  async createTestCase(
    @Param('id') problemId: string,
    @Body() body: CreateTestCaseDto,
  ) {
    return this.problemService.createTestCase({ ...body, problemId });
  }

  // 9. POST /problems/:id/test-cases/generate - AI generation
  @Post(':id/test-cases/generate')
  async generateAiTestCases(
    @Param('id') problemId: string,
    @Body() body: { count?: number },
  ) {
    return this.problemService.generateAiTestCases(problemId, body?.count);
  }

  // 10. GET /problems/:id/test-cases
  @SkipThrottle()
  @Get(':id/test-cases')
  async getTestCases(@Param('id') problemId: string) {
    return this.problemService.getTestCases(problemId);
  }

  // 11. DELETE /problems/test-cases/:testCaseId
  @Delete('test-cases/:testCaseId')
  async deleteTestCase(@Param('testCaseId') testCaseId: string) {
    return this.problemService.deleteTestCase(testCaseId);
  }

  // ── Submissions, Progress & Bookmarks ───────────────────────────────────────

  // 12. POST /problems/:id/submit — Rate: 10/min, auth required, strict security guard
  @Throttle({ submit: { limit: 10, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard, SubmitSecurityGuard)
  @Post(':id/submit')
  async submitSolution(
    @Param('id') problemId: string,
    @Body() body: SubmitProblemDto,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) throw new BadRequestException('Authenticated user required.');

    // Enforce memory limit in the DTO passed to judge
    const enrichedBody: SubmitProblemDto = {
      ...body,
      memoryLimitMb: Math.min(
        body.memoryLimitMb || EXECUTION_LIMITS.MAX_MEMORY_MB,
        EXECUTION_LIMITS.MAX_MEMORY_MB,
      ),
    };

    return this.problemService.submitSolution(problemId, userId, enrichedBody);
  }

  // 13. GET /problems/:id/submissions — Auth required
  @UseGuards(JwtAuthGuard)
  @Get(':id/submissions')
  async getProblemSubmissions(
    @Param('id') problemId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.problemService.getProblemSubmissions(problemId, userId);
  }

  // 14. POST /problems/:id/bookmark
  @Post(':id/bookmark')
  async toggleBookmark(
    @Param('id') problemId: string,
    @Request() req: any,
    @Body() body?: { userId?: string },
    @Query('userId') queryUserId?: string,
  ) {
    const userId = req.user?.sub || req.user?.id || body?.userId || queryUserId || 'demo-user-id';
    return this.problemService.toggleBookmark(problemId, userId);
  }

  // 15. POST /problems/:id/run — Rate: 20/min, execution security guard
  @Throttle({ run: { limit: 20, ttl: 60_000 } })
  @UseGuards(ExecutionSecurityGuard)
  @Post(':id/run')
  async runCode(
    @Param('id') problemId: string,
    @Body() body: { sourceCode: string; language?: string },
  ) {
    // Guard already validates sourceCode. Pass memory limit.
    const result = await this.problemService.runProblemCode(
      problemId,
      body.sourceCode,
      body.language,
    );

    // Truncate output to MAX_OUTPUT_BYTES if oversized
    if (result) {
      const truncate = (s: string | null | undefined) => {
        if (!s) return s;
        const bytes = Buffer.byteLength(s, 'utf8');
        if (bytes > EXECUTION_LIMITS.MAX_OUTPUT_BYTES) {
          return (
            s.slice(0, EXECUTION_LIMITS.MAX_OUTPUT_BYTES) +
            '\n[Output truncated: exceeded 100 KB limit]'
          );
        }
        return s;
      };

      if (result.results) {
        result.results = result.results.map((r: any) => ({
          ...r,
          actualOutput: truncate(r.actualOutput),
        }));
      }
    }

    return result;
  }
}
