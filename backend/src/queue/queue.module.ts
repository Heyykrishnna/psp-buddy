import { Module } from '@nestjs/common';
import { ExecutionQueueService } from './execution-queue.service';
import { JudgeModule } from '@/judge/judge.module';

@Module({
  imports: [JudgeModule],
  providers: [ExecutionQueueService],
  exports: [ExecutionQueueService],
})
export class QueueModule {}
