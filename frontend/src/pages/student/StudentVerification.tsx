import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { VerificationStepper } from '../../components/student/VerificationStepper';
import { useVerification } from '../../context/VerificationContext';
import { BookOpen, User, Clock, ArrowRight, ShieldCheck, QrCode, Camera, MapPin, Smartphone, AlertCircle } from 'lucide-react';

export const StudentVerification: React.FC = () => {
  const navigate = useNavigate();
  const { activeSession, stepData } = useVerification();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Session Attendance Verification"
        subtitle="Complete the required multi-factor security checks to record your attendance."
      />

      <VerificationStepper
        currentStep="qr"
        stepStatuses={{
          qr: stepData.qrStatus,
          face: stepData.faceStatus,
          location: stepData.locationStatus,
          device: stepData.deviceStatus,
        }}
      />

      {/* Current Session Banner */}
      <Card title="Target Class Session">
        {activeSession ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                  {activeSession.subjectCode} - {activeSession.subjectName}
                </p>
                <p className="text-slate-500 text-[11px] flex flex-wrap items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {activeSession.facultyName}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {activeSession.startTime} - {activeSession.endTime}</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Required Verification Sequence
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center space-x-2.5">
                    <QrCode className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">1. QR Code Scan</span>
                  </div>
                  <StatusBadge status={stepData.qrStatus} />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center space-x-2.5">
                    <Camera className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">2. Face Biometric Check</span>
                  </div>
                  <StatusBadge status={stepData.faceStatus} />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center space-x-2.5">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">3. Geofence Location Proximity</span>
                  </div>
                  <StatusBadge status={stepData.locationStatus} />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center space-x-2.5">
                    <Smartphone className="w-4 h-4 text-purple-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">4. Hardware Device Binding</span>
                  </div>
                  <StatusBadge status={stepData.deviceStatus} />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/student/verification/qr')}
              >
                Begin Verification Flow
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                No Active Class Session Selected
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Please select an active live session from the Live Sessions broadcast page before starting verification.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/student/live-sessions')}
            >
              Go to Live Sessions
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
