import React from 'react';
import { AttendanceSession } from '../../types';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { SessionCountdownTimer } from '../common/SessionCountdownTimer';
import { Radio, Clock, User, Calendar, ArrowRight } from 'lucide-react';

interface LiveSessionCardProps {
  session: AttendanceSession;
  onJoinSession: (session: AttendanceSession) => void;
}

export const LiveSessionCard: React.FC<LiveSessionCardProps> = ({ session, onJoinSession }) => {
  const isLive = session.status === 'LIVE' || session.status === 'ACTIVE';

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
              {session.subjectCode}
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {session.subjectName}
            </h4>
          </div>
          <StatusBadge
            status={
              isLive
                ? 'ACTIVE'
                : session.status === 'SCHEDULED'
                ? 'PENDING'
                : 'CLOSED'
            }
            label={
              isLive
                ? 'Active Now'
                : session.status === 'SCHEDULED'
                ? 'Scheduled'
                : 'Closed'
            }
          />
        </div>

        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Faculty: <strong className="text-slate-800 dark:text-slate-200">{session.facultyName || 'Faculty Member'}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Date: <strong className="text-slate-800 dark:text-slate-200">{(session as any).date || 'Today'}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Schedule: <strong className="font-mono text-slate-800 dark:text-slate-200">{session.startTime} - {session.endTime}</strong></span>
          </div>
        </div>

        {isLive && (
          <div className="pt-2 flex justify-center">
            <SessionCountdownTimer
              endAt={(session as any).endAt || (session as any).qrExpiresAt}
              expiresAt={(session as any).qrExpiresAt}
              endTime={session.endTime}
              sessionDate={(session as any).date}
              status={session.status}
              size="sm"
            />
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500">
          <Radio className={`w-3.5 h-3.5 ${isLive ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
          <span>{isLive ? 'QR Scan Active' : 'Session Standby'}</span>
        </div>

        <Button
          variant={isLive ? 'primary' : 'outline'}
          size="sm"
          disabled={!isLive}
          icon={<ArrowRight className="w-3.5 h-3.5" />}
          onClick={() => onJoinSession(session)}
        >
          Join Session
        </Button>
      </div>
    </div>
  );
};
