import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { VerificationStepper } from '../../components/student/VerificationStepper';
import { AttendanceResultCard, AttendanceResultData } from '../../components/student/AttendanceResultCard';
import { useVerification } from '../../context/VerificationContext';

export const VerificationResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { stepData } = useVerification();
  const decision = stepData.finalDecision;

  // Determine failed step if any
  const getFailedStepName = () => {
    if (decision?.failedStep) return decision.failedStep;
    if (stepData.qrStatus === 'FAILED') return 'QR Verification';
    if (stepData.faceStatus === 'FAILED') return 'Face Verification';
    if (stepData.locationStatus === 'FAILED') return 'Location Verification';
    if (stepData.deviceStatus === 'FAILED') return 'Device Verification';
    return null;
  };

  const fraudStatus = decision?.fraudStatus || decision?.status || stepData.fraudStatus || 'FAILED';
  const attendanceStatus = decision?.finalAttendanceStatus || decision?.attendanceStatus || (fraudStatus === 'SAFE' ? 'PRESENT' : fraudStatus === 'SUSPICIOUS' ? 'PENDING_REVIEW' : 'FAILED');

  const resultData: AttendanceResultData = {
    attendanceStatus: attendanceStatus,
    fraudStatus: fraudStatus,
    riskLevel: decision?.riskLevel ?? stepData.riskLevel ?? null,
    riskScore: decision?.riskScore ?? stepData.riskScore ?? null,
    message: decision?.message || (fraudStatus === 'SAFE' ? 'Your attendance has been successfully recorded.' : fraudStatus === 'SUSPICIOUS' ? 'Attendance requires review by faculty.' : 'Attendance verification failed.'),
    failedStep: getFailedStepName(),
    rawQrStatus: decision?.rawQrStatus || stepData.rawQrStatus || 'QR_VALID',
    rawFaceStatus: decision?.rawFaceStatus || stepData.rawFaceStatus || (fraudStatus === 'SAFE' ? 'FACE_MATCH' : 'FACE_MISMATCH'),
    rawDeviceStatus: decision?.rawDeviceStatus || stepData.rawDeviceStatus || (fraudStatus === 'SAFE' ? 'DEVICE_RECOGNIZED' : 'NEW_DEVICE'),
    rawLocationStatus: decision?.rawLocationStatus || stepData.rawLocationStatus || (fraudStatus === 'SAFE' ? 'LOCATION_VALID' : 'OUT_OF_BOUNDS'),
    mlAnomalyScore: decision?.mlAnomalyScore ?? stepData.mlAnomalyScore ?? null,
    mlAnomalyLabel: decision?.mlAnomalyLabel ?? stepData.mlAnomalyLabel ?? null,
    verificationSummary: decision?.verificationSummary || {
      qrStatus: stepData.qrStatus,
      faceStatus: stepData.faceStatus,
      locationStatus: stepData.locationStatus,
      deviceStatus: stepData.deviceStatus,
    },
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Attendance Verification Result"
        subtitle="Final verification outcome provided by backend security analysis."
      />

      <VerificationStepper
        currentStep="result"
        stepStatuses={{
          qr: stepData.qrStatus,
          face: stepData.faceStatus,
          location: stepData.locationStatus,
          device: stepData.deviceStatus,
          result: fraudStatus,
        }}
      />

      <AttendanceResultCard
        data={resultData}
        onRetry={() => navigate('/student/verification/qr')}
        onReturnToLiveSessions={() => navigate('/student/live-sessions')}
      />
    </div>
  );
};
