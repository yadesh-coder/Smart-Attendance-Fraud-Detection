import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ShieldCheck, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { SessionCountdownTimer } from './SessionCountdownTimer';

export interface SessionQRCodeProps {
  sessionId?: string;
  sessionToken?: string;
  qrData?: string;
  attendanceCode?: string;
  expiresAt?: string;
  status?: 'SCHEDULED' | 'LIVE' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'CLOSED' | string;
  onRefresh?: () => void;
  className?: string;
}

export const SessionQRCode: React.FC<SessionQRCodeProps> = ({
  sessionId,
  sessionToken,
  qrData,
  attendanceCode,
  expiresAt,
  status = 'LIVE',
  onRefresh,
  className = '',
}) => {
  const isLive = status === 'LIVE' || status === 'ACTIVE' || status === 'CREATED';
  const effectiveData = qrData || sessionToken || (sessionId ? sessionId : '');

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full flex flex-col items-center text-center">
        {/* Dynamic Badge */}
        <div className="mb-4 flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Session Dynamic QR</span>
        </div>

        {/* QR Display Container */}
        <div className="relative w-60 h-60 p-4 bg-white rounded-xl border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-xs">
          {isLive && effectiveData ? (
            <QRCodeSVG
              value={effectiveData}
              size={210}
              level="H"
              includeMargin={true}
              className="w-full h-full text-slate-900"
            />
          ) : !isLive ? (
            <div className="flex flex-col items-center justify-center text-center p-4 space-y-2 text-slate-400">
              <AlertCircle className="w-10 h-10 text-slate-400" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {status === 'SCHEDULED'
                  ? 'Session has not started.'
                  : status === 'CLOSED'
                  ? 'Attendance session closed.'
                  : status === 'COMPLETED'
                  ? 'Attendance session completed.'
                  : 'Session Inactive'}
              </p>
              <p className="text-[11px] text-slate-500">
                {status === 'SCHEDULED'
                  ? 'Click "Start Session" to activate dynamic QR code generation.'
                  : 'Attendance QR verification is inactive for this session.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
              <QrCode className="w-10 h-10 text-slate-400 animate-pulse" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                No QR Data Received
              </p>
              <p className="text-[11px] font-normal text-slate-400">
                Waiting for backend session token...
              </p>
            </div>
          )}
        </div>

        {/* Status Instructions & Expiration */}
        {isLive && (
          <div className="mt-4 space-y-2 w-full">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Attendance is currently open.</span>
            </p>

            {attendanceCode && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-center">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendance Code</p>
                <p className="text-2xl font-mono font-extrabold text-blue-600 dark:text-blue-400 tracking-[0.3em]">{attendanceCode}</p>
              </div>
            )}

            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Scan this QR or enter code to begin attendance verification.
            </p>

            {/* Real Live Countdown Timer */}
            <div className="py-1 flex justify-center">
              <SessionCountdownTimer
                expiresAt={expiresAt}
                status={status}
                size="md"
                onExpire={onRefresh}
              />
            </div>
          </div>
        )}

        {/* Force Refresh Trigger */}
        {isLive && onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-3 inline-flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold focus:outline-none"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force QR Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
};
