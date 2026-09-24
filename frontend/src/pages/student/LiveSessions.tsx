import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LiveSessionCard } from '../../components/student/LiveSessionCard';
import { useVerification } from '../../context/VerificationContext';
import { attendanceService } from '../../services/attendanceService';
import { studentService } from '../../services/studentService';
import { AttendanceSession } from '../../types';
import { Radio, AlertCircle, RefreshCw } from 'lucide-react';

export const LiveSessions: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveSession, resetVerification } = useVerification();

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const deduplicateSessions = (list: AttendanceSession[]): AttendanceSession[] => {
    const seen = new Set<string>();
    const result: AttendanceSession[] = [];
    for (const s of list || []) {
      const key = s.sessionId || s.id || `${s.subjectCode}_${s.date}_${s.startTime}_${s.endTime}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(s);
      }
    }
    return result;
  };

  const fetchLiveSessions = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      let data = await attendanceService.getStudentLiveSessions();
      if (!data || data.length === 0) {
        data = await studentService.getStudentLiveSessions();
      }
      setSessions(deduplicateSessions(data || []));
    } catch (err: any) {
      setError('Unable to load live sessions.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSessions(true);
    const timer = setInterval(() => {
      fetchLiveSessions(false);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleJoinSession = (session: AttendanceSession) => {
    resetVerification();
    setActiveSession(session);
    navigate('/student/verification/qr');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Attendance Sessions"
        subtitle="Active subject class sessions open for student attendance QR scanning."
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-3 h-3" />}
            onClick={fetchLiveSessions}
          >
            Try Again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading live sessions...
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No live attendance sessions available"
          description="There are currently no active attendance sessions broadcasting for your enrolled subjects."
          icon={<Radio className="w-8 h-8" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <LiveSessionCard
              key={session.id}
              session={session}
              onJoinSession={handleJoinSession}
            />
          ))}
        </div>
      )}
    </div>
  );
};
