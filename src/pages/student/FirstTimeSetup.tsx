import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EnrollmentStepper } from '../../components/student/EnrollmentStepper';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { studentService } from '../../services/studentService';
import {
  UserCheck,
  Camera,
  Smartphone,
  CheckCircle2,
  Lock,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

type StepType = 1 | 2 | 3 | 4;

type CameraState =
  | 'PERMISSION_REQUIRED'
  | 'CAMERA_READY'
  | 'CAPTURING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'ACCESS_DENIED';

type DeviceState =
  | 'NOT_REGISTERED'
  | 'REGISTERING'
  | 'REGISTERED'
  | 'FAILED';

export const FirstTimeSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  // Current active step
  const [currentStep, setCurrentStep] = useState<StepType>(1);

  // Enrollment completion progress flags
  const [personalDetailsCompleted, setPersonalDetailsCompleted] = useState<boolean>(false);
  const [faceEnrollmentCompleted, setFaceEnrollmentCompleted] = useState<boolean>(false);
  const [deviceRegistrationCompleted, setDeviceRegistrationCompleted] = useState<boolean>(false);
  const [enrollmentCompleted, setEnrollmentCompleted] = useState<boolean>(false);

  // Step 1 State
  const [infoLoading, setInfoLoading] = useState<boolean>(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  // Step 2 Face State
  const [cameraState, setCameraState] = useState<CameraState>('PERMISSION_REQUIRED');
  const [faceError, setFaceError] = useState<string | null>(null);

  // Step 3 Device State
  const [deviceState, setDeviceState] = useState<DeviceState>('NOT_REGISTERED');
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // Step 4 Completion State
  const [completing, setCompleting] = useState<boolean>(false);

  // Verify step access permission
  const handleGoToStep = (step: StepType) => {
    if (step === 2 && !personalDetailsCompleted) return;
    if (step === 3 && (!personalDetailsCompleted || !faceEnrollmentCompleted)) return;
    if (step === 4 && (!personalDetailsCompleted || !faceEnrollmentCompleted || !deviceRegistrationCompleted)) return;
    setCurrentStep(step);
  };

  // --- STEP 1: Personal Details Handlers ---
  const handleConfirmPersonalDetails = () => {
    if (!user) {
      setInfoError('Unable to load student information.');
      return;
    }
    setPersonalDetailsCompleted(true);
    setCurrentStep(2);
  };

  // Fetch initial enrollment status from backend on mount
  useEffect(() => {
    studentService.getEnrollmentStatus().then((status) => {
      if (status) {
        setPersonalDetailsCompleted(status.personalDetailsCompleted ?? (status as any).personalDetailsConfirmed ?? false);
        setFaceEnrollmentCompleted(status.faceEnrollmentCompleted ?? ((status as any).faceStatus === 'COMPLETED'));
        setDeviceRegistrationCompleted(status.deviceRegistrationCompleted ?? ((status as any).deviceStatus === 'COMPLETED'));
        if (status.enrollmentCompleted) {
          setEnrollmentCompleted(true);
          updateUser({ isFirstTimeSetupComplete: true });
        }
      }
    }).catch(() => {});
  }, []);

  // --- STEP 2: Face Enrollment Handlers ---
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Attach camera stream to video element when ready
  useEffect(() => {
    if ((cameraState === 'CAMERA_READY' || cameraState === 'PROCESSING') && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraState]);

  // Teardown camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleRequestCameraPermission = async () => {
    setFaceError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        streamRef.current = stream;
        setCameraState('CAMERA_READY');
      } else {
        setCameraState('ACCESS_DENIED');
        setFaceError('Camera sensors are not supported or available on this device.');
      }
    } catch (err: any) {
      setCameraState('ACCESS_DENIED');
      const errName = err?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setFaceError('Camera permission denied by user or browser security policy.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setFaceError('No camera hardware device found on this system.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setFaceError('Camera device is already in use by another application.');
      } else {
        setFaceError('Camera initialization failed: ' + (err?.message || 'Unknown error'));
      }
    }
  };

  const handleCaptureFace = async () => {
    setCameraState('PROCESSING');
    setFaceError(null);

    try {
      // Capture live video frame via canvas
      const canvas = document.createElement('canvas');
      let frameBase64 = '';
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
        frameBase64 = canvas.toDataURL('image/jpeg', 0.95);
      } else {
        setCameraState('FAILED');
        setFaceError('Camera video stream is not ready or has zero dimensions.');
        return;
      }

      // Send face enrollment request to FACE-SERVICE via API Gateway
      const response = await studentService.submitFaceEnrollment(frameBase64);
      if (response.success) {
        setCameraState('SUCCESS');
        setFaceEnrollmentCompleted(true);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      } else {
        setCameraState('FAILED');
        setFaceError(response.message || 'Face processing failed.');
      }
    } catch (err: any) {
      setCameraState('FAILED');
      setFaceError(err?.message || 'Face enrollment microservice is currently unavailable.');
    }
  };

  // --- STEP 3: Device Registration Handlers ---
  const handleRegisterDevice = async () => {
    setDeviceState('REGISTERING');
    setDeviceError(null);

    try {
      // Collect legitimate privacy-preserving browser signals
      const deviceSignals = {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'Desktop',
        language: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
        screenDimensions: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth || 24}` : '1920x1080x24',
        timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
        hardwareConcurrency: typeof navigator !== 'undefined' ? String(navigator.hardwareConcurrency || 4) : '4',
        deviceMemory: typeof navigator !== 'undefined' && (navigator as any).deviceMemory ? String((navigator as any).deviceMemory) : '8',
        touchSupport: typeof navigator !== 'undefined' ? String(navigator.maxTouchPoints || 0) : '0',
        deviceLabel: typeof navigator !== 'undefined' ? `${navigator.platform || 'Desktop'} Web Browser` : 'Primary Device',
      };

      const response = await studentService.submitDeviceRegistration(deviceSignals);
      if (response.success) {
        setDeviceState('REGISTERED');
        setDeviceRegistrationCompleted(true);

        // Fetch overall enrollment status
        const status = await studentService.getEnrollmentStatus();
        if (status.enrollmentCompleted) {
          setFaceEnrollmentCompleted(true);
          setDeviceRegistrationCompleted(true);
        }
      } else {
        setDeviceState('FAILED');
        setDeviceError(response.message || 'Device registration failed.');
      }
    } catch (err: any) {
      setDeviceState('FAILED');
      setDeviceError(err?.message || 'Device registration microservice is currently unavailable.');
    }
  };

  // --- STEP 4: Complete Enrollment Handler ---
  const handleFinalizeEnrollment = async () => {
    setCompleting(true);
    try {
      await studentService.completeEnrollment();
      const status = await studentService.getEnrollmentStatus();
      if (status.enrollmentCompleted) {
        updateUser({ isFirstTimeSetupComplete: true });
        setEnrollmentCompleted(true);
        addToast('success', 'Enrollment Complete', 'First-time enrollment complete!');
        navigate('/student/dashboard');
      } else {
        addToast('error', 'Enrollment Incomplete', 'Backend reports enrollment steps are still pending.');
      }
    } catch (err: any) {
      addToast('error', 'Enrollment Error', 'Failed to complete enrollment on backend.');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Student First-Time Enrollment"
        subtitle="Complete initial registration steps before joining live class attendance sessions."
      />

      <EnrollmentStepper
        currentStep={currentStep}
        stepsCompleted={{
          personalDetails: personalDetailsCompleted,
          faceEnrollment: faceEnrollmentCompleted,
          deviceRegistration: deviceRegistrationCompleted,
          complete: enrollmentCompleted,
        }}
      />

      {/* STEP 1: PERSONAL DETAILS */}
      {currentStep === 1 && (
        <Card title="Step 1 — Personal Details" subtitle="Review institution-enrolled academic parameters">
          {infoError ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{infoError}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInfoError(null)}
              >
                Try Again
              </Button>
            </div>
          ) : !user ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading student information...
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Student ID (Institution Locked)
                  </label>
                  <div className="flex items-center space-x-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 font-mono font-bold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>STU-2026-089</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={user.name || 'Student Name'}
                    disabled
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={user.email || 'student@university.edu'}
                  disabled
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Department
                  </label>
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold flex items-center justify-between">
                    <span>{user.department || 'Computer Science'}</span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Year
                  </label>
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold flex items-center justify-between">
                    <span>Year 3</span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Section
                  </label>
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold flex items-center justify-between">
                    <span>Section A</span>
                    <Lock className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                Note: Institution-controlled academic parameters (Student ID, Department, Year, Section) cannot be changed.
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleConfirmPersonalDetails}
                >
                  Confirm & Continue
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* STEP 2: FACE ENROLLMENT */}
      {currentStep === 2 && (
        <Card title="Face Enrollment" subtitle="Step 2 of 3 — Biometric Face Registration">
          <div className="space-y-6">
            {faceError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{faceError}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestCameraPermission}
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Camera Area Box */}
            <div className="relative w-full aspect-4/3 max-w-md mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl flex flex-col items-center justify-center p-4 text-center">
              {cameraState === 'PERMISSION_REQUIRED' && (
                <div className="space-y-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium">
                    Camera access is required to complete face enrollment.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRequestCameraPermission}
                  >
                    Allow Camera
                  </Button>
                </div>
              )}

              {cameraState === 'ACCESS_DENIED' && (
                <div className="space-y-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-red-900/60 text-red-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-red-300 font-medium">
                    Unable to access camera.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-slate-900 text-slate-200 border-slate-700"
                    onClick={handleRequestCameraPermission}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {(cameraState === 'CAMERA_READY' || cameraState === 'PROCESSING') && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="relative z-10 w-44 h-56 rounded-full border-2 border-dashed border-emerald-500/80 flex items-center justify-center bg-emerald-500/5">
                    <Camera className="w-8 h-8 text-emerald-400/50" />
                  </div>
                  <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-bold text-slate-200 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Camera Active</span>
                  </div>
                </>
              )}

              {cameraState === 'SUCCESS' && (
                <div className="space-y-3 p-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      ✓ Successfully enrolled
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Face enrollment complete for future attendance checks.
                    </p>
                  </div>
                </div>
              )}

              {cameraState === 'FAILED' && (
                <div className="space-y-3 p-4">
                  <div className="w-12 h-12 rounded-full bg-red-900/60 text-red-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-red-300 font-medium">
                    Face enrollment failed.
                  </p>
                </div>
              )}
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Position your face inside the frame.
              </p>

              {cameraState === 'CAMERA_READY' && (
                <Button
                  variant="primary"
                  size="md"
                  icon={<Camera className="w-4 h-4" />}
                  onClick={handleCaptureFace}
                >
                  Start Face Enrollment
                </Button>
              )}

              {cameraState === 'PROCESSING' && (
                <Button variant="primary" size="md" disabled icon={<RefreshCw className="w-4 h-4 animate-spin" />}>
                  Processing face enrollment...
                </Button>
              )}

              {cameraState === 'SUCCESS' && (
                <Button
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setCurrentStep(3)}
                >
                  Continue to Device Registration
                </Button>
              )}

              {cameraState === 'FAILED' && (
                <Button
                  variant="primary"
                  size="md"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={handleCaptureFace}
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: DEVICE REGISTRATION */}
      {currentStep === 3 && (
        <Card title="Step 3 — Device Registration" subtitle="Associate your current device with your account for attendance security">
          <div className="p-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              {deviceState === 'REGISTERING' ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : deviceState === 'REGISTERED' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              ) : (
                <Smartphone className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Register this device for attendance verification.
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                This device will be associated with your account for attendance security.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 max-w-md mx-auto flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Device Status</span>
              <StatusBadge
                status={
                  deviceState === 'REGISTERED'
                    ? 'REGISTERED'
                    : deviceState === 'REGISTERING'
                    ? 'PENDING'
                    : deviceState === 'FAILED'
                    ? 'FAILED'
                    : 'PENDING'
                }
                label={
                  deviceState === 'REGISTERED'
                    ? 'Registered'
                    : deviceState === 'REGISTERING'
                    ? 'Registering...'
                    : deviceState === 'FAILED'
                    ? 'Failed'
                    : 'Not Registered'
                }
              />
            </div>

            {deviceError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-center space-x-2 max-w-md mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deviceError}</span>
              </div>
            )}

            <div className="pt-2">
              {deviceState === 'NOT_REGISTERED' && (
                <Button
                  variant="primary"
                  size="md"
                  icon={<Smartphone className="w-4 h-4" />}
                  onClick={handleRegisterDevice}
                >
                  Register Device
                </Button>
              )}

              {deviceState === 'REGISTERING' && (
                <Button variant="primary" size="md" disabled icon={<RefreshCw className="w-4 h-4 animate-spin" />}>
                  Registering device...
                </Button>
              )}

              {deviceState === 'REGISTERED' && (
                <Button
                  variant="primary"
                  size="md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setCurrentStep(4)}
                >
                  Continue
                </Button>
              )}

              {deviceState === 'FAILED' && (
                <Button
                  variant="primary"
                  size="md"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={handleRegisterDevice}
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* STEP 4: COMPLETE */}
      {currentStep === 4 && (
        <Card>
          <div className="p-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Enrollment Complete
              </h3>
              <p className="text-xs text-slate-500">
                Your account is ready for attendance verification.
              </p>
            </div>

            {/* Summary checklist */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 max-w-md mx-auto space-y-2 text-xs text-left">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Personal Details</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Complete</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Face Enrollment</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Enrolled</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Device Registration</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Registered</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                icon={completing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                disabled={completing}
                onClick={handleFinalizeEnrollment}
              >
                {completing ? 'Completing enrollment...' : 'Go to Dashboard'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
