import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { VerificationStepper } from '../../components/student/VerificationStepper';
import { CameraFrame } from '../../components/student/CameraFrame';
import { useVerification } from '../../context/VerificationContext';
import { verificationService } from '../../services/verificationService';
import { BookOpen, User, Calendar, Clock, AlertCircle, ShieldAlert, RefreshCw } from 'lucide-react';

export const FaceVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeSession, stepData, updateStepData } = useVerification();
  const [error, setError] = useState<string | null>(null);
  const [suspiciousMessage, setSuspiciousMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    // Sequence Enforcement: Must complete QR verification first
    if (!stepData.qrVerified) {
      navigate('/student/verification/qr');
    }
  }, [stepData.qrVerified, navigate]);

  if (!activeSession) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          title="2. Biometric Face Verification"
          subtitle="Align your face inside the camera guide frame for verification."
        />
        <Card>
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Your verification session has expired.
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Attendance session has ended or session state was lost on refresh.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/student/live-sessions')}
            >
              Return to Live Sessions
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleCaptureFace = async (data: string) => {
    setError(null);
    setSuspiciousMessage(null);
    setIsProcessing(true);

    try {
      const result = await verificationService.verifyFace(data, activeSession.id);

      if (result.status === 'VERIFIED' || result.isMatch) {
        updateStepData({
          faceVerified: true,
          faceConfidence: result.confidenceScore || 0,
          faceStatus: 'VERIFIED',
          rawFaceStatus: 'FACE_MATCH',
        });

        // Proceed seamlessly to Location Verification step
        navigate('/student/verification/location');
      } else if ((result.rawStatus as string) === 'FACE_ENROLLMENT_REQUIRED') {
        setError('First-time face biometric enrollment is required before attendance verification. Please complete biometric setup in your profile.');
        updateStepData({
          faceVerified: false,
          faceStatus: 'FAILED',
          rawFaceStatus: 'FACE_ENROLLMENT_REQUIRED',
        });
      } else if (result.status === 'SUSPICIOUS') {
        setSuspiciousMessage(result.statusMessage || 'Face verification requires additional review.');
        updateStepData({
          faceVerified: false,
          faceStatus: 'SUSPICIOUS',
          rawFaceStatus: result.rawStatus || 'FACE_MISMATCH',
        });
      } else {
        setError(result.statusMessage || 'Face verification failed. Submitted face does not match stored enrollment.');
        updateStepData({
          faceVerified: false,
          faceStatus: 'FAILED',
          rawFaceStatus: result.rawStatus || 'FACE_MISMATCH',
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Face verification failed.');
      updateStepData({
        faceVerified: false,
        faceStatus: 'FAILED',
        rawFaceStatus: 'FACE_MISMATCH',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="2. Biometric Face Verification"
        subtitle="Align your face inside the camera guide frame for live face verification."
      />

      <VerificationStepper
        currentStep="face"
        stepStatuses={{
          qr: stepData.qrStatus,
          face: stepData.faceStatus,
        }}
      />

      {/* Session Details Summary */}
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
              <p className="text-[10px] text-slate-400 font-medium uppercase">Session Date</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {activeSession.sessionDate}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-medium uppercase">Session Time</p>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {activeSession.startTime} - {activeSession.endTime}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-3 h-3" />}
            onClick={() => setError(null)}
            className="bg-white dark:bg-slate-900 border-red-200 dark:border-red-800"
          >
            Try Again
          </Button>
        </div>
      )}

      {suspiciousMessage && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{suspiciousMessage}</span>
        </div>
      )}

      <Card title="Live Face Verification">
        <CameraFrame
          mode="face"
          instructions="Position your face inside the frame."
          onCaptureOrScan={handleCaptureFace}
          isProcessing={isProcessing}
          statusText="Ensure adequate lighting and look straight into the lens"
        />
      </Card>
    </div>
  );
};
