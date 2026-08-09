import { Controller, Get, Param, Query } from '@nestjs/common';
import { LearningPathService } from './learning-path.service';

@Controller('learning-path')
export class LearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}

  @Get()
  async getLearningPath(@Query('studentId') studentId?: string) {
    return this.learningPathService.getLearningPath(studentId);
  }

  @Get('levels/:levelId')
  async getLevel(@Param('levelId') levelId: string, @Query('studentId') studentId?: string) {
    return this.learningPathService.getLevel(levelId, studentId);
  }

  @Get('teacher/overview')
  async getTeacherOverview(@Query('className') className?: string) {
    return this.learningPathService.getTeacherOverview(className || '1st Sem');
  }
}

