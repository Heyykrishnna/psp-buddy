import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  AiService,
  GenerateAssessmentAiDto,
  ExplainQuestionAiDto,
  GenerateStudyPlanAiDto,
  TutorChatAiDto,
} from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-assessment')
  async generateAssessment(@Body() dto: GenerateAssessmentAiDto) {
    return this.aiService.generateAssessment(dto);
  }

  @Post('explain-question')
  async explainQuestion(@Body() dto: ExplainQuestionAiDto) {
    return this.aiService.explainQuestion(dto);
  }

  @Post('generate-study-plan')
  async generateStudyPlan(@Body() dto: GenerateStudyPlanAiDto) {
    return this.aiService.generateStudyPlan(dto);
  }

  @Post('tutor-chat')
  async chatTutor(@Body() dto: TutorChatAiDto) {
    return this.aiService.chatTutor(dto);
  }
}
