import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SearchBar } from '../../components/tables/SearchBar';
import { facultyService } from '../../services/facultyService';
import { FileText, ChevronDown, ChevronUp, Users, Calendar, Clock, BookOpen } from 'lucide-react';

export const FacultyReports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await facultyService.getFacultyAttendanceReports();
        if (isMounted) {
          setReports(data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Failed to load attendance reports from backend.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReports();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleExpand = (sessionId: string) => {
    setExpandedSessionId((prev) => (prev === sessionId ? null : sessionId));
  };

  const filteredReports = reports.filter(
    (r) =>
      r.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
      r.subjectCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.sessionId?.toLowerCase().includes(search.toLowerCase()) ||
      r.date?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Attendance Reports & History"
        subtitle="Historical attendance analytics, session-wise student participation rates, and breakdown reports."
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
          {error}
        </div>
      )}

      <Card padding={false}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-96">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search reports by subject, session date, or code..."
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total Sessions Conducted: <span className="font-bold text-slate-900 dark:text-slate-100">{reports.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading attendance reports...</div>
        ) : filteredReports.length === 0 ? (
          <EmptyState
            title="No Attendance History Reports Available"
            description="No historical attendance sessions recorded yet for your assigned subjects."
            icon={<FileText className="w-8 h-8" />}
          />
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredReports.map((report) => {
              const isExpanded = expandedSessionId === report.sessionId;
              const participants = report.participants || [];

              return (
                <div key={report.sessionId} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                          {report.subjectCode || report.subjectId}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {report.subjectName}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{report.date || 'N/A'}</span>
                        </span>
                        <span className="flex items-center space-x-1 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{report.startTime} - {report.endTime}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Dept: {report.department || 'N/A'} | Sem {report.semester || 'N/A'} | Sec {report.section || 'N/A'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-xs text-slate-400 uppercase font-semibold text-[10px]">Attendance Rate</div>
                        <div className={`text-base font-extrabold ${report.attendancePercentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {report.attendancePercentage}%
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-slate-400 uppercase font-semibold text-[10px]">Participated</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {report.attendedCount} / {report.eligibleCount}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(report.sessionId)}
                        icon={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      >
                        {isExpanded ? 'Hide Details' : 'View Participants'}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center space-x-1.5">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span>Student Attendance Roster ({participants.length} Entered)</span>
                        </span>
                      </div>

                      {participants.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                          No student participation records recorded for this session.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase">
                                <th className="p-2.5">Student Name</th>
                                <th className="p-2.5">Roll / Student ID</th>
                                <th className="p-2.5">Department</th>
                                <th className="p-2.5">Semester</th>
                                <th className="p-2.5">Section</th>
                                <th className="p-2.5">Status</th>
                                <th className="p-2.5 text-right">Time Marked</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                              {participants.map((p: any) => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">
                                    {p.studentName}
                                  </td>
                                  <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                                    {p.rollNumber}
                                  </td>
                                  <td className="p-2.5 text-slate-600 dark:text-slate-400">
                                    {p.department}
                                  </td>
                                  <td className="p-2.5 text-slate-600 dark:text-slate-400">
                                    {p.semester}
                                  </td>
                                  <td className="p-2.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                                    {p.section}
                                  </td>
                                  <td className="p-2.5">
                                    <StatusBadge status={p.attendanceStatus || 'PRESENT'} />
                                  </td>
                                  <td className="p-2.5 text-right font-mono text-slate-500">
                                    {p.time || 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
