import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LiveSessionCard } from '../../components/student/LiveSessionCard';
import { useAuth } from '../../context/AuthContext';
import { useVerification } from '../../context/VerificationContext';
import { studentService, StudentAttendanceSummary } from '../../services/studentService';
import { AttendanceSession, AttendanceRecord, Student } from '../../types';
import { Radio, CalendarCheck, ShieldAlert, GraduationCap, ArrowRight, UserCheck, Lock, AlertCircle, RefreshCw } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { setActiveSession } = useVerification();

  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [liveSessions, setLiveSessions] = useState<AttendanceSession[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<any>(null);

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

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const [summaryData, sessionsData, historyData, enrollmentStatusData, profileData] = await Promise.all([
          studentService.getStudentAttendanceSummary(),
          studentService.getStudentLiveSessions(),
          studentService.getStudentAttendanceHistory(),
          studentService.getEnrollmentStatus(),
          studentService.getStudentProfile(),
        ]);

        if (isMounted) {
          setSummary(summaryData);
          setLiveSessions(deduplicateSessions(sessionsData));
          setRecentAttendance(historyData);
          setEnrollmentStatus(enrollmentStatusData);
          setStudentProfile(profileData);

          if (enrollmentStatusData.enrollmentCompleted !== user?.isFirstTimeSetupComplete) {
            updateUser({ isFirstTimeSetupComplete: enrollmentStatusData.enrollmentCompleted });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Failed to fetch student dashboard data from backend server.');
        }
      } finally {
        if (isMounted && showLoading) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData(true);
    const timer = setInterval(() => {
      fetchDashboardData(false);
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleJoinSession = (session: AttendanceSession) => {
    setActiveSession(session);
    navigate('/student/verification');
  };

  const isSetupRequired = !user?.isFirstTimeSetupComplete;

  const isFaceRegistered = enrollmentStatus?.faceEnrollmentCompleted || studentProfile?.faceRegistered === true;
  const isDeviceRegistered = enrollmentStatus?.deviceRegistrationCompleted || studentProfile?.deviceRegistered === true;
  const isEnrollmentCompleted = enrollmentStatus?.enrollmentCompleted || (isFaceRegistered && isDeviceRegistered);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        subtitle="View academic profile, join live class attendance sessions, and monitor attendance summary."
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* First-time setup banner indicator if not completed */}
      {isSetupRequired && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Enrollment Setup Required
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Complete initial biometric face capture and hardware binding before joining class sessions.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
            onClick={() => navigate('/student/first-time-setup')}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Complete Setup
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Read-Only Student Information Card */}
        <Card className="lg:col-span-2" title="Student Read-Only Academic Profile">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Student Name
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100">{studentProfile?.name || user?.name || 'Student'}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Student ID / Roll No
              </span>
              <div className="flex items-center space-x-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>{studentProfile?.rollNumber || '362'}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Official Email
              </span>
              <p className="font-medium text-slate-800 dark:text-slate-200">{studentProfile?.email || user?.email}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Department
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{studentProfile?.department || 'EEE'}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Year & Semester
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {studentProfile?.semester ? `Semester ${studentProfile.semester}` : 'Semester 4'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Section & Role
              </span>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Section {studentProfile?.section || 'C'}</span>
                <StatusBadge status="ACTIVE" label="STUDENT" />
              </div>
            </div>
          </div>
        </Card>

        {/* Security & Biometric Status Card */}
        <Card title="Security & Biometric Status">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Personal Details</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Registered</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isFaceRegistered ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Face Biometrics</span>
              </div>
              <span className={`text-[10px] font-bold uppercase ${isFaceRegistered ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isFaceRegistered ? 'Registered' : 'Pending Setup'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isDeviceRegistered ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Device Fingerprint</span>
              </div>
              <span className={`text-[10px] font-bold uppercase ${isDeviceRegistered ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isDeviceRegistered ? 'Registered' : 'Pending Device'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300">Enrollment Status</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isEnrollmentCompleted ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'}`}>
                {isEnrollmentCompleted ? 'Completed' : 'In Progress'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Attendance Summary Metric Cards - Uses Loading / Empty / Error States */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Attendance Percentage</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {loading ? '...' : summary ? `${summary.attendancePercentage}%` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Classes Attended</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {loading ? '...' : summary?.classesAttended ?? 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Classes Missed</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {loading ? '...' : summary?.classesMissed ?? 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Live Sessions</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {loading ? '...' : liveSessions.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Active Sessions */}
      <Card title="Today's Active Sessions" subtitle="Classroom QR attendance sessions open right now">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading active sessions...</div>
        ) : liveSessions.length === 0 ? (
          <EmptyState
            title="No live attendance sessions available"
            description="There are currently no active live attendance sessions broadcasting."
            icon={<Radio className="w-8 h-8" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveSessions.map((session) => (
              <LiveSessionCard
                key={session.id}
                session={session}
                onJoinSession={handleJoinSession}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Recent Attendance */}
      <Card title="Recent Attendance Logs" subtitle="Latest attendance verification outputs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading attendance history...</div>
        ) : recentAttendance.length === 0 ? (
          <EmptyState
            title="No attendance records available"
            description="You have not marked attendance in any class sessions yet."
            icon={<CalendarCheck className="w-8 h-8" />}
          />
        ) : (
          <div className="space-y-2 text-xs">
            {recentAttendance.slice(0, 5).map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{record.subjectName}</p>
                  <p className="text-[11px] text-slate-500">{record.date} at {record.time}</p>
                </div>
                <StatusBadge status={record.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
