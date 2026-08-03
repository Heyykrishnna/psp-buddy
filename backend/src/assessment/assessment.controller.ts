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

  // 10. POST /assessments/:id/workbook/upload - Student Upload Solved Workbook
  @Post('assessments/:id/workbook/upload')
  async uploadWorkbook(
    @Param('id') assessmentId: string,
    @Body() body: { studentId?: string; fileUrl: string; fileName?: string },
  ) {
    const studentId = body?.studentId || 'demo-student-id';
    return this.assessmentService.submitWorkbook(assessmentId, studentId, body.fileUrl, body.fileName);
  }

  // 11. GET /assessments/:id/workbooks - Teacher View Submissions
  @Get('assessments/:id/workbooks')
  async getAssessmentWorkbooks(@Param('id') assessmentId: string) {
    return this.assessmentService.getAssessmentWorkbooks(assessmentId);
  }

  // 12. GET /students/:studentId/workbooks - Student View Workbooks
  @Get('students/:studentId/workbooks')
  async getStudentWorkbooks(@Param('studentId') studentId: string) {
    return this.assessmentService.getStudentWorkbooks(studentId);
  }

  // 13. PATCH /workbooks/:id/evaluate - Teacher Grade/Override
  @Patch('workbooks/:id/evaluate')
  async evaluateWorkbook(
    @Param('id') workbookId: string,
    @Body() body: { obtainedMarks: number; feedback?: string },
  ) {
    return this.assessmentService.evaluateWorkbook(workbookId, body.obtainedMarks, body.feedback);
  }

  // 14. GET /assessments/:id/results - Teacher View All Student Attempts & Analytics
  @Get('assessments/:id/results')
  async getAssessmentResults(@Param('id') assessmentId: string) {
    return this.assessmentService.getAssessmentResults(assessmentId);
  }

  // 15. GET /students/:studentId/attempts - List All Student Completed Attempts
  @Get('students/:studentId/attempts')
  async getStudentAttempts(@Param('studentId') studentId: string) {
    return this.assessmentService.getStudentAttempts(studentId);
  }
}
