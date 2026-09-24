import { AttendanceSession, AttendanceRecord, Student } from '../types';
import { apiClient } from './apiClient';

export interface StudentAttendanceSummary {
  attendancePercentage: number;
  classesAttended: number;
  classesMissed: number;
  activeSessionsCount: number;
}

export interface StudentEnrollmentStatus {
  personalDetailsCompleted: boolean;
  faceEnrollmentCompleted: boolean;
  deviceRegistrationCompleted: boolean;
  enrollmentCompleted: boolean;
  enrollmentStatus?: string;
  faceEnrollmentStatus?: string;
  deviceEnrollmentStatus?: string;
}

export const studentService = {
  async getStudentProfile(): Promise<Student | null> {
    try {
      const s = await apiClient.get<any>('/api/student/profile');
      if (!s) return null;
      const isFaceDone = s.faceRegistered === true || s.faceEnrollmentStatus === 'COMPLETED' || s.faceEnrollmentStatus === 'REGISTERED';
      const isDeviceDone = s.deviceRegistered === true || s.deviceEnrollmentStatus === 'COMPLETED' || s.deviceEnrollmentStatus === 'REGISTERED';
      return {
        id: String(s.id),
        rollNumber: s.studentId || s.rollNumber || '',
        name: s.fullName || s.name || '',
        email: s.email || '',
        department: s.department || '',
        semester: Number(s.year || s.semester || 1),
        section: s.section || '',
        status: s.status || 'ACTIVE',
        enrollmentStatus: s.enrollmentStatus || 'PENDING',
        faceEnrollmentStatus: s.faceEnrollmentStatus || 'PENDING',
        deviceEnrollmentStatus: s.deviceEnrollmentStatus || 'PENDING',
        faceRegistered: isFaceDone,
        deviceRegistered: isDeviceDone,
      };
    } catch {
      return null;
    }
  },

  async getStudentAttendanceSummary(): Promise<StudentAttendanceSummary | null> {
    try {
      const history = await this.getStudentAttendanceHistory();
      const live = await this.getStudentLiveSessions();
      const attended = history.filter(r => r.attendanceStatus === 'PRESENT').length;
      const total = history.length;
      return {
        attendancePercentage: total > 0 ? Math.round((attended / total) * 100) : 0,
        classesAttended: attended,
        classesMissed: total - attended,
        activeSessionsCount: live.length,
      };
    } catch {
      return {
        attendancePercentage: 0,
        classesAttended: 0,
        classesMissed: 0,
        activeSessionsCount: 0,
      };
    }
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

  async getStudentAttendanceHistory(): Promise<AttendanceRecord[]> {
    try {
      const list = await apiClient.get<any[]>('/api/student/attendance/history');
      return (list || []).map(r => ({
        id: String(r.id),
        sessionId: r.sessionId || '',
        studentId: String(r.studentUserId || ''),
        studentName: '',
        rollNumber: '',
        subjectCode: r.subjectCode || r.sessionId || '',
        subjectName: r.subjectName || r.subjectCode || 'Class Session',
        date: r.date || (r.markedAt ? r.markedAt.split('T')[0] : ''),
        time: r.time || (r.markedAt ? r.markedAt.split('T')[1]?.substring(0, 5) : ''),
        timestamp: r.markedAt || '',
        status: (r.attendanceStatus as any) || 'PENDING',
        attendanceStatus: (r.attendanceStatus as any) || 'PENDING',
        verificationStatus: (r.verificationStatus as any) || (r.attendanceStatus === 'PRESENT' ? 'VERIFIED' : 'PENDING'),
        fraudStatus: (r.fraudStatus as any) || (r.decision as any) || 'SAFE',
        verificationMethod: 'QR_CODE',
        fraudScore: null,
        decision: (r.decision as any) || 'PENDING',
      }));
    } catch {
      return [];
    }
  },

  async getStudentAttendanceById(id: string): Promise<AttendanceRecord | null> {
    const history = await this.getStudentAttendanceHistory();
    return history.find(h => h.id === id) || null;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.put<any>('/api/auth/password', { currentPassword, newPassword });
      return { success: true, message: res.message || 'Password updated successfully' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to change password' };
    }
  },

  async startEnrollment(): Promise<any> {
    return apiClient.post('/api/student/enrollment/start');
  },

  async getEnrollmentStatus(): Promise<StudentEnrollmentStatus> {
    try {
      const res = await apiClient.get<any>('/api/student/enrollment/status');
      return {
        personalDetailsCompleted: !!res.personalDetailsConfirmed,
        faceEnrollmentCompleted: res.faceEnrollmentStatus === 'COMPLETED',
        deviceRegistrationCompleted: res.deviceEnrollmentStatus === 'COMPLETED',
        enrollmentCompleted: !!res.enrollmentComplete || res.enrollmentStatus === 'COMPLETED',
        enrollmentStatus: res.enrollmentStatus,
        faceEnrollmentStatus: res.faceEnrollmentStatus,
        deviceEnrollmentStatus: res.deviceEnrollmentStatus,
      };
    } catch {
      return {
        personalDetailsCompleted: true,
        faceEnrollmentCompleted: false,
        deviceRegistrationCompleted: false,
        enrollmentCompleted: false,
        enrollmentStatus: 'PENDING',
        faceEnrollmentStatus: 'PENDING',
        deviceEnrollmentStatus: 'PENDING',
      };
    }
  },

  async submitFaceEnrollment(imageFrameBase64?: string, imageBlob?: Blob): Promise<{ success: boolean; message: string }> {
    try {
      let res: any;
      if (imageBlob) {
        const formData = new FormData();
        formData.append('file', imageBlob, 'face_capture.jpg');
        res = await apiClient.post<any>('/api/student/face/enroll', formData);
      } else if (imageFrameBase64) {
        res = await apiClient.post<any>('/api/student/face/enroll', { frame: imageFrameBase64 });
      } else {
        res = await apiClient.post<any>('/api/student/face/enroll', { frame: '' });
      }
      return {
        success: res.status === 'COMPLETED' || res.enrolled === true,
        message: res.message || 'Face biometric enrollment processed successfully.',
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Face processing service unavailable.';
      return { success: false, message: msg };
    }
  },

  async submitDeviceRegistration(deviceSignals?: any): Promise<{ success: boolean; message: string }> {
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
      return {
        success: res.status === 'COMPLETED' || res.enrolled === true,
        message: res.message || 'Device registered successfully.',
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit device registration.';
      return { success: false, message: msg };
    }
  },

  async verifyLocation(sessionId: string, coords?: { latitude: number; longitude: number; accuracy?: number }): Promise<{ success: boolean; status: string; message: string }> {
    try {
      let lat = coords?.latitude;
      let lon = coords?.longitude;
      let acc = coords?.accuracy;

      if (!lat || !lon) {
        const position: any = await new Promise((resolve, reject) => {
          if (typeof navigator === 'undefined' || !navigator.geolocation) {
            reject(new Error('LOCATION_UNAVAILABLE'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true });
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        acc = position.coords.accuracy;
      }

      const res = await apiClient.post<any>('/api/student/location/verify', {
        sessionId,
        latitude: lat,
        longitude: lon,
        accuracy: acc || 10.0,
      });

      return {
        success: res.verified === true || res.status === 'LOCATION_VALID',
        status: res.status || 'UNKNOWN',
        message: res.message || 'Location verification completed.',
      };
    } catch (err: any) {
      if (err?.message === 'LOCATION_UNAVAILABLE' || err?.code === 2) {
        return { success: false, status: 'LOCATION_UNAVAILABLE', message: 'Location services are unavailable on this browser.' };
      }
      if (err?.code === 1) {
        return { success: false, status: 'LOCATION_PERMISSION_DENIED', message: 'Location permission was denied.' };
      }
      const msg = err?.response?.data?.message || err?.message || 'Location verification failed.';
      const status = err?.response?.data?.status || 'INVALID_LOCATION';
      return { success: false, status: String(status), message: msg };
    }
  },

  async completeEnrollment(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Enrollment process status checked.' };
  },

  async submitFirstTimeEnrollment(payload: { faceDataAvailable: boolean; deviceFingerprint: string }): Promise<boolean> {
    try {
      await this.startEnrollment();
      await this.submitFaceEnrollment();
      await this.submitDeviceRegistration();
      return true;
    } catch {
      return false;
    }
  },
};
