import { Controller, Get, Post, Body } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { submitAnswerSchema } from '@/validation';

@Controller('assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Get()
  async getAssessments() {
    return this.assessmentService.getPublishedAssessments();
  }

  @Post('answer')
  async submitAnswer(@Body() body: any) {
    const validated = submitAnswerSchema.parse(body);
    // Dummy student ID for demo fallback
    return this.assessmentService.submitAnswer('demo-user-id', validated);
  }
}
