import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FraudStatusBadge } from '../../components/common/FraudStatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { VerificationSummaryComponent } from '../../components/common/VerificationSummary';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { adminService } from '../../services/adminService';
import { FraudAlert } from '../../types';
import { ArrowLeft, User, BookOpen, Calendar, Clock } from 'lucide-react';

export const FraudDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [alertDetails, setAlertDetails] = useState<FraudAlert | null>(null);

  const fetchAlertDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const data = await adminService.getFraudAlertById(id);
      setAlertDetails(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner label="Loading Fraud Alert Details..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load fraud alert details"
        message="Failed to retrieve security alert payload from server."
        onRetry={fetchAlertDetails}
      />
    );
  }

  if (!alertDetails) {
    return (
      <EmptyState
        title="Fraud alert record not found"
        description="No alert matching the specified alert ID exists in the security database."
        actionLabel="Back to Fraud Monitoring"
        onAction={() => navigate('/admin/fraud')}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Admin Fraud Record Details"
        subtitle={`Alert Record ID: ${alertDetails.id}`}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/admin/fraud')}
          >
            Back to Fraud Monitoring
          </Button>
        }
      />

      {/* Student & Session Context Card */}
      <Card title="Attendance Event Context" subtitle="Non-sensitive session and identity details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <User className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Student & Student ID</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{alertDetails.studentName}</p>
              <p className="font-mono text-[11px] text-slate-500">{alertDetails.studentRoll}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <BookOpen className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Subject & Faculty</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{alertDetails.subjectName || alertDetails.subjectCode || 'Subject'}</p>
              <p className="text-[11px] text-slate-500">{alertDetails.facultyName || 'Faculty Member'}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <Calendar className="w-4 h-4 text-purple-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Session ID & Date</p>
              <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{alertDetails.sessionId}</p>
              <p className="text-slate-500">{alertDetails.sessionDate || alertDetails.timestamp?.split('T')[0]}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Time</p>
              <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {alertDetails.sessionTime || alertDetails.timestamp?.split('T')[1]?.substring(0, 5) || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Outcome Banner */}
      <Card title="Final Backend Assessment">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-semibold text-slate-500">Attendance Status</p>
            <StatusBadge status={alertDetails.attendanceStatus || 'PENDING_REVIEW'} />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-semibold text-slate-500">Fraud Status</p>
            <FraudStatusBadge status={alertDetails.fraudStatus || 'SUSPICIOUS'} />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <p className="font-semibold text-slate-500">Risk Level</p>
            <RiskBadge riskLevel={alertDetails.riskLevel || (alertDetails.severity === 'CRITICAL' ? 'HIGH' : alertDetails.severity || 'MEDIUM')} />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
          {typeof alertDetails.riskScore === 'number' ? (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Risk Score</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {alertDetails.riskScore} / 100
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              Risk assessment available after analysis.
            </p>
          )}
        </div>
      </Card>

      {/* Verification Summary Component */}
      <Card title="Verification Summary" subtitle="Anti-fraud verification status indicators">
        <VerificationSummaryComponent summary={alertDetails.verificationSummary} />
      </Card>
    </div>
  );
};
