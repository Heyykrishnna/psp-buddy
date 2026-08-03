import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
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
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    AiModule,
    MailModule,
    ProblemModule,
  ],
  controllers: [AssessmentController, LeaderboardController, AnalyticsController],
  providers: [SyncGateway, AssessmentService, LeaderboardService, AnalyticsService],
})
export class AppModule { }
