import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { Camera, AlertCircle, RefreshCw, CheckCircle2, QrCode } from 'lucide-react';

interface CameraFrameProps {
  mode: 'qr' | 'face';
  instructions: string;
  onCaptureOrScan?: (data: string) => void;
  statusText?: string;
  isProcessing?: boolean;
}

export const CameraFrame: React.FC<CameraFrameProps> = ({
  mode,
  instructions,
  onCaptureOrScan,
  statusText,
  isProcessing = false,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setHasPermission(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode === 'face' ? 'user' : { ideal: 'environment' },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        streamRef.current = stream;
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
    } catch (err) {
      setHasPermission(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mode]);

  useEffect(() => {
    if (hasPermission === true && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [hasPermission]);

  const handleSimulateScan = () => {
    if (onCaptureOrScan) {
      if (showManualInput && manualInput.trim()) {
        onCaptureOrScan(manualInput.trim());
      } else if (mode === 'face') {
        const canvas = document.createElement('canvas');
        if (
          videoRef.current &&
          videoRef.current.readyState >= 2 &&
          videoRef.current.videoWidth > 0 &&
          videoRef.current.videoHeight > 0
        ) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          }
          onCaptureOrScan(canvas.toDataURL('image/jpeg', 0.95));
        } else {
          console.warn('Camera video stream is not ready or does not have valid dimensions yet.');
        }
      } else {
        onCaptureOrScan(manualInput.trim() || 'SESSION-QR-TOKEN');
      }
    }
  };

  if (hasPermission === false) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-red-900 dark:text-red-200">
            Camera Permission Denied
          </h4>
          <p className="text-xs text-red-700 dark:text-red-300">
            {mode === 'qr'
              ? 'Camera access is required to scan the attendance QR.'
              : 'Camera access is required for face verification.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={startCamera}
            className="bg-white dark:bg-slate-900"
          >
            Try Again
          </Button>
          {mode === 'qr' && (
            <Button
              variant="outline"
              size="sm"
              icon={<QrCode className="w-3.5 h-3.5" />}
              onClick={() => setShowManualInput(!showManualInput)}
              className="bg-white dark:bg-slate-900"
            >
              Enter Code Manually
            </Button>
          )}
        </div>

        {showManualInput && mode === 'qr' && (
          <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-900 space-y-3 max-w-sm mx-auto">
            <input
              type="text"
              placeholder="Paste backend QR token here..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!manualInput.trim() || isProcessing}
              onClick={handleSimulateScan}
            >
              Submit Manual QR
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live Video Camera Frame */}
      <div className="relative w-full aspect-4/3 max-w-md mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Overlay Scanner Guides */}
        {mode === 'qr' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-52 h-52 border-2 border-dashed border-blue-500/80 rounded-xl flex items-center justify-center bg-blue-500/5 backdrop-blur-[1px]">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500" />
              <div className="w-full h-0.5 bg-blue-500/70 animate-pulse shadow-sm shadow-blue-500" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-60 rounded-full border-2 border-dashed border-emerald-500/80 flex items-center justify-center bg-emerald-500/5 backdrop-blur-[1px]">
              <Camera className="w-8 h-8 text-emerald-400/60" />
            </div>
          </div>
        )}

        {/* Camera Indicator Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-bold text-slate-200 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Camera Active</span>
        </div>

        {statusText && (
          <div className="absolute bottom-3 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-semibold text-slate-300">
            {statusText}
          </div>
        )}
      </div>

      <div className="text-center space-y-3">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{instructions}</p>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            disabled={isProcessing || hasPermission === null}
            onClick={handleSimulateScan}
          >
            {isProcessing
              ? mode === 'qr'
                ? 'Validating QR...'
                : 'Verifying Face Biometrics...'
              : mode === 'qr'
              ? 'Scan & Verify QR'
              : 'Capture & Verify Face'}
          </Button>

          {mode === 'qr' && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowManualInput(!showManualInput)}
            >
              {showManualInput ? 'Hide Manual Input' : 'Manual Code'}
            </Button>
          )}
        </div>

        {showManualInput && mode === 'qr' && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 max-w-md mx-auto">
            <input
              type="text"
              placeholder="Paste session QR token here..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!manualInput.trim() || isProcessing}
              onClick={handleSimulateScan}
            >
              Validate Entered QR
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
