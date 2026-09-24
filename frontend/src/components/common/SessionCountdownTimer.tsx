import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export interface SessionCountdownTimerProps {
  endAt?: string;
  expiresAt?: string;
  endTime?: string;
  sessionDate?: string;
  status?: string;
  onExpire?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const SessionCountdownTimer: React.FC<SessionCountdownTimerProps> = ({
  endAt,
  expiresAt,
  endTime,
  sessionDate,
  status = 'LIVE',
  onExpire,
  size = 'md',
  showLabel = true,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const parseTargetEpoch = (): number | null => {
      // 1. Try absolute ISO string endAt or expiresAt (e.g. "2026-09-22T22:52:12+05:30")
      const isoTarget = endAt || expiresAt;
      if (isoTarget) {
        const parsed = new Date(isoTarget).getTime();
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }

      // 2. Fallback to endTime / sessionDate
      if (endTime) {
        if (endTime.includes('T')) {
          const parsed = new Date(endTime).getTime();
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }

        const dateStr = sessionDate || new Date().toISOString().split('T')[0];
        const combined = `${dateStr}T${endTime.length === 5 ? endTime + ':00' : endTime}`;
        const parsed = new Date(combined).getTime();
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }

      return null;
    };

    const updateTimer = () => {
      const targetEpochMs = parseTargetEpoch();
      if (targetEpochMs === null) {
        setRemainingSeconds(null);
        return;
      }

      const diffMs = targetEpochMs - Date.now();
      const diffSec = Math.floor(diffMs / 1000);

      if (diffSec <= 0) {
        setRemainingSeconds(0);
        setIsExpired(true);
        if (onExpire && !isExpired) {
          onExpire();
        }
      } else {
        setRemainingSeconds(diffSec);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, endTime, sessionDate, status]);

  if (status === 'CLOSED' || status === 'COMPLETED' || isExpired || (remainingSeconds !== null && remainingSeconds <= 0)) {
    return (
      <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-bold text-xs animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
        <span>SESSION EXPIRED</span>
      </div>
    );
  }

  if (remainingSeconds === null) {
    return null;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isWarning = remainingSeconds < 300; // Less than 5 minutes remaining

  const sizeClasses =
    size === 'lg'
      ? 'text-3xl tracking-widest font-extrabold px-4 py-2'
      : size === 'sm'
      ? 'text-xs px-2.5 py-1'
      : 'text-sm font-bold px-3 py-1.5';

  return (
    <div className="flex flex-col items-center">
      {showLabel && (
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Time Remaining</span>
      )}
      <div
        className={`inline-flex items-center space-x-2 rounded-xl font-mono border transition-all ${sizeClasses} ${
          isWarning
            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 animate-pulse'
            : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
        }`}
      >
        <Clock className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <span>{formattedTime}</span>
      </div>
    </div>
  );
};
