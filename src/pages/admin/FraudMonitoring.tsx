import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { SearchBar } from '../../components/tables/SearchBar';
import { Filter } from '../../components/tables/Filter';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FraudStatusBadge } from '../../components/common/FraudStatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { Eye, ShieldAlert } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { FraudAlert } from '../../types';

export const FraudMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [fraudFilter, setFraudFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);

  const fetchFraudAlerts = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getFraudAlerts();
      setAlerts(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFraudAlerts();
  }, []);

  const filteredData = alerts.filter((item) => {
    const matchesSearch =
      !search ||
      item.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      item.studentRoll?.toLowerCase().includes(search.toLowerCase()) ||
      item.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
      item.subjectCode?.toLowerCase().includes(search.toLowerCase());

    const matchesRisk = !riskFilter || item.riskLevel === riskFilter || item.severity === riskFilter;
    const matchesFraud = !fraudFilter || item.fraudStatus === fraudFilter;
    const matchesSubject = !subjectFilter || item.subjectCode === subjectFilter || item.subjectName === subjectFilter;
    const matchesDate = !dateFilter || item.sessionDate === dateFilter || item.timestamp?.includes(dateFilter);
    const matchesDept = !deptFilter || item.department === deptFilter;

    return matchesSearch && matchesRisk && matchesFraud && matchesSubject && matchesDate && matchesDept;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Fraud & Anomaly Monitoring"
        subtitle="System-wide audit trail monitoring suspicious attendance attempts, proxy alerts, and security risk levels."
      />

      {/* Search and Filters */}
      <div className="space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by student name, student ID, or subject..."
        />

        <div className="flex flex-wrap items-center gap-2">
          <Filter
            value={riskFilter}
            onChange={setRiskFilter}
            label="All Risk Levels"
            options={[
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
            ]}
          />
          <Filter
            value={fraudFilter}
            onChange={setFraudFilter}
            label="All Fraud Statuses"
            options={[
              { label: 'Safe', value: 'SAFE' },
              { label: 'Suspicious', value: 'SUSPICIOUS' },
              { label: 'High Risk', value: 'HIGH_RISK' },
              { label: 'Failed', value: 'FAILED' },
            ]}
          />
          <Filter
            value={deptFilter}
            onChange={setDeptFilter}
            label="All Depts"
            options={[
              { label: 'CSE', value: 'CSE' },
              { label: 'IT', value: 'IT' },
              { label: 'ECE', value: 'ECE' },
              { label: 'ME', value: 'ME' },
            ]}
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-center">
          <LoadingSpinner label="Loading Fraud Alerts..." size="md" />
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load data"
          message="Failed to connect to fraud monitoring service."
          onRetry={fetchFraudAlerts}
        />
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No suspicious attendance activity available"
          description="No fraud alerts or suspicious attendance logs exist across the system."
          icon={<ShieldAlert className="w-8 h-8" />}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Student ID</th>
                <th className="p-3.5">Faculty</th>
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
              {filteredData.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                    {a.studentName}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-500">
                    {a.studentRoll}
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300">
                    {a.facultyName || 'Faculty'}
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
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
                      onClick={() => navigate(`/admin/fraud/${a.id}`)}
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
    </div>
  );
};
