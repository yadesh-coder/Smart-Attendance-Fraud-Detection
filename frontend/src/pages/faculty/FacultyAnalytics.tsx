import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { facultyService, FacultyAnalyticsData } from '../../services/facultyService';
import { BarChart3, CheckCircle2, ShieldAlert, XCircle, Percent, AlertCircle } from 'lucide-react';

export const FacultyAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<FacultyAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await facultyService.getFacultyAnalytics();
        if (isMounted) {
          setAnalytics(data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch analytics metrics from backend service.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Analytics"
        subtitle="Aggregate verification stats, proxy deterrence metrics, and class attendance trends."
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
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Attendance Rate</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {loading ? '...' : analytics?.averageAttendanceRate != null ? `${analytics.averageAttendanceRate}%` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Verified Attendance</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {loading ? '...' : analytics?.verifiedAttendanceCount ?? 0}
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
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Suspicious Attempts</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {loading ? '...' : analytics?.suspiciousAttemptsCount ?? 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Failed Verification</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {loading ? '...' : analytics?.failedVerificationCount ?? 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Attendance Reports & Verification Trends">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading analytics trends...</div>
        ) : !analytics ? (
          <EmptyState
            title="No analytics data available"
            description="Attendance analytics will populate once live session verification records are recorded by the backend."
            icon={<BarChart3 className="w-8 h-8" />}
          />
        ) : (
          <div className="p-6 text-center text-xs text-slate-500">
            Backend reporting analytics enabled. Total classes conducted: {analytics.totalClassesConducted ?? 0}.
          </div>
        )}
      </Card>
    </div>
  );
};
