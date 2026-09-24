import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FraudStatusBadge } from '../../components/common/FraudStatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { VerificationSummaryComponent } from '../../components/common/VerificationSummary';
import { studentService } from '../../services/studentService';
import { AttendanceRecord } from '../../types';
import { ArrowLeft, BookOpen, User, Calendar, Clock, AlertCircle } from 'lucide-react';

export const StudentAttendanceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRecord = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await studentService.getStudentAttendanceById(id);
        if (isMounted) {
          setRecord(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Failed to retrieve attendance details from server.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecord();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading attendance details...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/student/attendance')}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <PageHeader
          title="Attendance Record Details"
          subtitle={record ? `Subject: ${record.subjectName}` : 'Attendance Record Details'}
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!record ? (
        <Card>
          <div className="p-8 text-center text-slate-500 text-xs">
            Attendance record not found or unavailable.
          </div>
        </Card>
      ) : (
        <>
          {/* Metadata Grid */}
          <Card title="Class Session Metadata">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Subject</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {record.subjectCode ? `${record.subjectCode} - ` : ''}{record.subjectName}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <User className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Faculty</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {record.facultyName || 'Faculty Member'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Date</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {record.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Time</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {record.time}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance & Fraud Outcome Badges */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-500">Attendance Status:</span>
                <StatusBadge status={record.attendanceStatus || record.status || 'NOT_MARKED'} />
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-500">Fraud Status:</span>
                <FraudStatusBadge status={record.fraudStatus || 'SAFE'} />
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-500">Risk Level:</span>
                <RiskBadge riskLevel={record.riskLevel} />
              </div>
            </div>

            {/* Risk Score */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              {typeof record.riskScore === 'number' ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Backend Risk Score</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {record.riskScore} / 100
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Risk assessment available after analysis.
                </p>
              )}
            </div>
          </Card>

          {/* Verification Summary */}
          <Card title="Verification Summary" subtitle="Anti-spoofing factor statuses">
            <VerificationSummaryComponent summary={record.verificationSummary} />
          </Card>
        </>
      )}
    </div>
  );
};
