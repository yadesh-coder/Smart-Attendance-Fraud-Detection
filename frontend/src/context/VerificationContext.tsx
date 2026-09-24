import React, { createContext, useContext, useState } from 'react';
import { AttendanceSession } from '../types';
import { FinalAttendanceDecision } from '../services/verificationService';

export interface VerificationStepData {
  sessionId: string | null;
  attemptId: string | null;

  qrVerified: boolean;
  qrData: string | null;
  qrStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPICIOUS';
  rawQrStatus: 'QR_VALID' | 'INVALID' | 'EXPIRED' | 'NOT_AVAILABLE';

  faceVerified: boolean;
  faceConfidence: number;
  faceStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPICIOUS';
  rawFaceStatus: 'FACE_MATCH' | 'FACE_MISMATCH' | 'NOT_AVAILABLE';

  locationVerified: boolean;
  latitude: number | null;
  longitude: number | null;
  locationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPICIOUS';
  rawLocationStatus: 'LOCATION_VALID' | 'OUT_OF_BOUNDS' | 'NOT_AVAILABLE';

  deviceVerified: boolean;
  deviceStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPICIOUS';
  rawDeviceStatus: 'DEVICE_RECOGNIZED' | 'NEW_DEVICE' | 'DEVICE_MISMATCH' | 'NOT_AVAILABLE';

  overallStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'SUSPICIOUS';
  finalAttendanceStatus: 'PRESENT' | 'PENDING_REVIEW' | 'ABSENT' | 'REJECTED' | 'NOT_MARKED' | null;
  fraudStatus: 'SAFE' | 'SUSPICIOUS' | 'REJECTED' | 'FAILED' | null;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;

  mlAnomalyScore: number | null;
  mlAnomalyLabel: 'NORMAL' | 'ANOMALOUS' | null;

  finalDecision: FinalAttendanceDecision | null;
}

interface VerificationContextType {
  activeSession: AttendanceSession | null;
  stepData: VerificationStepData;
  setActiveSession: (session: AttendanceSession | null) => void;
  updateStepData: (data: Partial<VerificationStepData>) => void;
  resetVerification: () => void;
}

const initialStepData: VerificationStepData = {
  sessionId: null,
  attemptId: null,

  qrVerified: false,
  qrData: null,
  qrStatus: 'PENDING',
  rawQrStatus: 'NOT_AVAILABLE',

  faceVerified: false,
  faceConfidence: 0,
  faceStatus: 'PENDING',
  rawFaceStatus: 'NOT_AVAILABLE',

  locationVerified: false,
  latitude: null,
  longitude: null,
  locationStatus: 'PENDING',
  rawLocationStatus: 'NOT_AVAILABLE',

  deviceVerified: false,
  deviceStatus: 'PENDING',
  rawDeviceStatus: 'NOT_AVAILABLE',

  overallStatus: 'PENDING',
  finalAttendanceStatus: null,
  fraudStatus: null,
  riskLevel: null,

  mlAnomalyScore: null,
  mlAnomalyLabel: null,

  finalDecision: null,
};

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

export const VerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSessionState] = useState<AttendanceSession | null>(null);
  const [stepData, setStepData] = useState<VerificationStepData>(initialStepData);

  const handleSetActiveSession = (session: AttendanceSession | null) => {
    setActiveSessionState(session);
    if (session) {
      setStepData((prev) => ({ ...prev, sessionId: session.id }));
    }
  };

  const updateStepData = (data: Partial<VerificationStepData>) => {
    setStepData((prev) => ({ ...prev, ...data }));
  };

  const resetVerification = () => {
    setActiveSessionState(null);
    setStepData(initialStepData);
  };

  return (
    <VerificationContext.Provider
      value={{
        activeSession,
        stepData,
        setActiveSession: handleSetActiveSession,
        updateStepData,
        resetVerification,
      }}
    >
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};
