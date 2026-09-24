import { AttendanceRecord, AttendanceSession } from '../types';
import { apiClient } from './apiClient';

export interface CreateSessionPayload {
  subjectCode?: string;
  subjectId?: string;
  subjectName?: string;
  date?: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  section?: string;
  academicYear?: string;
  latitude?: number;
  longitude?: number;
  allowedRadiusMeters?: number;
  locationAccuracyMeters?: number;
  locationTimestamp?: number;
}

export interface StartSessionResponse {
  success: boolean;
  sessionId: string;
  sessionToken: string;
  qrData: string;
  expiresAt?: string;
  message?: string;
}

export interface QRValidationResponse {
  valid: boolean;
  status: 'VALID' | 'INVALID' | 'EXPIRED' | 'SESSION_CLOSED' | 'QR_VALID';
  sessionId?: string;
  subjectCode?: string;
  message?: string;
  verificationAttemptId?: string;
  qrStatus?: string;
  faceStatus?: string;
  locationStatus?: string;
  deviceStatus?: string;
  overallStatus?: string;
}

export const attendanceService = {
  async getSessions(): Promise<AttendanceSession[]> {
    try {
      const list = await apiClient.get<any[]>('/api/faculty/attendance/sessions');
      return (list || []).map(s => ({
        id: String(s.id),
        sessionId: s.sessionId || String(s.id),
        subjectCode: s.subjectCode || s.subjectId || '',
        subjectName: s.subjectName || s.subjectId || '',
        date: s.sessionDate || '',
        startTime: s.startTime || '',
        endTime: s.endTime || '',
        status: s.status || 'CREATED',
        qrData: s.qrToken || '',
        qrToken: s.qrToken || '',
        attendanceCode: s.attendanceCode || '',
        qrExpiresAt: s.qrExpiresAt || undefined,
        createdAt: s.createdAt || '',
      }));
    } catch {
      return [];
    }
  },

  async getSession(id: string): Promise<AttendanceSession | null> {
    try {
      let s: any = null;
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const isFaculty = user?.role === 'FACULTY' || user?.role === 'ADMIN';

      if (isFaculty) {
        s = await apiClient.get<any>(`/api/faculty/attendance/sessions/${id}`);
      } else {
        s = await apiClient.get<any>(`/api/student/attendance/sessions/by-code/${id}`);
      }

      if (!s) return null;
      return {
        id: String(s.id),
        sessionId: s.sessionId || String(s.id),
        subjectCode: s.subjectCode || s.subjectId || '',
        subjectName: s.subjectName || s.subjectId || '',
        date: s.sessionDate || '',
        startTime: s.startTime || '',
        endTime: s.endTime || '',
        status: s.status || 'CREATED',
        qrData: s.qrToken || '',
        qrToken: s.qrToken || '',
        attendanceCode: s.attendanceCode || '',
        qrExpiresAt: s.qrExpiresAt || undefined,
        createdAt: s.createdAt || '',
      };
    } catch {
      return null;
    }
  },

  async createSession(payload: CreateSessionPayload): Promise<AttendanceSession | null> {
    const body = {
      subjectId: payload.subjectId || payload.subjectCode,
      subjectName: payload.subjectName || payload.subjectCode,
      sessionDate: payload.sessionDate || payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      durationMinutes: payload.durationMinutes,
      latitude: payload.latitude,
      longitude: payload.longitude,
      allowedRadiusMeters: payload.allowedRadiusMeters || 100.0,
      locationAccuracyMeters: payload.locationAccuracyMeters,
      locationTimestamp: payload.locationTimestamp,
    };
    const s = await apiClient.post<any>('/api/faculty/attendance/sessions', body);
    return {
      id: String(s.id),
      sessionId: s.sessionId || String(s.id),
      subjectCode: s.subjectCode || s.subjectId || '',
      subjectName: s.subjectName || s.subjectId || '',
      date: s.sessionDate || '',
      startTime: s.startTime || '',
      endTime: s.endTime || '',
      status: s.status || 'CREATED',
      qrData: s.qrToken || '',
      qrToken: s.qrToken || '',
      attendanceCode: s.attendanceCode || '',
      qrExpiresAt: s.qrExpiresAt || undefined,
      createdAt: s.createdAt || '',
    };
  },

  async startSession(id: string): Promise<StartSessionResponse> {
    const s = await apiClient.post<any>(`/api/faculty/attendance/sessions/${id}/start`);
    return {
      success: true,
      sessionId: s.sessionId || String(s.id),
      sessionToken: s.qrToken || '',
      qrData: s.qrToken || '',
      expiresAt: s.qrExpiresAt || undefined,
      message: 'Session started successfully',
    };
  },

  async closeSession(id: string): Promise<{ success: boolean; message?: string }> {
    await apiClient.post<any>(`/api/faculty/attendance/sessions/${id}/close`);
    return { success: true, message: 'Session closed' };
  },

  async validateSessionQR(sessionId: string, qrData: string): Promise<QRValidationResponse> {
    const res = await apiClient.post<any>('/api/student/attendance/verify-qr', { qrToken: qrData });
    return {
      valid: res.qrStatus === 'QR_VALID',
      status: 'QR_VALID',
      sessionId: res.sessionId || sessionId,
      verificationAttemptId: res.verificationAttemptId,
      qrStatus: res.qrStatus,
      faceStatus: res.faceStatus,
      locationStatus: res.locationStatus,
      deviceStatus: res.deviceStatus,
      overallStatus: res.overallStatus,
      message: 'QR validated successfully',
    };
  },

  async getStudentLiveSessions(): Promise<AttendanceSession[]> {
    try {
      const list = await apiClient.get<any[]>('/api/student/attendance/live-sessions');
      return (list || []).map(s => ({
        id: String(s.id),
        subjectCode: s.subjectId || '',
        subjectName: s.subjectName || s.subjectId || '',
        date: s.sessionDate || '',
        startTime: s.startTime || '',
        endTime: s.endTime || '',
        status: s.status || 'LIVE',
        qrData: s.qrToken || '',
        qrExpiresAt: s.qrExpiresAt || undefined,
        createdAt: s.createdAt || '',
      }));
    } catch {
      return [];
    }
  },

  async getSessionAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
    return [];
  },

  async markAttendance(payload: {
    sessionId?: string;
    qrData: string;
  }): Promise<any> {
    return apiClient.post<any>('/api/student/attendance/verify-qr', { qrToken: payload.qrData });
  },

  async getAttendanceResult(id: string): Promise<AttendanceRecord | null> {
    return null;
  },

  async getVerificationResult(sessionId: string): Promise<any> {
    return null;
  },

  async getRiskAssessment(sessionId: string): Promise<{ riskLevel: string | null; riskScore: number | null } | null> {
    return { riskLevel: null, riskScore: null };
  },
};
