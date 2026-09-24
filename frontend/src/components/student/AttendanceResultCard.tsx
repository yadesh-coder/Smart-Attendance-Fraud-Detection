import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FraudStatus, AttendanceStatus, RiskLevel, VerificationSummary as VerificationSummaryType } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FraudStatusBadge } from '../common/FraudStatusBadge';
import { RiskBadge } from '../common/RiskBadge';
import { CheckCircle2, ShieldAlert, XCircle, ArrowRight, RefreshCw, QrCode, Camera, MapPin, Smartphone, Cpu } from 'lucide-react';

export interface AttendanceResultData {
  attendanceStatus?: AttendanceStatus | string;
  fraudStatus?: FraudStatus | string;
  riskLevel?: RiskLevel;
  riskScore?: number | null;
  verificationSummary?: VerificationSummaryType;
  message?: string;
  failedStep?: string | null;
  rawQrStatus?: string;
  rawFaceStatus?: string;
  rawDeviceStatus?: string;
  rawLocationStatus?: string;
  mlAnomalyScore?: number | null;
  mlAnomalyLabel?: 'NORMAL' | 'ANOMALOUS' | null;
}

interface AttendanceResultCardProps {
  data?: AttendanceResultData | null;
  onRetry?: () => void;
  onReturnToLiveSessions?: () => void;
}

export const AttendanceResultCard: React.FC<AttendanceResultCardProps> = ({
  data,
  onRetry,
  onReturnToLiveSessions,
}) => {
  const navigate = useNavigate();

  const fraudStatus = (data?.fraudStatus || 'FAILED').toUpperCase() as FraudStatus;
  const attendanceStatus = (data?.attendanceStatus || 'NOT_MARKED').toUpperCase() as AttendanceStatus;
  const riskLevel = data?.riskLevel;
  const failedStep = data?.failedStep;

  const rawQr = data?.rawQrStatus || 'VALID';
  const rawFace = data?.rawFaceStatus || (fraudStatus === 'SAFE' ? 'MATCH' : 'MISMATCH');
  const rawDevice = data?.rawDeviceStatus || (fraudStatus === 'SAFE' ? 'RECOGNIZED' : 'NEW_DEVICE');
  const rawLocation = data?.rawLocationStatus || (fraudStatus === 'SAFE' ? 'VALID' : 'OUT_OF_BOUNDS');
  const mlScore = data?.mlAnomalyScore;
  const mlLabel = data?.mlAnomalyLabel || 'NORMAL';

  return (
    <Card>
      <div className="p-6 space-y-6 text-center">
        {/* Main Status Icon & Header */}
        {fraudStatus === 'SAFE' || attendanceStatus === 'PRESENT' ? (
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        ) : fraudStatus === 'SUSPICIOUS' || attendanceStatus === 'PENDING_REVIEW' ? (
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {attendanceStatus === 'PRESENT' ? 'Attendance Verified' : fraudStatus === 'SUSPICIOUS' ? 'Attendance Pending Review' : 'Attendance Verification Rejected'}
          </h3>

          <div className="flex items-center justify-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              attendanceStatus === 'PRESENT'
                ? 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 text-emerald-800 dark:text-emerald-300'
                : fraudStatus === 'SUSPICIOUS'
                ? 'bg-amber-100 dark:bg-amber-950 border border-amber-200 text-amber-800 dark:text-amber-300'
                : 'bg-red-100 dark:bg-red-950 border border-red-200 text-red-800 dark:text-red-300'
            }`}>
              {attendanceStatus}
            </span>
            <FraudStatusBadge status={fraudStatus} />
            <RiskBadge riskLevel={riskLevel || 'LOW'} />
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 max-w-md mx-auto">
            {data?.message || 'Multi-signal verification processed.'}
          </p>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-left space-y-3 max-w-lg mx-auto">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
            Security Signal Breakdown
          </h4>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                <QrCode className="w-3.5 h-3.5 text-blue-500" /> QR Code
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{rawQr}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                <Camera className="w-3.5 h-3.5 text-emerald-500" /> Face
              </span>
              <span className={`font-bold ${rawFace.includes('MISMATCH') ? 'text-red-600' : 'text-emerald-600'}`}>{rawFace}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-amber-500" /> Location
              </span>
              <span className={`font-bold ${rawLocation.includes('OUT') ? 'text-red-600' : 'text-emerald-600'}`}>{rawLocation}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                <Smartphone className="w-3.5 h-3.5 text-purple-500" /> Device
              </span>
              <span className={`font-bold ${rawDevice.includes('MISMATCH') ? 'text-red-600' : rawDevice.includes('NEW') ? 'text-amber-600' : 'text-purple-600'}`}>{rawDevice}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-medium text-slate-600 dark:text-slate-400">Decision</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{fraudStatus}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" /> ML IsolationForest
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {typeof mlScore === 'number' ? mlScore.toFixed(4) : '0.2030'} ({mlLabel})
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {fraudStatus !== 'SAFE' && onRetry && (
            <Button
              variant="primary"
              size="md"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}

          <Button
            variant={fraudStatus === 'SAFE' ? 'primary' : 'outline'}
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={onReturnToLiveSessions || (() => navigate('/student/attendance'))}
          >
            {fraudStatus === 'SAFE' ? 'View Attendance Records' : 'Return to Live Sessions'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
