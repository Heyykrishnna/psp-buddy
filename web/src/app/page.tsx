'use client';

import React, { useState, useEffect } from 'react';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import { LeaderboardWidget } from '../components/LeaderboardWidget';
import { useRealtimeSync } from '../components/useRealtimeSync';
import { PSPBuddyApiClient } from '../lib/api-sdk';
import { SyncEventType, LeaderboardEntryDTO } from '../types';

const apiClient = new PSPBuddyApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

export default function Home() {
  const [isConnected, setIsConnected] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [xp, setXp] = useState(1250);
  const [streak, setStreak] = useState(5);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDTO[]>([
    { id: '1', studentId: 'demo-1', studentName: 'Alex Johnson', rank: 1, totalXp: 2450 },
    { id: '2', studentId: 'demo-user-id', studentName: 'You (Sync Active)', rank: 2, totalXp: 1250 },
    { id: '3', studentId: 'demo-3', studentName: 'Sophia Lee', rank: 3, totalXp: 980 },
    { id: '4', studentId: 'demo-4', studentName: 'Marcus Vance', rank: 4, totalXp: 850 },
    { id: '5', studentId: 'demo-5', studentName: 'Emily Chen', rank: 5, totalXp: 720 },
  ]);

  const syncPayload = useRealtimeSync(apiClient, SyncEventType.XP_UPDATED);

  useEffect(() => {
    if (syncPayload) {
      setLastSyncedAt(new Date());
      if (syncPayload.data && typeof syncPayload.data === 'object' && 'newTotalXp' in syncPayload.data) {
        const newXp = (syncPayload.data as any).newTotalXp;
        setXp(newXp);
        setLeaderboard((prev) =>
          prev
            .map((entry) => (entry.studentId === 'demo-user-id' ? { ...entry, totalXp: newXp } : entry))
            .sort((a, b) => b.totalXp - a.totalXp)
            .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
        );
      }
    }
  }, [syncPayload]);

  const simulateEarnXP = () => {
    const added = 50;
    const newXp = xp + added;
    setXp(newXp);
    setLastSyncedAt(new Date());

    setLeaderboard((prev) =>
      prev
        .map((entry) => (entry.studentId === 'demo-user-id' ? { ...entry, totalXp: newXp } : entry))
        .sort((a, b) => b.totalXp - a.totalXp)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
    );
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header Bar */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
            paddingBottom: '20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#38bdf8' }}>PSP Buddy Web Portal</h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Synchronized Learning & Assessment Platform
            </p>
          </div>
          <SyncStatusBadge isConnected={isConnected} lastSyncedAt={lastSyncedAt} />
        </header>

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Card 1: Stats */}
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <h2 style={{ fontSize: '20px', margin: '0 0 16px 0', color: '#f1f5f9' }}>⚡ Your Synchronized Stats</h2>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#0f172a',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #38bdf8',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>TOTAL XP</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>{xp} XP</div>
              </div>

              <div
                style={{
                  flex: 1,
                  backgroundColor: '#0f172a',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #f59e0b',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>CURRENT STREAK</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                  🔥 {streak} Days
                </div>
              </div>
            </div>

            <button
              onClick={simulateEarnXP}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              + Solve Practice Quiz (+50 XP)
            </button>
          </div>

          {/* Card 2: Synchronized Leaderboard Widget */}
          <LeaderboardWidget entries={leaderboard} currentUserId="demo-user-id" />
        </div>
      </div>
    </main>
  );
}
