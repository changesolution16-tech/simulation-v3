'use client';

import React, { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

type TimerType = 'none' | 'elapsed' | 'countdown';

interface DecisionTimerProps {
  startTime: number;
  timerType: TimerType;
  timerLimitSeconds?: number;
  timerWarningThresholdSeconds?: number;
  visible?: boolean;
  onTimeExpired?: () => void;
  compact?: boolean;
}

export const DecisionTimer: React.FC<DecisionTimerProps> = ({
  startTime,
  timerType,
  timerLimitSeconds,
  timerWarningThresholdSeconds = 30,
  visible = true,
  onTimeExpired,
  compact = false
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);

      if (timerType === 'countdown' && timerLimitSeconds) {
        const remaining = timerLimitSeconds - elapsed;
        if (remaining <= 0 && onTimeExpired) {
          onTimeExpired();
          clearInterval(interval);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, timerType, timerLimitSeconds, onTimeExpired]);

  if (!visible || timerType === 'none') {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = (): number => {
    if (timerType === 'countdown' && timerLimitSeconds) {
      return Math.max(0, timerLimitSeconds - elapsedSeconds);
    }
    return elapsedSeconds;
  };

  const displayTime = getDisplayTime();
  const isWarning = timerType === 'countdown' &&
                    timerLimitSeconds &&
                    displayTime <= timerWarningThresholdSeconds &&
                    displayTime > 0;
  const isExpired = timerType === 'countdown' && displayTime === 0;

  const getTimerColor = (): string => {
    if (isExpired) return 'text-red-600 bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700';
    if (isWarning) return 'text-orange-600 bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700';
    if (timerType === 'countdown') return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700';
    return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getTimerColor()} transition-colors duration-300`}>
        {isWarning || isExpired ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
        <span className="text-sm font-semibold">
          {formatTime(displayTime)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${getTimerColor()} transition-all duration-300`}>
      {isWarning || isExpired ? (
        <AlertCircle className="w-5 h-5" />
      ) : (
        <Clock className="w-5 h-5" />
      )}
      <div className="flex flex-col">
        <span className="text-xs font-medium opacity-75">
          {timerType === 'countdown' ? 'Time Remaining' : 'Time Elapsed'}
        </span>
        <span className="text-lg font-bold">
          {formatTime(displayTime)}
        </span>
      </div>
      {isExpired && (
        <span className="ml-2 text-xs font-medium">
          Time&apos;s up!
        </span>
      )}
    </div>
  );
};

export const getElapsedSeconds = (startTime: number): number => {
  return Math.floor((Date.now() - startTime) / 1000);
};
