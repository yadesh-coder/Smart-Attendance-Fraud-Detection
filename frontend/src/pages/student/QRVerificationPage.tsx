import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { VerificationStepper } from '../../components/student/VerificationStepper';
import { CameraFrame } from '../../components/student/CameraFrame';
import { useVerification } from '../../context/VerificationContext';
import { attendanceService } from '../../services/attendanceService';
import { verificationService } from '../../services/verificationService';
import { AlertCircle, Clock, User, BookOpen, RefreshCw, XCircle, CheckCircle, QrCode, KeyRound } from 'lucide-react';

type ScanState = 'WAITING' | 'SCANNING' | 'VALIDATING' | 'VERIFIED' | 'INVALID' | 'EXPIRED' | 'FAILED';
type VerificationMethod = 'QR' | 'CODE';

export const QRVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeSession, updateStepData, stepData } = useVerification();

  const [method, setMethod] = useState<VerificationMethod>('QR');
  const [scanState, setScanState] = useState<ScanState>('WAITING');
  const [manualCode, setManualCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleScanQR = async (scannedString: string) => {
    setErrorMessage(null);
    setScanState('VALIDATING');

    try {
      const sessionId = activeSession?.id || 'live-session-id';

      let validationRes = await attendanceService.validateSessionQR(sessionId, scannedString);

      if (!validationRes || validationRes.status === 'INVALID') {
        const verResult = await verificationService.verifyQR(sessionId, scannedString);
        if (verResult.isValid) {
          validationRes = { valid: true, status: 'VALID' };
        }
      }

      if (validationRes.status === 'EXPIRED') {
        setScanState('EXPIRED');
        setErrorMessage('This attendance QR has expired.');
        updateStepData({ qrVerified: false, qrStatus: 'FAILED' });
        return;
      }

      if (validationRes.valid || validationRes.status === 'VALID') {
        setScanState('VERIFIED');
        updateStepData({
          qrVerified: true,
          qrData: scannedString,
          qrStatus: 'VERIFIED',
        });

        setTimeout(() => {
          navigate('/student/verification/face');
        }, 800);
      } else {
        setScanState('INVALID');
        setErrorMessage('Invalid attendance QR.');
        updateStepData({ qrVerified: false, qrStatus: 'FAILED' });
      }
    } catch (err: any) {
      setScanState('FAILED');
      setErrorMessage(err?.message || 'Unable to scan QR. Verification failed on backend.');
      updateStepData({ qrVerified: false, qrStatus: 'FAILED' });
    }
  };

  const handleVerifyManualCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode || manualCode.trim().length === 0) {
      setErrorMessage('Please enter the 6-digit attendance code.');
      return;
    }

    setErrorMessage(null);
    setScanState('VALIDATING');

    try {
      const res = await verificationService.verifyCode(manualCode.trim());
      if (res.isValid) {
        setScanState('VERIFIED');
        updateStepData({
          qrVerified: true,
          qrData: manualCode.trim(),
          qrStatus: 'VERIFIED',
          sessionId: res.sessionId || stepData.sessionId,
        });

        setTimeout(() => {
          navigate('/student/verification/face');
        }, 800);
      } else {
        setScanState('FAILED');
        setErrorMessage(res.statusMessage || 'Invalid or expired attendance code.');
        updateStepData({ qrVerified: false, qrStatus: 'FAILED' });
      }
    } catch (err: any) {
      setScanState('FAILED');
      setErrorMessage(err?.message || 'Attendance code verification failed.');
      updateStepData({ qrVerified: false, qrStatus: 'FAILED' });
    }
  };

  const resetScan = () => {
    setScanState('WAITING');
    setErrorMessage(null);
    setManualCode('');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="1. Attendance Verification"
        subtitle="Scan the dynamic broadcast QR code or enter the manual attendance code."
      />

      <VerificationStepper currentStep="qr" stepStatuses={{ qr: stepData.qrStatus }} />

      {activeSession && (
        <Card>
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                {activeSession.subjectCode} - {activeSession.subjectName}
              </p>
              <p className="text-slate-500 text-[11px] flex flex-wrap items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Faculty: <strong className="text-slate-700 dark:text-slate-200">{activeSession.facultyName || 'Assigned Faculty'}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Schedule: <strong className="font-mono text-slate-700 dark:text-slate-200">{activeSession.startTime} - {activeSession.endTime}</strong>
                </span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Verification Method Toggle */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
        <button
          type="button"
          onClick={() => { setMethod('QR'); resetScan(); }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all ${
            method === 'QR'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Scan QR with Camera</span>
        </button>

        <button
          type="button"
          onClick={() => { setMethod('CODE'); resetScan(); }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all ${
            method === 'CODE'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Enter Attendance Code</span>
        </button>
      </div>

      {scanState === 'INVALID' && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>Invalid attendance entry.</span>
          </div>
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={resetScan}>
            Try Again
          </Button>
        </div>
      )}

      {scanState === 'FAILED' && errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={resetScan}>
            Try Again
          </Button>
        </div>
      )}

      {scanState === 'VERIFIED' && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>Attendance Code / QR Verified Successfully! Proceeding to Face Verification...</span>
        </div>
      )}

      {method === 'QR' ? (
        <Card title="Live Session QR Scanner">
          <CameraFrame
            mode="qr"
            instructions="Scan the QR code displayed by your faculty."
            onCaptureOrScan={handleScanQR}
            isProcessing={scanState === 'VALIDATING'}
            statusText={
              scanState === 'VALIDATING'
                ? 'Validating QR...'
                : 'Position the QR code within the bounding box'
            }
          />
        </Card>
      ) : (
        <Card title="Enter Manual Attendance Code">
          <form onSubmit={handleVerifyManualCode} className="p-6 space-y-6 max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">6-Digit Attendance Code</h4>
              <p className="text-xs text-slate-500">Enter the code displayed on your faculty's screen.</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 583921"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                disabled={scanState === 'VALIDATING' || manualCode.length < 6}
                icon={scanState === 'VALIDATING' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              >
                {scanState === 'VALIDATING' ? 'Verifying Code...' : 'Verify Code'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
