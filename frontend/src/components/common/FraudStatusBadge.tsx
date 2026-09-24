import React from 'react';
import { FraudStatus } from '../../types';
import { ShieldCheck, ShieldAlert, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface FraudStatusBadgeProps {
  status?: FraudStatus | string | null;
  size?: 'sm' | 'md';
}

export const FraudStatusBadge: React.FC<FraudStatusBadgeProps> = ({ status = 'PENDING', size = 'sm' }) => {
  const normalized = (status || 'PENDING').toUpperCase();

  const getBadgeConfig = () => {
    switch (normalized) {
      case 'SAFE':
        return {
          label: 'Safe',
          icon: ShieldCheck,
          className: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'SUSPICIOUS':
        return {
          label: 'Suspicious',
          icon: ShieldAlert,
          className: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'HIGH_RISK':
        return {
          label: 'High Risk',
          icon: AlertTriangle,
          className: 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
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
          label: 'Pending Review',
          icon: Clock,
          className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center space-x-1 font-bold rounded-md border tracking-tight ${sizeClasses} ${config.className}`}
      aria-label={`Fraud status: ${config.label}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
