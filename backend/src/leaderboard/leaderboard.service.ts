import { Injectable } from '@nestjs/common';
import { db } from '@/database';
import { LeaderboardEntryDTO } from '@/types';

@Injectable()
export class LeaderboardService {
  async getLeaderboard(timeframe: 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' = 'ALL_TIME'): Promise<LeaderboardEntryDTO[]> {
    const students = await db.student.findMany({
      take: 20,
      orderBy: { totalXp: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    return students.map((student: any, index: number) => ({
      id: student.id,
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      avatarUrl: student.user.avatarUrl || undefined,
      rank: index + 1,
      totalXp: student.totalXp,
    }));
  }
}
