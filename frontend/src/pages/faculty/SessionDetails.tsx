import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SessionQRCode } from '../../components/common/SessionQRCode';
import { useToast } from '../../context/ToastContext';
import { attendanceService } from '../../services/attendanceService';
import { facultyService } from '../../services/facultyService';
import { AttendanceSession, AttendanceRecord } from '../../types';
import { ArrowLeft, Play, StopCircle, Clock, Users, AlertCircle, RefreshCw, X } from 'lucide-react';

export const SessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Operation loading states
  const [starting, setStarting] = useState<boolean>(false);
  const [closing, setClosing] = useState<boolean>(false);

  // Close Session Confirmation Modal
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);

  // Dynamic session QR state returned from backend
  const [qrTokenData, setQrTokenData] = useState<{
    token?: string;
    qrData?: string;
    expiresAt?: string;
  }>({});

  const fetchSessionData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      let sessionRes = await facultyService.getSessionById(id);
      if (!sessionRes) {
        sessionRes = await attendanceService.getSession(id);
      }
      let recordsRes = await facultyService.getSessionAttendanceRecords(id);
      if (!recordsRes || recordsRes.length === 0) {
        recordsRes = await attendanceService.getSessionAttendanceRecords(id);
      }

      setSession(sessionRes);
      setRecords(recordsRes || []);

      if (sessionRes) {
        const qrVal = (sessionRes as any).qrData || (sessionRes as any).qrToken || (sessionRes as any).sessionId;
        const tokVal = (sessionRes as any).qrToken || (sessionRes as any).sessionToken || sessionRes.id;
        const expVal = (sessionRes as any).qrExpiresAt || (sessionRes as any).expiresAt;
        setQrTokenData({
          token: tokVal,
          qrData: qrVal,
          expiresAt: expVal,
        });
      }
    } catch (err) {
      setError('Unable to load session details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [id]);

  useEffect(() => {
    let intervalId: any = null;
    if (id && session && (session.status === 'LIVE' || session.status === 'ACTIVE')) {
      intervalId = setInterval(() => {
        facultyService.getSessionParticipants(id).then((participants) => {
          if (participants && participants.length > 0) {
            setRecords(participants);
          }
        });
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, session?.status]);

  const handleStartSession = async () => {
    if (!id) return;
    setStarting(true);
    setError(null);
    try {
      const response = await attendanceService.startSession(id);
      if (response && response.success) {
        setQrTokenData({
          token: response.sessionToken,
          qrData: response.qrData,
          expiresAt: response.expiresAt,
        });
        addToast('success', 'Session Live', 'Attendance session started.');
        fetchSessionData();
      } else {
        const facRes = await facultyService.startSession(id);
        if (facRes) {
          addToast('success', 'Session Live', 'Attendance session started.');
          fetchSessionData();
        } else {
          setError('Unable to start session.');
        }
      }
    } catch (err) {
      setError('Unable to start session.');
    } finally {
      setStarting(false);
    }
  };

  const handleConfirmCloseSession = async () => {
    if (!id) return;
    setClosing(true);
    setError(null);
    try {
      const response = await attendanceService.closeSession(id);
      if (response && response.success) {
        addToast('info', 'Session Closed', 'Attendance session closed.');
        setShowCloseModal(false);
        fetchSessionData();
      } else {
        const facRes = await facultyService.closeSession(id);
        if (facRes) {
          addToast('info', 'Session Closed', 'Attendance session closed.');
          setShowCloseModal(false);
          fetchSessionData();
        } else {
          setError('Unable to close session.');
        }
      }
    } catch (err) {
      setError('Unable to close session.');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        Loading session details...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/faculty/sessions')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <PageHeader
            title={session ? `${session.subjectCode} - ${session.subjectName}` : 'Attendance Session'}
            subtitle="Session-specific dynamic QR code broadcast and live attendance status."
          />
        </div>

        {session && (
          <div className="flex items-center space-x-2">
            {(session.status === 'SCHEDULED' || session.status === 'CREATED') && (
              <Button
                variant="primary"
                size="sm"
                icon={starting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                disabled={starting}
                onClick={handleStartSession}
              >
                {starting ? 'Starting Session...' : 'Start Session'}
              </Button>
            )}

            {(session.status === 'LIVE' || session.status === 'ACTIVE') && (
              <Button
                variant="outline"
                size="sm"
                icon={<StopCircle className="w-4 h-4" />}
                onClick={() => setShowCloseModal(true)}
              >
                Close Session
              </Button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessionData}
          >
            Try Again
          </Button>
        </div>
      )}

      {!session ? (
        <Card>
          <div className="p-8 text-center text-slate-500 text-xs">
            Unable to load session details.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prominent Session QR Code Component */}
          <Card className="lg:col-span-1 flex flex-col items-center text-center">
            <SessionQRCode
              sessionId={session.id}
              sessionToken={qrTokenData.token || session.id}
              qrData={qrTokenData.qrData}
              attendanceCode={session.attendanceCode}
              expiresAt={qrTokenData.expiresAt || session.endTime}
              status={session.status}
              onRefresh={fetchSessionData}
            />
          </Card>

          {/* Session Parameters Info Card */}
          <Card className="lg:col-span-2" title="Attendance Session Parameters">
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-slate-400 font-medium">Subject Code & Name</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {session.subjectCode} - {session.subjectName}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 font-medium">Assigned Faculty</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {session.facultyName || 'Faculty Member'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 font-medium">Date & Schedule Window</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {(session as any).date || 'Today'} | {session.startTime} - {session.endTime}
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 font-medium">Session Status</p>
                  <div className="mt-1 flex items-center space-x-3">
                    <StatusBadge status={session.status} />
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {session.attendedCount || 0} / {session.totalStudents || 0} Scanned
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs">
                {session.status === 'SCHEDULED' && (
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    Session has not started.
                  </p>
                )}
                {(session.status === 'LIVE' || session.status === 'ACTIVE') && (
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">
                    Attendance is currently open.
                  </p>
                )}
                {session.status === 'CLOSED' && (
                  <p className="font-semibold text-slate-600 dark:text-slate-400">
                    Attendance session closed.
                  </p>
                )}
                {session.status === 'COMPLETED' && (
                  <p className="font-semibold text-slate-600 dark:text-slate-400">
                    Attendance session completed.
                  </p>
                )}
              </div>

              {/* Attendance Scans Table */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Session Participants ({records.length} Entered)</span>
                </h4>

                {records.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    No student participants entered this session yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-[10px]">
                          <th className="py-2.5 px-3 font-semibold">Student Name</th>
                          <th className="py-2.5 px-3 font-semibold">Roll / Student ID</th>
                          <th className="py-2.5 px-3 font-semibold">Dept / Sem / Sec</th>
                          <th className="py-2.5 px-3 font-semibold">Status</th>
                          <th className="py-2.5 px-3 text-right font-semibold">Time Marked</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {records.map((r: any) => (
                          <tr key={r.id}>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                              {r.studentName || r.subjectName || 'Student'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                              {r.rollNumber || r.studentId || 'N/A'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                              {r.department || 'N/A'} (Sem {r.semester || '-'} - Sec {r.section || '-'})
                            </td>
                            <td className="py-2.5 px-3">
                              <StatusBadge status={r.attendanceStatus || r.status || 'PRESENT'} />
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                              {r.time || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog for Close Session */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Close Attendance Session
              </h3>
              <button
                onClick={() => setShowCloseModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to close this attendance session?
            </p>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCloseModal(false)}
                disabled={closing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={closing}
                onClick={handleConfirmCloseSession}
                icon={closing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
              >
                {closing ? 'Closing session...' : 'Close Session'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
