import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { VerificationStepper } from '../../components/student/VerificationStepper';
import { VerificationSummaryComponent } from '../../components/common/VerificationSummary';
import { AnalysisLoader, AnalysisLoaderState } from '../../components/common/AnalysisLoader';
import { useVerification } from '../../context/VerificationContext';
import { verificationService } from '../../services/verificationService';
import { BookOpen, User, Calendar, Clock } from 'lucide-react';

export const VerificationSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeSession, stepData, updateStepData } = useVerification();
  const [analysisState, setAnalysisState] = useState<AnalysisLoaderState>('ANALYZING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Sequence Enforcement: Must complete QR, Face, Location, and Device verification
    if (!stepData.qrVerified) {
      navigate('/student/verification/qr');
    } else if (!stepData.faceVerified) {
      navigate('/student/verification/face');
    } else if (!stepData.locationVerified) {
      navigate('/student/verification/location');
    } else if (!stepData.deviceVerified) {
      navigate('/student/verification/device');
    }
  }, [stepData.qrVerified, stepData.faceVerified, stepData.locationVerified, stepData.deviceVerified, navigate]);

  const runAnalysis = useCallback(async () => {
    if (!activeSession && !stepData.sessionId) {
      setAnalysisState('SESSION_EXPIRED');
      return;
    }

    setAnalysisState('ANALYZING');
    setErrorMessage(null);

    try {
      const sessionId = activeSession?.id || stepData.sessionId || 'live-session-id';
      const decision = await verificationService.evaluateFinalDecision(sessionId, {
        qrVerified: stepData.qrVerified,
        faceVerified: stepData.faceVerified,
        locationVerified: stepData.locationVerified,
        deviceVerified: stepData.deviceVerified,
      });

      updateStepData({
        finalDecision: decision,
        overallStatus: decision.overallStatus || decision.status,
        finalAttendanceStatus:
          decision.finalAttendanceStatus ||
          (decision.status === 'SAFE'
            ? 'PRESENT'
            : decision.status === 'SUSPICIOUS'
            ? 'PENDING_REVIEW'
            : 'NOT_MARKED'),
        fraudStatus: decision.fraudStatus || decision.status,
        riskLevel: decision.riskLevel || null,
        riskScore: decision.riskScore ?? null,
      });

      setAnalysisState('ANALYSIS_COMPLETE');
      // Navigate to final result
      navigate('/student/verification/result');
    } catch (err: any) {
      setAnalysisState('ANALYSIS_FAILED');
      setErrorMessage(err?.message || 'Unable to complete attendance analysis.');
    }
  }, [activeSession, stepData, updateStepData, navigate]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  if (!activeSession && analysisState === 'SESSION_EXPIRED') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          title="Attendance Analysis"
          subtitle="Your verification signals are being evaluated."
        />
        <Card>
          <AnalysisLoader
            state="SESSION_EXPIRED"
            onReturnToLiveSessions={() => navigate('/student/live-sessions')}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Attendance Security Analysis"
        subtitle="Your verification signals are being evaluated by the backend system."
      />

      <VerificationStepper
        currentStep="summary"
        stepStatuses={{
          qr: stepData.qrStatus,
          face: stepData.faceStatus,
          location: stepData.locationStatus,
          device: stepData.deviceStatus,
        }}
      />

      {/* Class Session Metadata */}
      {activeSession && (
        <Card title="Class Session Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium uppercase">Subject</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {activeSession.subjectCode} - {activeSession.subjectName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <User className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium uppercase">Faculty</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {activeSession.facultyName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium uppercase">Date</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {activeSession.sessionDate}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-medium uppercase">Time</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {activeSession.startTime} - {activeSession.endTime}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* AI Analysis State & Loading Indicator */}
      <Card>
        <AnalysisLoader
          state={analysisState}
          errorMessage={errorMessage}
          onRetry={runAnalysis}
          onReturnToLiveSessions={() => navigate('/student/live-sessions')}
        />
      </Card>

      {/* Verification Signal Summary */}
      <Card title="Submitted Security Signals" subtitle="Biometric and location tokens are stripped for privacy">
        <VerificationSummaryComponent
          qrStatus={stepData.qrStatus}
          faceStatus={stepData.faceStatus}
          locationStatus={stepData.locationStatus}
          deviceStatus={stepData.deviceStatus}
        />
      </Card>
    </div>
  );
};
