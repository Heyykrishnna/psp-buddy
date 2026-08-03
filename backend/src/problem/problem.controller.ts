import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ProblemService } from './problem.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { SubmitProblemDto } from './dto/submit-problem.dto';
import { DifficultyLevel } from '@/types';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  // 1. POST /problems - Create Problem
  @Post()
  async createProblem(@Body() body: CreateProblemDto) {
    return this.problemService.createProblem(body);
  }

  // 2. GET /problems - List Problems with filters & progress indicators
  @Get()
  async getProblems(
    @Query('difficulty') difficulty?: DifficultyLevel,
    @Query('topic') topic?: string,
    @Query('search') search?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: 'SOLVED' | 'ATTEMPTED' | 'UNATTEMPTED',
    @Query('bookmarked') bookmarked?: string,
  ) {
    const isBookmarked =
      bookmarked === 'true' ? true : bookmarked === 'false' ? false : undefined;

    return this.problemService.getProblems({
      difficulty,
      topic,
      search,
      userId,
      status,
      bookmarked: isBookmarked,
    });
  }

  // 3. GET /problems/user/progress - Get User Progress across Problems
  @UseGuards(JwtAuthGuard)
  @Get('user/progress')
  async getUserProgress(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id || 'demo-user-id';
    return this.problemService.getUserProgress(userId);
  }

  // 4. GET /problems/user/bookmarks - Get User Bookmarked Problems
  @UseGuards(JwtAuthGuard)
  @Get('user/bookmarks')
  async getUserBookmarks(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id || 'demo-user-id';
    return this.problemService.getUserBookmarks(userId);
  }

  // 5. GET /problems/:slugOrId - Get Problem by Slug or ID
  @Get(':slugOrId')
  async getProblemBySlugOrId(@Param('slugOrId') slugOrId: string) {
    return this.problemService.getProblemBySlugOrId(slugOrId);
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

  // ── Test Cases API ─────────────────────────────────────────────────────────

  // 8. POST /problems/:id/test-cases - Add Test Case Manually
  @Post(':id/test-cases')
  async createTestCase(
    @Param('id') problemId: string,
    @Body() body: CreateTestCaseDto,
  ) {
    return this.problemService.createTestCase({
      ...body,
      problemId,
    });
  }

  // 9. POST /problems/:id/test-cases/generate - AI Generate Test Cases
  @Post(':id/test-cases/generate')
  async generateAiTestCases(
    @Param('id') problemId: string,
    @Body() body: { count?: number },
  ) {
    return this.problemService.generateAiTestCases(problemId, body?.count);
  }

  // 10. GET /problems/:id/test-cases - Get Test Cases for a Problem
  @Get(':id/test-cases')
  async getTestCases(@Param('id') problemId: string) {
    return this.problemService.getTestCases(problemId);
  }

  // 11. DELETE /problems/test-cases/:testCaseId - Delete a Test Case
  @Delete('test-cases/:testCaseId')
  async deleteTestCase(@Param('testCaseId') testCaseId: string) {
    return this.problemService.deleteTestCase(testCaseId);
  }

  // ── Submissions, Progress & Bookmarks API ───────────────────────────────

  // 12. POST /problems/:id/submit - Submit Solution to Problem
  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  async submitSolution(
    @Param('id') problemId: string,
    @Body() body: SubmitProblemDto,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id || body.userId || 'demo-user-id';
    return this.problemService.submitSolution(problemId, userId, body);
  }

  // 13. GET /problems/:id/submissions - Get Submissions for Problem
  @UseGuards(JwtAuthGuard)
  @Get(':id/submissions')
  async getProblemSubmissions(
    @Param('id') problemId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id || 'demo-user-id';
    return this.problemService.getProblemSubmissions(problemId, userId);
  }

  // 14. POST /problems/:id/bookmark - Toggle Problem Bookmark
  @UseGuards(JwtAuthGuard)
  @Post(':id/bookmark')
  async toggleBookmark(
    @Param('id') problemId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id || 'demo-user-id';
    return this.problemService.toggleBookmark(problemId, userId);
  }
}
