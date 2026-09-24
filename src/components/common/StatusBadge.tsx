import React from 'react';

export type StatusBadgeType =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'VERIFIED'
  | 'FAILED'
  | 'PENDING'
  | 'HIGH'
  | 'CRITICAL'
  | 'MEDIUM'
  | 'LOW'
  | 'LIVE'
  | 'COMPLETED'
  | 'REGISTERED'
  | 'UNRECOGNIZED'
  | 'PRESENT'
  | 'ABSENT'
  | 'FLAGGED';

interface StatusBadgeProps {
  status: StatusBadgeType | string;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'sm' }) => {
  const displayLabel = label || status.replace(/_/g, ' ');

  const getStyle = (s: string) => {
    switch (s.toUpperCase()) {
      case 'ACTIVE':
      case 'VERIFIED':
      case 'REGISTERED':
      case 'PRESENT':
      case 'COMPLETED':
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';

      case 'LIVE':
      case 'MEDIUM':
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';

      case 'INACTIVE':
      case 'FAILED':
      case 'UNRECOGNIZED':
      case 'ABSENT':
      case 'HIGH':
      case 'CRITICAL':
      case 'FLAGGED':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';

      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-md border tracking-tight uppercase ${sizeClass} ${getStyle(status)}`}>
      {status === 'LIVE' && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
      )}
      {displayLabel}
    </span>
  );
};
