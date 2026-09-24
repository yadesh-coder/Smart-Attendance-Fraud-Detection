import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  riskLevel?: RiskLevel | string | null;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ riskLevel, size = 'sm' }) => {
  if (!riskLevel) {
    const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
    return (
      <span
        className={`inline-flex items-center font-medium rounded border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 ${sizeClasses}`}
        aria-label="Risk Level: Not Available"
      >
        Not Available
      </span>
    );
  }

  const normalized = String(riskLevel).toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'HIGH':
      case 'CRITICAL':
        return 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'MEDIUM':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'LOW':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const label = normalized.charAt(0) + normalized.slice(1).toLowerCase();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-bold rounded border uppercase tracking-wider ${sizeClasses} ${getStyle()}`}
      aria-label={`Risk Level: ${label}`}
    >
      {label}
    </span>
  );
};
