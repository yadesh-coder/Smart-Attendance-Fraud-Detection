import { apiClient } from './apiClient';

export interface QRVerificationResult {
  isValid: boolean;
  sessionId: string;
  subjectCode?: string;
  statusMessage: string;
  status?: 'VERIFIED' | 'FAILED' | 'SUSPICIOUS';
  verificationAttemptId?: string;
  faceStatus?: string;
  locationStatus?: string;
  deviceStatus?: string;
  overallStatus?: string;
}

export interface FaceVerificationResult {
  isMatch: boolean;
  status: 'VERIFIED' | 'FAILED' | 'SUSPICIOUS' | 'NOT_AVAILABLE';
  rawStatus?: 'FACE_MATCH' | 'FACE_MISMATCH' | 'NOT_AVAILABLE';
  confidenceScore?: number;
  statusMessage: string;
}

export interface LocationVerificationResult {
  isWithinRange: boolean;
  status: 'VERIFIED' | 'FAILED' | 'SUSPICIOUS' | 'NOT_AVAILABLE';
  rawStatus?: 'LOCATION_VALID' | 'OUT_OF_BOUNDS' | 'NOT_AVAILABLE';
  distanceMeters?: number;
  statusMessage: string;
}

export interface DeviceVerificationResult {
  isRecognized: boolean;
  status: 'VERIFIED' | 'FAILED' | 'SUSPICIOUS' | 'NOT_AVAILABLE';
  rawStatus?: 'DEVICE_RECOGNIZED' | 'NEW_DEVICE' | 'DEVICE_MISMATCH' | 'NOT_AVAILABLE';
  statusMessage: string;
}

export interface TriggeredRule {
  ruleCode: string;
  ruleDescription: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface FraudAssessmentData {
  assessmentId: string;
  attemptId: string;
  sessionId: string;
  studentUserId: number;
  qrStatus: string;
  faceStatus: string;
  deviceStatus: string;
  locationStatus: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  decision: 'PENDING' | 'SAFE' | 'SUSPICIOUS' | 'REJECTED';
  triggeredRules: TriggeredRule[];
  createdAt: string;
}

export interface FinalAttendanceDecision {
  attemptId?: string;
  status: 'SAFE' | 'SUSPICIOUS' | 'REJECTED' | 'PENDING';
  overallStatus?: 'SAFE' | 'SUSPICIOUS' | 'REJECTED' | 'PENDING';
  finalAttendanceStatus?: 'PRESENT' | 'SUSPICIOUS' | 'REJECTED' | 'PENDING';
  attendanceStatus?: 'PRESENT' | 'SUSPICIOUS' | 'REJECTED' | 'PENDING';
  fraudStatus?: 'SAFE' | 'SUSPICIOUS' | 'REJECTED' | 'PENDING';
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  riskScore?: number | null;
  failedStep?: 'QR' | 'FACE' | 'LOCATION' | 'DEVICE' | null;
  rawQrStatus?: string;
  rawFaceStatus?: string;
  rawDeviceStatus?: string;
  rawLocationStatus?: string;
  mlAnomalyScore?: number | null;
  mlAnomalyLabel?: 'NORMAL' | 'ANOMALOUS' | null;
  verificationSummary: {
    qrStatus: 'VERIFIED' | 'FAILED' | 'SUSPICIOUS' | 'PENDING';
    faceStatus: 'VERIFIED' | 'FAILED' | 'SUSPICIOUS' | 'PENDING' | 'NOT_AVAILABLE';
    locationStatus: 'VERIFIED' | 'FAILED' | 'SUSPICIOUS' | 'PENDING' | 'NOT_AVAILABLE';
    deviceStatus: 'VERIFIED' | 'FAILED' | 'SUSPICIOUS' | 'PENDING' | 'NOT_AVAILABLE';
  };
  message: string;
}

export const verificationService = {
  async verifyQR(sessionId: string, qrData: string): Promise<QRVerificationResult> {
    try {
      const res = await apiClient.post<any>('/api/student/attendance/verify-qr', { qrToken: qrData, sessionId });
      return {
        isValid: res.qrStatus === 'QR_VALID',
        sessionId: res.sessionId || sessionId,
        statusMessage: 'QR Code Validated Successfully',
        status: 'VERIFIED',
        verificationAttemptId: res.verificationAttemptId || res.attemptId,
        faceStatus: res.faceStatus || 'NOT_AVAILABLE',
        locationStatus: res.locationStatus || 'NOT_AVAILABLE',
        deviceStatus: res.deviceStatus || 'NOT_AVAILABLE',
        overallStatus: res.overallStatus || 'PENDING',
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'QR Verification failed.';
      return {
        isValid: false,
        sessionId: sessionId || '',
        statusMessage: msg,
        status: 'FAILED',
      };
    }
  },

  async verifyCode(attendanceCode: string): Promise<QRVerificationResult> {
    try {
      const res = await apiClient.post<any>('/api/student/attendance/verify-code', { attendanceCode });
      return {
        isValid: res.qrStatus === 'QR_VALID',
        sessionId: res.sessionId,
        statusMessage: 'Attendance Code Verified Successfully',
        status: 'VERIFIED',
        verificationAttemptId: res.verificationAttemptId || res.attemptId,
        faceStatus: res.faceStatus || 'NOT_AVAILABLE',
        locationStatus: res.locationStatus || 'NOT_AVAILABLE',
        deviceStatus: res.deviceStatus || 'NOT_AVAILABLE',
        overallStatus: res.overallStatus || 'PENDING',
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid or expired attendance code.';
      return {
        isValid: false,
        sessionId: '',
        statusMessage: msg,
        status: 'FAILED',
      };
    }
  },

  async verifyFace(frameBase64?: string, sessionId?: string): Promise<FaceVerificationResult> {
    try {
      const payload: any = {};
      if (frameBase64) payload.frame = frameBase64;
      if (sessionId) payload.sessionId = sessionId;

      const res = await apiClient.post<any>('/api/student/face/verify', payload);

      const statusStr = res.status || (res.verified ? 'FACE_MATCH' : 'FACE_MISMATCH');
      const isMatch = res.verified === true || statusStr === 'FACE_MATCH';

      return {
        isMatch: isMatch,
        status: isMatch ? 'VERIFIED' : (statusStr === 'FACE_ENROLLMENT_REQUIRED' ? 'NOT_AVAILABLE' : 'FAILED'),
        rawStatus: statusStr,
        confidenceScore: isMatch ? 0.96 : 0.0,
        statusMessage: res.message || (isMatch ? 'Face biometric frame verified successfully.' : 'Face verification failed.'),
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Face verification failed.';
      return {
        isMatch: false,
        status: 'FAILED',
        rawStatus: 'FACE_MISMATCH',
        statusMessage: msg,
      };
    }
  },

  async verifyGeolocation(
    lat: number,
    lng: number,
    sessionId: string,
    accuracyMeters?: number
  ): Promise<LocationVerificationResult> {
    try {
      const res = await apiClient.post<any>('/api/student/location/verify', {
        sessionId,
        latitude: lat,
        longitude: lng,
        accuracyMeters: accuracyMeters || 10.0,
        accuracy: accuracyMeters || 10.0,
      });

      const isVerified = res.verified === true || res.status === 'LOCATION_VALID';
      return {
        isWithinRange: isVerified,
        status: isVerified ? 'VERIFIED' : 'FAILED',
        rawStatus: isVerified ? 'LOCATION_VALID' : 'OUT_OF_BOUNDS',
        distanceMeters: res.distanceMeters,
        statusMessage: res.message || (isVerified ? 'Location verified within session attendance area.' : 'Location verification failed.'),
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Location verification service error.';
      return {
        isWithinRange: false,
        status: 'FAILED',
        rawStatus: 'OUT_OF_BOUNDS',
        statusMessage: msg,
      };
    }
  },

  async verifyDevice(deviceSignals?: any): Promise<DeviceVerificationResult> {
    try {
      const signals = deviceSignals || {
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

      const res = await apiClient.post<any>('/api/student/device/enroll', signals);
      const isOk = res.status === 'COMPLETED' || res.enrolled === true;
      return {
        isRecognized: isOk,
        status: isOk ? 'VERIFIED' : 'SUSPICIOUS',
        rawStatus: isOk ? 'DEVICE_RECOGNIZED' : 'NEW_DEVICE',
        statusMessage: res.message || 'Device signals verified successfully.',
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Device verification failed.';
      return {
        isRecognized: false,
        status: 'FAILED',
        rawStatus: 'DEVICE_MISMATCH',
        statusMessage: msg,
      };
    }
  },

  async getFraudAssessmentByAttempt(attemptId: string): Promise<FraudAssessmentData | null> {
    try {
      return await apiClient.get<FraudAssessmentData>(`/api/fraud/assessments/attempt/${attemptId}`);
    } catch {
      return null;
    }
  },

  async getFraudAssessmentBySession(sessionId: string): Promise<FraudAssessmentData[]> {
    try {
      return await apiClient.get<FraudAssessmentData[]>(`/api/fraud/assessments/session/${sessionId}`);
    } catch {
      return [];
    }
  },

  async evaluateFinalDecision(sessionId: string, stepData: any): Promise<FinalAttendanceDecision> {
    try {
      // 1. Fetch current student profile to get studentUserId
      const profile = await apiClient.get<any>('/api/student/profile');
      const studentUserId = profile.userId || profile.id;

      const faceStatus = stepData.rawFaceStatus || (stepData.faceVerified ? 'FACE_MATCH' : 'FACE_MISMATCH');
      const deviceStatus = stepData.rawDeviceStatus || (stepData.deviceVerified ? 'DEVICE_RECOGNIZED' : 'NEW_DEVICE');
      const locationStatus = stepData.rawLocationStatus || (stepData.locationVerified ? 'LOCATION_VALID' : 'OUT_OF_BOUNDS');

      // 2. Submit multi-signal update to ATTENDANCE-SERVICE
      const updateRes = await apiClient.put<any>('/api/student/attendance/location-status', {
        sessionId: sessionId,
        studentUserId: studentUserId,
        faceStatus: faceStatus,
        deviceStatus: deviceStatus,
        locationStatus: locationStatus,
      });

      const attemptId = updateRes.verificationAttemptId || updateRes.attemptId || stepData.attemptId;

      // 3. Evaluate Fraud Service Assessment
      let fraudAssessment: FraudAssessmentData | null = null;
      if (attemptId) {
        fraudAssessment = await this.getFraudAssessmentByAttempt(attemptId);
      }

      // 4. Invoke ML Service Feature Generation & IsolationForest Inference
      let mlData: any = null;
      if (attemptId) {
        try {
          mlData = await apiClient.post<any>('/api/ml/features/generate', { attemptId });
        } catch (e) {
          console.warn('ML Service feature generation skipped or pending:', e);
        }
      }

      const decision = fraudAssessment?.decision || 'SAFE';
      const riskLevel = fraudAssessment?.riskLevel || 'LOW';
      const attendanceStatus = decision === 'SAFE' ? 'PRESENT' : decision === 'SUSPICIOUS' ? 'SUSPICIOUS' : 'REJECTED';

      return {
        attemptId: attemptId,
        status: decision,
        overallStatus: decision,
        finalAttendanceStatus: attendanceStatus,
        attendanceStatus: attendanceStatus,
        fraudStatus: decision,
        riskLevel: riskLevel,
        riskScore: riskLevel === 'LOW' ? 5 : riskLevel === 'HIGH' ? 65 : riskLevel === 'CRITICAL' ? 95 : 25,
        rawQrStatus: 'QR_VALID',
        rawFaceStatus: faceStatus,
        rawDeviceStatus: deviceStatus,
        rawLocationStatus: locationStatus,
        mlAnomalyScore: mlData?.anomaly_score ?? null,
        mlAnomalyLabel: mlData?.anomaly_label ?? null,
        failedStep: decision === 'REJECTED' ? (faceStatus === 'FACE_MISMATCH' ? 'FACE' : locationStatus === 'OUT_OF_BOUNDS' ? 'LOCATION' : 'DEVICE') : null,
        verificationSummary: {
          qrStatus: 'VERIFIED',
          faceStatus: faceStatus === 'FACE_MATCH' ? 'VERIFIED' : 'FAILED',
          locationStatus: locationStatus === 'LOCATION_VALID' ? 'VERIFIED' : 'FAILED',
          deviceStatus: deviceStatus === 'DEVICE_RECOGNIZED' ? 'VERIFIED' : deviceStatus === 'NEW_DEVICE' ? 'SUSPICIOUS' : 'FAILED',
        },
        message: decision === 'SAFE'
          ? 'Multi-factor verification complete. Attendance recorded as PRESENT.'
          : decision === 'SUSPICIOUS'
          ? 'Attendance flagged for review due to new device or signal warning.'
          : 'Attendance verification REJECTED by fraud security engine.',
      };
    } catch (err: any) {
      console.error('Final decision evaluation error:', err);
      return {
        status: 'REJECTED',
        overallStatus: 'REJECTED',
        finalAttendanceStatus: 'REJECTED',
        attendanceStatus: 'REJECTED',
        fraudStatus: 'REJECTED',
        riskLevel: 'CRITICAL',
        riskScore: 99,
        failedStep: 'LOCATION',
        verificationSummary: {
          qrStatus: 'VERIFIED',
          faceStatus: 'FAILED',
          locationStatus: 'FAILED',
          deviceStatus: 'FAILED',
        },
        message: err?.response?.data?.message || err?.message || 'Attendance analysis failed on backend.',
      };
    }
  },
};
