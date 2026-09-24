import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { facultyService, FacultyAnalyticsData } from '../../services/facultyService';
import { AttendanceSession, Student, Subject, FraudAlert } from '../../types';
import { Radio, Users, ShieldAlert, Plus, BookOpen, Clock, AlertCircle } from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [analytics, setAnalytics] = useState<FacultyAnalyticsData | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [sessionsRes, studentsRes, subjectsRes, alertsRes, analyticsRes] =
          await Promise.all([
            facultyService.getFacultySessions(),
            facultyService.getAssignedStudents(),
            facultyService.getFacultySubjects(),
            facultyService.getFacultyFraudAlerts(),
            facultyService.getFacultyAnalytics(),
          ]);

        if (isMounted) {
          setActiveSessions(sessionsRes.filter((s) => s.status === 'LIVE'));
          setStudents(studentsRes);
          setSubjects(subjectsRes);
          setFraudAlerts(alertsRes);
          setAnalytics(analyticsRes);
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Failed to connect to faculty services. Please verify backend API status.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Workspace"
        subtitle="Schedule live attendance sessions, launch dynamic QR codes, and review proxy detection flags."
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/faculty/sessions/create')}
          >
            New Attendance Session
          </Button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Live Sessions</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {loading ? '...' : activeSessions.length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Students in Roster</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {loading ? '...' : students.length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Assigned Subjects</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {loading ? '...' : subjects.length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Fraud Flags</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {loading ? '...' : fraudAlerts.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Sessions Overview */}
      <Card
        title="Live & Scheduled Attendance Sessions"
        subtitle="Manage current live classes and QR verification windows"
      >
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading session schedule...</div>
        ) : activeSessions.length === 0 ? (
          <EmptyState
            title="No live attendance sessions available"
            description="You do not have any active live sessions right now."
            actionLabel="Create Attendance Session"
            onAction={() => navigate('/faculty/sessions/create')}
            icon={<Radio className="w-8 h-8" />}
          />
        ) : (
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {session.subjectCode} - {session.subjectName}
                    </span>
                    <StatusBadge status={session.status} />
                  </div>
                  <div className="mt-1 flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {session.startTime} - {session.endTime}
                      </span>
                    </span>
                    <span>
                      Attended: {session.attendedCount} / {session.totalStudents}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/faculty/sessions/${session.id}`)}
                >
                  Open QR Screen
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Grid for Roster & Fraud Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="My Assigned Subjects"
          subtitle="Course modules assigned to your faculty profile"
        >
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading subjects...</div>
          ) : subjects.length === 0 ? (
            <EmptyState
              title="No subjects mapped"
              description="No subject courses are mapped to your faculty account."
              actionLabel="Add Subject"
              onAction={() => navigate('/faculty/subjects/add')}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {subjects.map((sub) => (
                <div key={sub.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {sub.code} - {sub.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dept: {sub.department} | Sem: {sub.semester}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/faculty/subjects/${sub.id}`)}
                  >
                    Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Suspicious Attendance Flags"
          subtitle="Biometric & geo-fencing proxy detection alerts"
        >
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading alerts...</div>
          ) : fraudAlerts.length === 0 ? (
            <EmptyState
              title="No proxy flags detected"
              description="No suspicious attendance attempts found in your classes."
            />
          ) : (
            <div className="space-y-3">
              {fraudAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {alert.studentName} ({alert.studentRoll})
                      </span>
                      <StatusBadge status={alert.severity} />
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      Type: {alert.anomalyType.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/faculty/fraud-alerts/${alert.id}`)}
                  >
                    Investigate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
