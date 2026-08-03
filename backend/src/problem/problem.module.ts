import { Module } from '@nestjs/common';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import { AiModule } from '@/ai/ai.module';
import { JudgeModule } from '@/judge/judge.module';

@Module({
  imports: [AiModule, JudgeModule],
  controllers: [ProblemController],
  providers: [ProblemService],
  exports: [ProblemService],
})
export class ProblemModule {}
