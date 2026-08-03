import { Module } from '@nestjs/common';
import { JudgeProvider } from './provider';
import { Judge0Provider } from './providers/judge0';

@Module({
  providers: [
    {
      provide: JudgeProvider,
      useClass: Judge0Provider,
    },
  ],
  exports: [JudgeProvider],
})
export class JudgeModule {}
