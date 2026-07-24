'use client';

import React, { useState, useEffect } from 'react';

export interface SyncStatusBadgeProps {
  isConnected: boolean;
  lastSyncedAt?: Date;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ isConnected, lastSyncedAt }) => {
  const [timeLabel, setTimeLabel] = useState<string | null>(null);

  useEffect(() => {
    if (lastSyncedAt) {
      setTimeLabel(lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [lastSyncedAt]);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        color: isConnected ? '#16a34a' : '#dc2626',
        border: `1px solid ${isConnected ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isConnected ? '#22c55e' : '#ef4444',
          boxShadow: isConnected ? '0 0 8px #22c55e' : 'none',
        }}
      />
      {isConnected ? 'Synced with App & Web' : 'Sync Disconnected'}
      {timeLabel && (
        <span style={{ opacity: 0.75, fontSize: '11px' }}>
          • {timeLabel}
        </span>
      )}
    </div>
  );
};
