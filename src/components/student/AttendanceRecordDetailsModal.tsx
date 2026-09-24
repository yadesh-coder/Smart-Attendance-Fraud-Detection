import React from 'react';
import { AttendanceRecord } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { X, Calendar, Clock, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AttendanceRecordDetailsModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
}

export const AttendanceRecordDetailsModal: React.FC<AttendanceRecordDetailsModalProps> = ({
  record,
  onClose,
}) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-6">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Attendance Record Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="px-6 space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Subject</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{record.subjectName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date
              </span>
              <span className="text-slate-800 dark:text-slate-200">{record.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Time Marked
              </span>
              <span className="text-slate-800 dark:text-slate-200">{record.time}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider">
              Verification Status Breakdown
            </h4>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-600 dark:text-slate-400">Attendance Status</span>
                <StatusBadge status={record.status} />
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-600 dark:text-slate-400">Biometric Verification</span>
                <StatusBadge status={record.faceVerificationState === 'VERIFIED' ? 'VERIFIED' : 'FAILED'} />
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-600 dark:text-slate-400">Location Geofencing</span>
                <StatusBadge status={record.geoVerificationState === 'VERIFIED' ? 'VERIFIED' : 'FAILED'} />
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-600 dark:text-slate-400">Device Hardware Security</span>
                <StatusBadge status={record.deviceVerificationState === 'REGISTERED' ? 'REGISTERED' : 'SUSPICIOUS'} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
