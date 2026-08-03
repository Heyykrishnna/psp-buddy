import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CompetitiveService } from './competitive.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('competitive')
export class CompetitiveController {
  constructor(private readonly competitiveService: CompetitiveService) {}

  // ── Daily Challenge ────────────────────────────────────────────────────────
  @SkipThrottle()
  @Get('daily-challenge')
  async getDailyChallenge() {
    return this.competitiveService.getTodayChallenge();
  }

  @UseGuards(JwtAuthGuard)
  @Post('daily-challenge/complete')
  async completeDailyChallenge(@Request() req: any) {
    const studentId = req.user?.studentId || req.user?.sub;
    return this.competitiveService.completeDailyChallenge(studentId);
  }

  // ── Weekly Challenge ───────────────────────────────────────────────────────
  @SkipThrottle()
  @Get('weekly-challenge')
  async getWeeklyChallenge() {
    return this.competitiveService.getCurrentWeeklyChallenge();
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────
  @SkipThrottle()
  @Get('leaderboard')
  async getLeaderboard(
    @Query('timeframe') timeframe: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' = 'ALL_TIME',
    @Query('limit') limit?: string,
  ) {
    return this.competitiveService.getLeaderboard(timeframe, limit ? Number(limit) : 50);
  }

  // ── Contests ───────────────────────────────────────────────────────────────
  @SkipThrottle()
  @Get('contests')
  async getContests(@Query('status') status?: string) {
    return this.competitiveService.getContests(status);
  }

  @SkipThrottle()
  @Get('contests/:id')
  async getContest(@Param('id') id: string) {
    return this.competitiveService.getContest(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('contests/:id/register')
  async registerForContest(@Param('id') contestId: string, @Request() req: any) {
    const studentId = req.user?.studentId || req.user?.sub;
    return this.competitiveService.registerForContest(contestId, studentId);
  }

  // ── Achievements ───────────────────────────────────────────────────────────
  @SkipThrottle()
  @Get('achievements')
  async getAllAchievements() {
    return this.competitiveService.seedAchievements().then(() =>
      require('@/database').db.achievement.findMany({ orderBy: { category: 'asc' } }),
    );
  }

  // ── Student Profile ────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getMyProfile(@Request() req: any) {
    const studentId = req.user?.studentId || req.user?.sub;
    return this.competitiveService.getStudentCompetitiveProfile(studentId);
  }

  @SkipThrottle()
  @Get('profile/:studentId')
  async getProfile(@Param('studentId') studentId: string) {
    return this.competitiveService.getStudentCompetitiveProfile(studentId);
  }
}
