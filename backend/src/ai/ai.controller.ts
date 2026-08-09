import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import {
  AiService,
  GenerateAssessmentAiDto,
  ExplainQuestionAiDto,
  GenerateStudyPlanAiDto,
  TutorChatAiDto,
} from './ai.service';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly chatService: ChatService,
  ) {}

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
  async chatTutor(
    @Req() req: any,
    @Body() dto: TutorChatAiDto & { userId?: string; sessionId?: string },
  ) {
    const userId = req.user?.sub || req.user?.id || dto.userId;
    return this.chatService.sendMessage(userId, dto.sessionId, dto.message, dto.topic);
  }
}
