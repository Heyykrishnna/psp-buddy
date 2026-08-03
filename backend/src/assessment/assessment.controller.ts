import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { AssessmentService, CreateAssessmentDto, AutosaveAnswerDto } from './assessment.service';

@Controller()
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  // 1. POST /assessments - Create Assessment
  @Post('assessments')
  async createAssessment(@Body() body: CreateAssessmentDto) {
    return this.assessmentService.createAssessment(body);
  }

  // 2. GET /assessments - List Assessments
  @Get('assessments')
  async getAssessments(
    @Query('className') className?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    const isPublishedBool = isPublished === undefined ? undefined : isPublished === 'true';
    return this.assessmentService.getAssessments({ className, isPublished: isPublishedBool });
  }

  // 3. GET /assessments/:id - Get Assessment Details & Questions
  @Get('assessments/:id')
  async getAssessmentById(@Param('id') id: string) {
    return this.assessmentService.getAssessmentById(id);
  }

  // 4. PATCH /assessments/:id - Update Assessment Config
  @Patch('assessments/:id')
  async updateAssessment(@Param('id') id: string, @Body() body: Partial<CreateAssessmentDto>) {
    return this.assessmentService.updateAssessment(id, body);
  }

  // 5. POST /assessments/:id/publish - Publish Assessment & Notify
  @Post('assessments/:id/publish')
  async publishAssessment(@Param('id') id: string) {
    return this.assessmentService.publishAssessment(id);
  }

  // 6. POST /assessments/:id/attempts - Start Attempt
  @Post('assessments/:id/attempts')
  async startAttempt(@Param('id') assessmentId: string, @Body() body: { studentId?: string }) {
    const studentId = body?.studentId || 'demo-student-id';
    return this.assessmentService.startAttempt(assessmentId, studentId);
  }

  // 7. PATCH /attempts/:id/answers - Autosave Answer to PostgreSQL
  @Patch('attempts/:id/answers')
  async autosaveAnswer(@Param('id') attemptId: string, @Body() body: AutosaveAnswerDto) {
    return this.assessmentService.autosaveAnswer(attemptId, body);
  }

  // 8. POST /attempts/:id/submit - Submit Attempt & Evaluate
  @Post('attempts/:id/submit')
  async submitAttempt(@Param('id') attemptId: string) {
    return this.assessmentService.submitAttempt(attemptId);
  }

  // 9. GET /attempts/:id/result - View Result & Topic Analysis
  @Get('attempts/:id/result')
  async getAttemptResult(@Param('id') attemptId: string) {
    return this.assessmentService.getAttemptResult(attemptId);
  }
}
