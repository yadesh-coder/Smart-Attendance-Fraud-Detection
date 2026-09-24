import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { VerificationStepper } from '../../components/student/VerificationStepper';
import { useVerification } from '../../context/VerificationContext';
import { verificationService } from '../../services/verificationService';
import { Smartphone, RefreshCw, ShieldCheck, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const DeviceVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeSession, stepData, updateStepData } = useVerification();

  const [status, setStatus] = useState<'CHECKING' | 'VERIFIED' | 'UNRECOGNIZED' | 'FAILED' | 'SUSPICIOUS'>('CHECKING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Sequence Enforcement: Must complete QR, Face, and Location verification first
    if (!stepData.qrVerified) {
      navigate('/student/verification/qr');
    } else if (!stepData.faceVerified) {
      navigate('/student/verification/face');
    } else if (!stepData.locationVerified) {
      navigate('/student/verification/location');
    }
  }, [stepData.qrVerified, stepData.faceVerified, stepData.locationVerified, navigate]);

  if (!activeSession) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          title="4. Device Verification"
          subtitle="Checking your registered attendance device."
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

  const runDeviceVerification = async () => {
    setStatus('CHECKING');
    setErrorMessage(null);

    try {
      // Execute backend device verification without displaying raw fingerprint
      const result = await verificationService.verifyDevice();

      if (result.status === 'VERIFIED' || result.isRecognized) {
        updateStepData({
          deviceVerified: true,
          deviceStatus: 'VERIFIED',
        });

        setStatus('VERIFIED');

        // Transition to Verification Summary step
        setTimeout(() => {
          navigate('/student/verification/summary');
        }, 800);
      } else if (result.status === 'SUSPICIOUS') {
        setStatus('SUSPICIOUS');
        setErrorMessage('Device verification requires review.');
        updateStepData({
          deviceVerified: false,
          deviceStatus: 'SUSPICIOUS',
        });
      } else {
        setStatus('FAILED');
        setErrorMessage('Device verification failed.');
        updateStepData({
          deviceVerified: false,
          deviceStatus: 'FAILED',
        });
      }
    } catch (err: any) {
      setStatus('FAILED');
      setErrorMessage(err?.message || 'Device verification failed.');
      updateStepData({
        deviceVerified: false,
        deviceStatus: 'FAILED',
      });
    }
  };

  useEffect(() => {
    if (stepData.qrVerified && stepData.faceVerified && stepData.locationVerified) {
      runDeviceVerification();
    }
  }, [stepData.qrVerified, stepData.faceVerified, stepData.locationVerified]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="4. Device Verification"
        subtitle="Checking your registered attendance device."
      />

      <VerificationStepper
        currentStep="device"
        stepStatuses={{
          qr: stepData.qrStatus,
          face: stepData.faceStatus,
          location: stepData.locationStatus,
          device: stepData.deviceStatus,
        }}
      />

      <Card title="Device Verification">
        <div className="p-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            {status === 'CHECKING' ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : status === 'VERIFIED' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            ) : status === 'SUSPICIOUS' ? (
              <ShieldAlert className="w-8 h-8 text-amber-500" />
            ) : (
              <Smartphone className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {status === 'CHECKING'
                ? 'Checking Device Registered...'
                : status === 'VERIFIED'
                ? 'Device Verified'
                : status === 'UNRECOGNIZED'
                ? 'Device Not Recognized'
                : status === 'SUSPICIOUS'
                ? 'Device Verification Requires Review'
                : 'Device Verification Failed'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Checking your registered attendance device.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-center space-x-2 max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              icon={status === 'CHECKING' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              disabled={status === 'CHECKING'}
              onClick={runDeviceVerification}
            >
              {status === 'CHECKING' ? 'Checking Device...' : 'Try Again'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
