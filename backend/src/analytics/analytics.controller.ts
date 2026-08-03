import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ── Student Analytics ──────────────────────────────────────────────────────

  /**
   * GET /analytics/student/me
   * Current student's overview (XP, streak, accuracy, topic counts)
   */
  @UseGuards(JwtAuthGuard)
  @Get('student/me')
  async getStudentOverview(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.analyticsService.getStudentOverview(userId);
  }

  /**
   * GET /analytics/student/topics
   * Topic mastery breakdown — powers the mastery bar chart
   */
  @UseGuards(JwtAuthGuard)
  @Get('student/topics')
  async getStudentTopicMastery(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.analyticsService.getStudentTopicMastery(userId);
  }

  /**
   * GET /analytics/student/performance
   * Assessment history + score trend line data
   */
  @UseGuards(JwtAuthGuard)
  @Get('student/performance')
  async getStudentPerformance(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.analyticsService.getStudentPerformance(userId);
  }

  // ── Class Analytics (Teacher View) ────────────────────────────────────────

  /**
   * GET /analytics/classes/:id
   * Class-level summary — total assessments, average score, etc.
   */
  @Get('classes/:id')
  async getClassOverview(@Param('id') className: string) {
    return this.analyticsService.getClassOverview(className);
  }

  /**
   * GET /analytics/classes/:id/topics
   * Aggregate topic mastery across all students in a class
   */
  @Get('classes/:id/topics')
  async getClassTopics(@Param('id') className: string) {
    return this.analyticsService.getClassTopicBreakdown(className);
  }

  /**
   * GET /analytics/classes/:id/students
   * Per-student mastery rankings for a class (teacher view)
   */
  @Get('classes/:id/students')
  async getClassStudents(@Param('id') className: string) {
    return this.analyticsService.getClassStudentRankings(className);
  }
}
