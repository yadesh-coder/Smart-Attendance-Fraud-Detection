import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FraudStatusBadge } from '../../components/common/FraudStatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { VerificationStatus } from '../../components/common/VerificationStatus';
import { SearchBar } from '../../components/tables/SearchBar';
import { studentService } from '../../services/studentService';
import { AttendanceRecord } from '../../types';
import { CalendarCheck, Eye, AlertCircle } from 'lucide-react';

export const StudentAttendance: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await studentService.getStudentAttendanceHistory();
        if (isMounted) {
          setRecords(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Failed to load attendance history from backend.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRecords = records.filter(
    (r) =>
      r.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      r.date.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Records & History"
        subtitle="View history of marked attendances, subject-wise verification outputs, and fraud status logs."
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card padding={false}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search records by subject name or date..."
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading attendance history...</div>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            title="No attendance records available"
            description="You have not marked attendance in any class sessions yet."
            icon={<CalendarCheck className="w-8 h-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Time</th>
                  <th className="p-3.5">Attendance Status</th>
                  <th className="p-3.5">Verification Status</th>
                  <th className="p-3.5">Fraud Status</th>
                  <th className="p-3.5">Risk Level</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {record.subjectCode ? `${record.subjectCode} - ` : ''}{record.subjectName}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {record.date}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono">
                      {record.time}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={record.status || record.attendanceStatus || 'NOT_MARKED'} />
                    </td>
                    <td className="p-3.5">
                      <VerificationStatus status={record.verificationStatus || (record.status === 'PRESENT' || record.attendanceStatus === 'PRESENT' ? 'VERIFIED' : 'PENDING')} />
                    </td>
                    <td className="p-3.5">
                      <FraudStatusBadge status={record.fraudStatus || record.decision || 'SAFE'} />
                    </td>
                    <td className="p-3.5">
                      <RiskBadge riskLevel={record.riskLevel} />
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => navigate(`/student/attendance/${record.id}`)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
