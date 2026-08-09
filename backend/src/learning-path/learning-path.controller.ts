import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { LearningPathService } from './learning-path.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '@/types';

@Controller('learning-path')
@UseGuards(JwtAuthGuard)
export class LearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}

  @Get()
  async getLearningPath(@Request() req: any) {
    return this.learningPathService.getLearningPath(req.user?.sub || req.user?.id);
  }

  @Get('levels/:levelId')
  async getLevel(@Param('levelId') levelId: string, @Request() req: any) {
    return this.learningPathService.getLevel(levelId, req.user?.sub || req.user?.id);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.TEACHER)
  @Get('teacher/overview')
  async getTeacherOverview(@Query('className') className?: string) {
    return this.learningPathService.getTeacherOverview(className || '1st Sem');
  }
}
