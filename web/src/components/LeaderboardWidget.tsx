'use client';

import React from 'react';
import { LeaderboardEntryDTO } from '../types';

export interface LeaderboardWidgetProps {
  entries: LeaderboardEntryDTO[];
  currentUserId?: string;
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({ entries, currentUserId }) => {
  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '20px',
        background: 'linear-gradient(135deg, #1e1e2e 0%, #11111b 100%)',
        color: '#cdd6f4',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f5c2e7', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🏆 Live Synchronized Leaderboard
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {entries.slice(0, 5).map((entry) => {
          const isCurrentUser = entry.studentId === currentUserId;
          return (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: isCurrentUser ? 'rgba(203, 166, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: isCurrentUser ? '1px solid #cba6f7' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '14px',
                    width: '24px',
                    color: entry.rank === 1 ? '#f9e2af' : entry.rank === 2 ? '#bac2de' : entry.rank === 3 ? '#fab387' : '#a6adc8',
                  }}
                >
                  #{entry.rank}
                </span>
                <span style={{ fontWeight: isCurrentUser ? 700 : 500 }}>{entry.studentName}</span>
              </div>
              <div style={{ fontWeight: 700, color: '#a6e3a1', fontSize: '14px' }}>{entry.totalXp} XP</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
