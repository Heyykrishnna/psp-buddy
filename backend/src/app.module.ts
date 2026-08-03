import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { MailModule } from './mail/mail.module';
import { ProblemModule } from './problem/problem.module';
import { AssessmentController } from './assessment/assessment.controller';
import { AssessmentService } from './assessment/assessment.service';
import { LeaderboardController } from './leaderboard/leaderboard.controller';
import { LeaderboardService } from './leaderboard/leaderboard.service';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { SyncGateway } from './gateway/sync.gateway';

@Module({
  imports: [
    // Named throttlers: 'default' (global), 'run', 'submit'
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,    // 1 minute window
        limit: 100,     // 100 requests per minute (global default)
      },
      {
        name: 'run',
        ttl: 60_000,
        limit: 20,      // 20 run requests per minute per IP/user
      },
      {
        name: 'submit',
        ttl: 60_000,
        limit: 10,      // 10 submissions per minute per IP/user
      },
    ]),
    AuthModule,
    AiModule,
    MailModule,
    ProblemModule,
  ],
  controllers: [AssessmentController, LeaderboardController, AnalyticsController],
  providers: [
    SyncGateway,
    AssessmentService,
    LeaderboardService,
    AnalyticsService,
    // Apply ThrottlerGuard globally to ALL routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
