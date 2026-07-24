import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(@Query('timeframe') timeframe?: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME') {
    return this.leaderboardService.getLeaderboard(timeframe || 'ALL_TIME');
  }
}
