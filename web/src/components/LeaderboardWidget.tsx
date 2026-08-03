'use client';

import React from 'react';
import { LeaderboardEntryDTO } from '../types';

export interface LeaderboardWidgetProps {
  entries: LeaderboardEntryDTO[];
  currentUserId?: string;
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({ entries, currentUserId }) => {
  return (
    <div>
      <h3 className="font-serif text-xl font-normal text-[#111111] mb-6 flex items-center gap-2">
        🏆 Live Synchronized Leaderboard
      </h3>
      <div className="flex flex-col gap-2.5">
        {entries.slice(0, 5).map((entry) => {
          const isCurrentUser = entry.studentId === currentUserId;
          return (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${
                isCurrentUser
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-[#F4F4F6] text-zinc-800 border-transparent hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-xs font-bold w-6 ${
                    isCurrentUser
                      ? 'text-white'
                      : entry.rank === 1
                      ? 'text-amber-600'
                      : entry.rank === 2
                      ? 'text-zinc-500'
                      : 'text-zinc-400'
                  }`}
                >
                  #{entry.rank}
                </span>
                <span className={`text-xs ${isCurrentUser ? 'font-bold' : 'font-medium'}`}>
                  {entry.studentName}
                </span>
              </div>
              <div
                className={`font-mono text-xs font-semibold ${
                  isCurrentUser ? 'text-white' : 'text-zinc-900'
                }`}
              >
                {entry.totalXp} XP
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
