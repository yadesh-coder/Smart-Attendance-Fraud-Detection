import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FraudStatusBadge } from '../../components/common/FraudStatusBadge';
import { RiskBadge } from '../../components/common/RiskBadge';
import { VerificationSummaryComponent } from '../../components/common/VerificationSummary';
import { facultyService } from '../../services/facultyService';
import { FraudAlert } from '../../types';
import { ArrowLeft, User, BookOpen, Calendar, Clock, AlertCircle } from 'lucide-react';

export const FacultyFraudDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [alert, setAlert] = useState<FraudAlert | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAlertDetails = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await facultyService.getFraudAlertById(id);
        if (isMounted) {
          setAlert(data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch fraud investigation record from backend.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAlertDetails();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading fraud investigation details...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/faculty/fraud-alerts')}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <PageHeader
          title={alert ? `Fraud Details: ${alert.studentName}` : 'Faculty Fraud Details'}
          subtitle={alert ? `Student ID: ${alert.studentRoll} | Session: ${alert.sessionId}` : 'Anomaly evaluation breakdown'}
        />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!alert ? (
        <Card>
          <div className="p-8 text-center text-slate-500 text-xs">
            Fraud record with ID "{id}" was not returned by the backend server.
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Event Context */}
          <Card title="Attendance Attempt Context">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <User className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-500 dark:text-slate-400">Student & ID</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{alert.studentName}</p>
                  <p className="font-mono text-[11px] text-slate-500">{alert.studentRoll}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <BookOpen className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-500 dark:text-slate-400">Subject</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{alert.subjectName || alert.subjectCode || 'N/A'}</p>
                  <p className="text-[11px] text-slate-500">Session ID: {alert.sessionId}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <Calendar className="w-4 h-4 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-500 dark:text-slate-400">Date</p>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{alert.sessionDate || alert.timestamp?.split('T')[0]}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-500 dark:text-slate-400">Time</p>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    {alert.sessionTime || alert.timestamp?.split('T')[1]?.substring(0, 5) || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Final Result Card */}
          <Card title="Final Backend Result">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                <p className="font-semibold text-slate-500">Attendance Status</p>
                <StatusBadge status={alert.attendanceStatus || 'PENDING_REVIEW'} />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                <p className="font-semibold text-slate-500">Fraud Status</p>
                <FraudStatusBadge status={alert.fraudStatus || 'SUSPICIOUS'} />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                <p className="font-semibold text-slate-500">Risk Level</p>
                <RiskBadge riskLevel={alert.riskLevel || (alert.severity === 'CRITICAL' ? 'HIGH' : alert.severity || 'MEDIUM')} />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              {typeof alert.riskScore === 'number' ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Risk Score</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {alert.riskScore} / 100
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Risk assessment available after analysis.
                </p>
              )}
            </div>
          </Card>

          {/* Verification Summary */}
          <Card title="Verification Summary" subtitle="Anti-fraud signal status breakdown">
            <VerificationSummaryComponent summary={alert.verificationSummary} />
          </Card>
        </div>
      )}
    </div>
  );
};
