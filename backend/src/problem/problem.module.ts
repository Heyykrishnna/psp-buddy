import { Module } from '@nestjs/common';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import { AiModule } from '@/ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [ProblemController],
  providers: [ProblemService],
  exports: [ProblemService],
})
export class ProblemModule {}
