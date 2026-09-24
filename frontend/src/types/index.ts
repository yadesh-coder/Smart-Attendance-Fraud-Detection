export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT';

export type FraudStatus = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'FAILED' | 'PENDING';
export type AttendanceStatus = 'PRESENT' | 'PENDING_REVIEW' | 'FAILED' | 'ABSENT' | 'NOT_MARKED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | null;
export type VerificationSignalStatus = 'VERIFIED' | 'FAILED' | 'SUSPICIOUS' | 'PENDING' | 'FACE_MATCH' | 'FACE_MISMATCH' | 'FACE_ENROLLMENT_REQUIRED' | 'LOCATION_VALID' | 'OUT_OF_BOUNDS' | 'LOCATION_OUTSIDE_RADIUS' | 'NOT_AVAILABLE';

export interface VerificationSummary {
  qrStatus: VerificationSignalStatus;
  faceStatus: VerificationSignalStatus;
  locationStatus: VerificationSignalStatus;
  deviceStatus: VerificationSignalStatus;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
  isFirstTimeSetupComplete?: boolean;
  mustChangePassword?: boolean;
}

export interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department: string;
  designation?: string;
  phone?: string;
  employeeId: string;
  assignedSubjectsCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  section: string;
  faceRegistered?: boolean;
  deviceRegistered?: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  enrollmentStatus?: string;
  faceEnrollmentStatus?: string;
  deviceEnrollmentStatus?: string;
}

export interface Subject {
  id: string;
  subjectId?: string;
  code: string;
  name: string;
  department: string;
  semester: number;
  section: string;
  assignedFacultyName?: string;
}

export interface AttendanceSession {
  id: string;
  sessionId?: string;
  subjectCode: string;
  subjectName: string;
  facultyName?: string;
  date?: string;
  startTime: string;
  endTime: string;
  status: string;
  qrCodeActive?: boolean;
  qrData?: string;
  qrToken?: string;
  qrExpiresAt?: string;
  createdAt?: string;
  attendanceCode?: string;
  attendedCount?: number;
  totalStudents?: number;
}

export interface FraudAlert {
  id: string;
  sessionId: string;
  studentId?: string;
  studentName: string;
  studentRoll: string;
  subjectCode?: string;
  subjectName?: string;
  facultyName?: string;
  department?: string;
  sessionDate?: string;
  sessionTime?: string;
  timestamp: string;
  attendanceStatus?: AttendanceStatus;
  fraudStatus?: FraudStatus;
  riskLevel?: RiskLevel;
  riskScore?: number | null;
  anomalyType?: 'FACIAL_MISMATCH' | 'GEO_OUT_OF_BOUNDS' | 'DEVICE_SPOOF' | 'DUPLICATE_QR_SCAN' | 'MULTIPLE_DEVICES' | string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  verificationStatus?: 'PENDING' | 'INVESTIGATING' | 'CONFIRMED_FRAUD' | 'DISMISSED';
  verificationSummary?: VerificationSummary;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  subjectCode?: string;
  subjectName: string;
  facultyName?: string;
  date: string;
  time: string;
  status?: AttendanceStatus;
  attendanceStatus?: AttendanceStatus;
  fraudStatus?: FraudStatus;
  riskLevel?: RiskLevel;
  riskScore?: number | null;
  verificationStatus?: VerificationSignalStatus;
  faceVerificationState?: 'VERIFIED' | 'FAILED' | 'NOT_REQUIRED';
  geoVerificationState?: 'VERIFIED' | 'OUT_OF_RANGE' | 'DISABLED';
  deviceVerificationState?: 'REGISTERED' | 'UNRECOGNIZED';
  verificationSummary?: VerificationSummary;
  failedStep?: string | null;
}
