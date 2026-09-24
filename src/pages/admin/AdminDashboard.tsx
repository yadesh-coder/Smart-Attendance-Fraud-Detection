import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Users, GraduationCap, BookOpen, ShieldAlert, Activity, Server } from 'lucide-react';
import { adminService, DashboardMetrics, AdminActivity } from '../../services/adminService';
import { FraudAlert } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [mRes, aRes, fRes] = await Promise.all([
        adminService.getDashboardMetrics(),
        adminService.getRecentActivities(),
        adminService.getFraudAlerts(),
      ]);
      setMetrics(mRes);
      setActivities(aRes || []);
      setFraudAlerts(fRes || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner label="Loading Admin Dashboard..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load dashboard metrics"
        message="Could not connect to administrative service endpoints."
        onRetry={fetchDashboardData}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Control Center"
        subtitle="System administration, faculty management, and fraud monitoring overview."
      />

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Faculty</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {metrics?.totalFaculty !== null && metrics?.totalFaculty !== undefined
                  ? metrics.totalFaculty
                  : 'No data'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Students</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {metrics?.totalStudents !== null && metrics?.totalStudents !== undefined
                  ? metrics.totalStudents
                  : 'No data'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Subjects</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {metrics?.totalSubjects !== null && metrics?.totalSubjects !== undefined
                  ? metrics.totalSubjects
                  : 'No data'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Fraud Alerts</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {metrics?.fraudAlertsCount !== null && metrics?.fraudAlertsCount !== undefined
                  ? metrics.fraudAlertsCount
                  : 'No data'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="System Overview"
          subtitle="Administrative service health & database connectivity"
          className="lg:col-span-1"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">Admin Gateway</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                ONLINE
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">Anti-Fraud Engine</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                ACTIVE
              </span>
            </div>
          </div>
        </Card>

        {/* Fraud Monitoring Summary */}
        <Card
          title="Fraud Monitoring Summary"
          subtitle="Suspicious attendance activities detected across all departments"
          className="lg:col-span-2"
        >
          {fraudAlerts.length === 0 ? (
            <EmptyState
              title="No fraud alerts available"
              description="No suspicious attendance activities or biometric anomalies have been flagged."
            />
          ) : (
            <div className="space-y-2">
              {fraudAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{alert.studentName}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">{alert.anomalyType}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                    {alert.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Administrative Activity */}
      <Card
        title="Recent Administrative Activity"
        subtitle="Audit logs of system updates, faculty provisions, and configuration changes"
      >
        {activities.length === 0 ? (
          <EmptyState
            title="No recent activity recorded"
            description="Administrative actions will appear here as faculty accounts are provisioned and settings updated."
          />
        ) : (
          <div className="space-y-2">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{act.action}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">{act.target}</p>
                </div>
                <span className="text-slate-400 text-[11px]">{act.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
