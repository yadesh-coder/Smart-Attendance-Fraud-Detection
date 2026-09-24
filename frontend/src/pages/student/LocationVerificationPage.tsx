import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { VerificationStepper } from '../../components/student/VerificationStepper';
import { useVerification } from '../../context/VerificationContext';
import { verificationService } from '../../services/verificationService';
import { MapPin, Navigation, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LocationVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeSession, stepData, updateStepData } = useVerification();

  const [status, setStatus] = useState<'PERMISSION_REQUIRED' | 'CHECKING' | 'VERIFIED' | 'FAILED'>('PERMISSION_REQUIRED');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Sequence Enforcement: Must complete QR and Face verification first
    if (!stepData.qrVerified) {
      navigate('/student/verification/qr');
    } else if (!stepData.faceVerified) {
      navigate('/student/verification/face');
    }
  }, [stepData.qrVerified, stepData.faceVerified, navigate]);

  if (!activeSession) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          title="3. Location Verification"
          subtitle="Verify that your current position is within the permitted attendance area."
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

  const requestAndVerifyLocation = () => {
    setStatus('CHECKING');
    setErrorMessage(null);

    const targetSessionId = activeSession?.sessionId || activeSession?.attendanceCode || (activeSession?.id ? String(activeSession.id) : '') || stepData.sessionId;

    if (!targetSessionId) {
      setStatus('FAILED');
      setErrorMessage('Attendance session location information is unavailable.');
      updateStepData({ locationVerified: false, locationStatus: 'FAILED' });
      return;
    }

    if (!navigator.geolocation) {
      setStatus('FAILED');
      setErrorMessage('Geolocation is not supported by your browser.');
      updateStepData({ locationVerified: false, locationStatus: 'FAILED' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const result = await verificationService.verifyGeolocation(latitude, longitude, targetSessionId, accuracy);

          if (result.status === 'VERIFIED' || result.isWithinRange) {
            updateStepData({
              locationVerified: true,
              latitude,
              longitude,
              locationStatus: 'VERIFIED',
            });

            setStatus('VERIFIED');

            // Proceed to Device Verification after short transition
            setTimeout(() => {
              navigate('/student/verification/device');
            }, 800);
          } else {
            setStatus('FAILED');
            const msg = (result.rawStatus as string) === 'LOCATION_OUTSIDE_RADIUS'
              ? 'Your current location is outside the allowed attendance radius.'
              : (result.statusMessage || 'Your current location is outside the allowed attendance radius.');
            setErrorMessage(msg);
            updateStepData({
              locationVerified: false,
              locationStatus: 'FAILED',
            });
          }
        } catch (err: any) {
          setStatus('FAILED');
          setErrorMessage(err?.response?.data?.message || err?.message || 'Location verification service error.');
          updateStepData({
            locationVerified: false,
            locationStatus: 'FAILED',
          });
        }
      },
      (error) => {
        setStatus('FAILED');
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage('Location permission was denied. Please allow location access in your browser.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMessage('Unable to determine your current location. Please check GPS/location services and try again.');
        } else if (error.code === error.TIMEOUT) {
          setErrorMessage('Location request timed out. Please check your signal and try again.');
        } else {
          setErrorMessage('Unable to determine your current location. Please check GPS/location services and try again.');
        }
        updateStepData({
          locationVerified: false,
          locationStatus: 'FAILED',
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (stepData.qrVerified && stepData.faceVerified) {
      requestAndVerifyLocation();
    }
  }, [stepData.qrVerified, stepData.faceVerified]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="3. Location Verification"
        subtitle="Checking whether you are within the permitted attendance area."
      />

      <VerificationStepper
        currentStep="location"
        stepStatuses={{
          qr: stepData.qrStatus,
          face: stepData.faceStatus,
          location: stepData.locationStatus,
        }}
      />

      <Card title="Location Verification">
        <div className="p-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            {status === 'CHECKING' ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : status === 'VERIFIED' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            ) : (
              <MapPin className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {status === 'CHECKING'
                ? 'Checking Location...'
                : status === 'VERIFIED'
                ? 'Location Verified'
                : status === 'FAILED'
                ? 'Location Verification Failed'
                : 'Permission Required'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Checking whether you are within the permitted attendance area.
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
              icon={status === 'CHECKING' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              disabled={status === 'CHECKING'}
              onClick={requestAndVerifyLocation}
            >
              {status === 'CHECKING' ? 'Checking Location...' : 'Try Again'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
