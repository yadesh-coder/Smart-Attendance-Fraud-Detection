import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { SearchBar } from '../../components/tables/SearchBar';
import { DataTable, Column } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { attendanceService } from '../../services/attendanceService';
import { facultyService } from '../../services/facultyService';
import { AttendanceSession } from '../../types';
import { Plus, Radio, Eye, Play, StopCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export const AttendanceSessions: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await attendanceService.getSessions();
      if (!data || data.length === 0) {
        data = await facultyService.getFacultySessions();
      }
      setSessions(data || []);
    } catch (err) {
      setError('Unable to load sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleStartSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await attendanceService.startSession(id);
      if (res.success || res.sessionToken) {
        addToast('success', 'Session Live', 'Attendance session started.');
        navigate(`/faculty/sessions/${id}`);
      } else {
        await facultyService.startSession(id);
        addToast('success', 'Session Live', 'Attendance session started.');
        navigate(`/faculty/sessions/${id}`);
      }
    } catch (err) {
      addToast('error', 'Start Failed', 'Unable to start session.');
    }
  };

  const handleCloseSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await attendanceService.closeSession(id);
      addToast('info', 'Session Closed', 'Attendance session closed.');
      fetchSessions();
    } catch (err) {
      addToast('error', 'Close Failed', 'Unable to close session.');
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
      s.subjectName.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<AttendanceSession>[] = [
    {
      header: 'Subject',
      cell: (s: AttendanceSession) => (
        <div>
          <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
            {s.subjectCode} - {s.subjectName}
          </p>
          {s.facultyName && (
            <p className="text-[11px] text-slate-500">By {s.facultyName}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Date',
      cell: (s: AttendanceSession) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {(s as any).date || 'Today'}
        </span>
      ),
    },
    {
      header: 'Start Time',
      cell: (s: AttendanceSession) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          {s.startTime}
        </span>
      ),
    },
    {
      header: 'End Time',
      cell: (s: AttendanceSession) => (
        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
          {s.endTime}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (s: AttendanceSession) => <StatusBadge status={s.status} />,
    },
    {
      header: 'Actions',
      cell: (s: AttendanceSession) => (
        <div className="flex items-center space-x-2">
          {s.status === 'SCHEDULED' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Play className="w-3.5 h-3.5" />}
              onClick={(e) => handleStartSession(s.id, e)}
            >
              Start
            </Button>
          )}

          {s.status === 'LIVE' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={<Radio className="w-3.5 h-3.5" />}
                onClick={() => navigate(`/faculty/sessions/${s.id}`)}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<StopCircle className="w-3.5 h-3.5" />}
                onClick={(e) => handleCloseSession(s.id, e)}
              >
                Close
              </Button>
            </>
          )}

          {(s.status === 'COMPLETED' || s.status === 'CANCELLED') && (
            <Button
              variant="outline"
              size="sm"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/faculty/sessions/${s.id}`)}
            >
              View
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Sessions"
        subtitle="Manage classroom attendance sessions and broadcast session-specific QR codes."
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/faculty/sessions/create')}
          >
            Create Session
          </Button>
        }
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
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={fetchSessions}
          >
            Try Again
          </Button>
        </div>
      )}

      <Card padding={false}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search sessions by subject code or name..."
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading sessions...</div>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            title="No attendance sessions available."
            description="You have not created any attendance sessions yet."
            actionLabel="Create Session"
            onAction={() => navigate('/faculty/sessions/create')}
            icon={<Radio className="w-8 h-8" />}
          />
        ) : (
          <DataTable
            data={filteredSessions}
            columns={columns}
            keyExtractor={(s) => s.id}
          />
        )}
      </Card>
    </div>
  );
};
