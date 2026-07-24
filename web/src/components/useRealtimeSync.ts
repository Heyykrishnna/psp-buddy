'use client';

import { useState, useEffect } from 'react';
import { PSPBuddyApiClient } from '../lib/api-sdk';
import { SyncEventType, SyncEventPayload } from '../types';

export function useRealtimeSync(apiClient: PSPBuddyApiClient, event: SyncEventType) {
  const [lastPayload, setLastPayload] = useState<SyncEventPayload | null>(null);

  useEffect(() => {
    const unsubscribe = apiClient.subscribeSync(event, (payload: SyncEventPayload) => {
      setLastPayload(payload);
    });
    return unsubscribe;
  }, [apiClient, event]);

  return lastPayload;
}
