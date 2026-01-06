import { useState, useEffect } from 'react';
import { connectionMonitor, ConnectionStatus } from '../lib/connectionMonitor';

export interface OfflineMode {
  isOffline: boolean;
  isOnline: boolean;
  isDegraded: boolean;
  canUseDatabase: boolean;
  canUseExternalServices: boolean;
  status: ConnectionStatus;
}

export function useOfflineMode(): OfflineMode {
  const [status, setStatus] = useState<ConnectionStatus>('checking');

  useEffect(() => {
    const unsubscribe = connectionMonitor.subscribe((state) => {
      setStatus(state.status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isOffline: status === 'disconnected',
    isOnline: status === 'connected',
    isDegraded: status === 'degraded',
    canUseDatabase: status === 'connected' || status === 'degraded',
    canUseExternalServices: status === 'connected',
    status
  };
}

export function useFeatureFlag(featureName: string): boolean {
  const offlineMode = useOfflineMode();

  const offlineDisabledFeatures = [
    'video-streaming',
    'real-time-analytics',
    'live-collaboration',
    'external-integrations'
  ];

  const degradedDisabledFeatures = [
    'real-time-analytics',
    'live-collaboration'
  ];

  if (offlineMode.isOffline) {
    return !offlineDisabledFeatures.includes(featureName);
  }

  if (offlineMode.isDegraded) {
    return !degradedDisabledFeatures.includes(featureName);
  }

  return true;
}
