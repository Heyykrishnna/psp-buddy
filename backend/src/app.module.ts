import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { MailModule } from './mail/mail.module';
import { ProblemModule } from './problem/problem.module';
import { CompetitiveModule } from './competitive/competitive.module';
import { AssessmentController } from './assessment/assessment.controller';
import { AssessmentService } from './assessment/assessment.service';
import { LeaderboardController } from './leaderboard/leaderboard.controller';
import { LeaderboardService } from './leaderboard/leaderboard.service';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { SyncGateway } from './gateway/sync.gateway';
import { LearningPathController } from './learning-path/learning-path.controller';
import { LearningPathService } from './learning-path/learning-path.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: Number(process.env.THROTTLE_DEFAULT_TTL || 60_000), limit: Number(process.env.THROTTLE_DEFAULT_LIMIT || 100) },
      { name: 'run', ttl: Number(process.env.THROTTLE_RUN_TTL || 60_000), limit: Number(process.env.THROTTLE_RUN_LIMIT || 20) },
      { name: 'submit', ttl: Number(process.env.THROTTLE_SUBMIT_TTL || 60_000), limit: Number(process.env.THROTTLE_SUBMIT_LIMIT || 10) },
    ]),
    AuthModule,
    AiModule,
    MailModule,
    ProblemModule,
    CompetitiveModule,
  ],
  controllers: [AssessmentController, LeaderboardController, AnalyticsController, LearningPathController],
  providers: [
    SyncGateway,
    AssessmentService,
    LeaderboardService,
    AnalyticsService,
    LearningPathService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }
