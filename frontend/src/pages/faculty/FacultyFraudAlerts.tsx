import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FraudStatusBadge } from '../../components/common/FraudStatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { SearchBar } from '../../components/tables/SearchBar';
import { facultyService } from '../../services/facultyService';
import { FraudAlert } from '../../types';
import { ShieldAlert, Eye, AlertCircle } from 'lucide-react';

export const FacultyFraudAlerts: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await facultyService.getFacultyFraudAlerts();
        if (isMounted) {
          setAlerts(data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load fraud detection flags from backend server.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAlerts();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAlerts = alerts.filter(
    (a) =>
      a.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      a.studentRoll?.toLowerCase().includes(search.toLowerCase()) ||
      a.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
      a.anomalyType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Fraud Monitoring"
        subtitle="Review suspicious attendance flags and anomaly logs for your active class sessions."
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
            placeholder="Search alerts by student name, roll number, or subject..."
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading fraud alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <EmptyState
            title="No fraud alerts available"
            description="No suspicious or proxy attendance attempts detected in your classes."
            icon={<ShieldAlert className="w-8 h-8" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Student ID</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Session</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Time</th>
                  <th className="p-3.5">Attendance Status</th>
                  <th className="p-3.5">Fraud Status</th>
                  <th className="p-3.5">Risk Level</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredAlerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {a.studentName}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      {a.studentRoll}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {a.subjectName || a.subjectCode || 'N/A'}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      {a.sessionId}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {a.sessionDate || a.timestamp?.split('T')[0] || 'N/A'}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono">
                      {a.sessionTime || a.timestamp?.split('T')[1]?.substring(0, 5) || 'N/A'}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={a.attendanceStatus || 'PENDING_REVIEW'} />
                    </td>
                    <td className="p-3.5">
                      <FraudStatusBadge status={a.fraudStatus || 'SUSPICIOUS'} />
                    </td>
                    <td className="p-3.5">
                      <RiskBadge riskLevel={a.riskLevel || (a.severity === 'CRITICAL' ? 'HIGH' : a.severity || 'MEDIUM')} />
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => navigate(`/faculty/fraud-alerts/${a.id}`)}
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
