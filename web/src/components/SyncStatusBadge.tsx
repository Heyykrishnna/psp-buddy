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
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-[#F4F4F6] text-xs font-medium text-zinc-800">
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      />
      <span>{isConnected ? 'Synced with App & Web' : 'Sync Offline'}</span>
      {timeLabel && <span className="text-zinc-400 font-mono text-[11px]">• {timeLabel}</span>}
    </div>
  );
};
