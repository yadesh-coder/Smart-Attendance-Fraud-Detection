import React from 'react';
import { VerificationSignalStatus } from '../../types';
import { CheckCircle2, XCircle, ShieldAlert, Clock } from 'lucide-react';

interface VerificationStatusProps {
  status?: VerificationSignalStatus | string | null;
  size?: 'sm' | 'md';
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({ status = 'PENDING', size = 'sm' }) => {
  const normalized = (status || 'PENDING').toUpperCase();

  const getConfig = () => {
    switch (normalized) {
      case 'VERIFIED':
        return {
          label: 'Verified',
          icon: CheckCircle2,
          className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'SUSPICIOUS':
        return {
          label: 'Suspicious',
          icon: ShieldAlert,
          className: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'FAILED':
        return {
          label: 'Failed',
          icon: XCircle,
          className: 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
        };
      case 'PENDING':
      default:
        return {
          label: 'Pending',
          icon: Clock,
          className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center space-x-1 font-semibold rounded border ${sizeClasses} ${config.className}`}
      aria-label={`Verification Status: ${config.label}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
