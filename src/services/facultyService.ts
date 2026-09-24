import { Student, Subject, AttendanceSession, FraudAlert, AttendanceRecord } from '../types';
import { apiClient } from './apiClient';

export interface FacultyAnalyticsData {
  averageAttendanceRate?: number;
  totalClassesConducted?: number;
  totalFlaggedProxies?: number;
  verifiedAttendanceCount?: number;
  suspiciousAttemptsCount?: number;
  failedVerificationCount?: number;
}

export const facultyService = {
  // Students Management (Faculty creates students)
  async getAssignedStudents(): Promise<Student[]> {
    try {
      const res = await apiClient.get<any[]>('/api/faculty/students');
      return (res || []).map(s => {
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
      });
    } catch (err) {
      console.error('getAssignedStudents error:', err);
      throw err;
    }
  },

  async getStudentById(id: string): Promise<Student | null> {
    try {
      const s = await apiClient.get<any>(`/api/faculty/students/${id}`);
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

  async addStudent(studentData: {
    rollNumber?: string;
    studentId?: string;
    name?: string;
    fullName?: string;
    email: string;
    password?: string;
    phone?: string;
    department?: string;
    course?: string;
    semester?: number;
    year?: string;
    section?: string;
  }): Promise<Student | null> {
    const payload = {
      email: studentData.email,
      password: studentData.password || 'initialStudentPass123',
      fullName: studentData.fullName || studentData.name || 'Student Name',
      studentId: studentData.studentId || studentData.rollNumber || `STU${Math.floor(Math.random() * 10000)}`,
      phone: studentData.phone || '9876543210',
      department: studentData.department || 'Computer Science & Engineering',
      course: studentData.course || 'B.Tech',
      year: String(studentData.year || studentData.semester || 1),
      section: studentData.section || 'A',
    };
    const s = await apiClient.post<any>('/api/faculty/students', payload);
    return {
      id: String(s.id),
      rollNumber: s.studentId || s.rollNumber || '',
      name: s.fullName || s.name || '',
      email: s.email || '',
      department: s.department || '',
      semester: Number(s.year || 1),
      section: s.section || '',
      status: s.status || 'ACTIVE',
      enrollmentStatus: s.enrollmentStatus || 'PENDING',
    };
  },

  async updateStudent(id: string, studentData: Partial<Student>): Promise<Student | null> {
    try {
      const payload = {
        fullName: studentData.name,
        department: studentData.department,
        year: studentData.semester != null ? String(studentData.semester) : undefined,
        section: studentData.section,
        status: studentData.status,
      };
      const s = await apiClient.put<any>(`/api/faculty/students/${id}`, payload);
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

  async deactivateStudent(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/faculty/students/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  // Subjects Management
  async getFacultySubjects(): Promise<Subject[]> {
    try {
      const list = await apiClient.get<any[]>('/api/faculty/subjects');
      return (list || []).map(s => ({
        id: String(s.id),
        code: s.subjectCode || s.code || '',
        name: s.subjectName || s.name || '',
        department: s.department || '',
        semester: Number(s.semester || 1),
        section: s.section || '',
        subjectId: s.subjectId,
      }));
    } catch {
      return [];
    }
  },

  async getSubjectById(id: string): Promise<Subject | null> {
    try {
      const s = await apiClient.get<any>(`/api/faculty/subjects/${id}`);
      if (!s) return null;
      return {
        id: String(s.id),
        code: s.subjectCode || s.code || '',
        name: s.subjectName || s.name || '',
        department: s.department || '',
        semester: Number(s.semester || 1),
        section: s.section || '',
        subjectId: s.subjectId,
      };
    } catch {
      return null;
    }
  },

  async addSubject(subjectData: Partial<Subject> & { subjectCode?: string; subjectName?: string }): Promise<Subject> {
    const payload = {
      subjectCode: subjectData.subjectCode || subjectData.code || 'CS101',
      subjectName: subjectData.subjectName || subjectData.name || 'Subject Name',
      department: subjectData.department || 'Computer Science & Engineering',
      course: 'B.Tech',
      academicYear: '2025-2026',
      semester: String(subjectData.semester || 1),
      section: subjectData.section || '',
    };
    const res = await apiClient.post<any>('/api/faculty/subjects', payload);
    return {
      id: String(res.id),
      code: res.subjectCode || res.code || '',
      name: res.subjectName || res.name || '',
      department: res.department || '',
      semester: Number(res.semester || 1),
      section: res.section || '',
      subjectId: res.subjectId,
    };
  },

  async updateSubject(id: string, subjectData: Partial<Subject> & { subjectCode?: string; subjectName?: string }): Promise<Subject | null> {
    try {
      const payload = {
        subjectCode: subjectData.subjectCode || subjectData.code,
        subjectName: subjectData.subjectName || subjectData.name,
        department: subjectData.department,
        semester: subjectData.semester ? String(subjectData.semester) : undefined,
        section: subjectData.section,
      };
      const res = await apiClient.put<any>(`/api/faculty/subjects/${id}`, payload);
      if (!res) return null;
      return {
        id: String(res.id),
        code: res.subjectCode || res.code || '',
        name: res.subjectName || res.name || '',
        department: res.department || '',
        semester: Number(res.semester || 1),
        section: res.section || '',
        subjectId: res.subjectId,
      };
    } catch {
      return null;
    }
  },

  async deleteSubject(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/faculty/subjects/${id}`);
      return true;
    } catch {
      return false;
    }
  },

  // Attendance Sessions
  async getFacultySessions(): Promise<AttendanceSession[]> {
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
        attendanceCode: s.attendanceCode,
        qrExpiresAt: s.qrExpiresAt || undefined,
        createdAt: s.createdAt || '',
      }));
    } catch {
      return [];
    }
  },

  async getSessionById(id: string): Promise<AttendanceSession | null> {
    try {
      const s = await apiClient.get<any>(`/api/faculty/attendance/sessions/${id}`);
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
        attendanceCode: s.attendanceCode,
        qrExpiresAt: s.qrExpiresAt || undefined,
        createdAt: s.createdAt || '',
      };
    } catch {
      return null;
    }
  },

  async getSessionParticipants(id: string): Promise<any[]> {
    try {
      const list = await apiClient.get<any[]>(`/api/faculty/attendance/sessions/${id}/participants`);
      return (list || []).map(p => ({
        id: String(p.id),
        studentId: String(p.studentUserId || ''),
        studentName: p.studentName || 'Student',
        rollNumber: p.studentRollNumber || '',
        department: p.department || '',
        semester: p.semester || '',
        section: p.section || '',
        attendanceStatus: p.attendanceStatus || 'PRESENT',
        decision: p.decision || 'SAFE',
        time: p.time || (p.markedAt ? p.markedAt.split('T')[1]?.substring(0, 5) : ''),
        markedAt: p.markedAt || '',
      }));
    } catch {
      return [];
    }
  },

  async getFacultyAttendanceReports(): Promise<any[]> {
    try {
      const reports = await apiClient.get<any[]>('/api/faculty/attendance/reports');
      return reports || [];
    } catch {
      return [];
    }
  },

  async createSession(sessionData: {
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
  }): Promise<AttendanceSession | null> {
    const payload = {
      subjectId: sessionData.subjectId || sessionData.subjectCode || 'SUB101',
      subjectCode: sessionData.subjectCode,
      subjectName: sessionData.subjectName,
      sessionDate: sessionData.sessionDate || sessionData.date || new Date().toISOString().split('T')[0],
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      durationMinutes: sessionData.durationMinutes,
      latitude: sessionData.latitude,
      longitude: sessionData.longitude,
      allowedRadiusMeters: sessionData.allowedRadiusMeters || 100.0,
      locationAccuracyMeters: sessionData.locationAccuracyMeters,
      locationTimestamp: sessionData.locationTimestamp,
    };
    const s = await apiClient.post<any>('/api/faculty/attendance/sessions', payload);
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
      attendanceCode: s.attendanceCode,
      qrExpiresAt: s.qrExpiresAt || undefined,
      createdAt: s.createdAt || '',
    };
  },

  async startSession(sessionId: string): Promise<AttendanceSession | null> {
    try {
      const s = await apiClient.post<any>(`/api/faculty/attendance/sessions/${sessionId}/start`);
      if (!s) return null;
      return {
        id: String(s.id),
        sessionId: s.sessionId || String(s.id),
        subjectCode: s.subjectCode || s.subjectId || '',
        subjectName: s.subjectName || s.subjectId || '',
        date: s.sessionDate || '',
        startTime: s.startTime || '',
        endTime: s.endTime || '',
        status: s.status || 'LIVE',
        qrData: s.qrToken || '',
        qrToken: s.qrToken || '',
        attendanceCode: s.attendanceCode,
        qrExpiresAt: s.qrExpiresAt || undefined,
        createdAt: s.createdAt || '',
      };
    } catch {
      return null;
    }
  },

  async closeSession(sessionId: string): Promise<boolean> {
    const res = await apiClient.post<any>(`/api/faculty/attendance/sessions/${sessionId}/close`);
    return !!res;
  },

  async getSessionAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
    try {
      return await apiClient.get<AttendanceRecord[]>(`/api/faculty/attendance/sessions/${sessionId}/attendance`);
    } catch {
      return [];
    }
  },

  // Fraud Alerts & Analytics
  async getFacultyFraudAlerts(): Promise<FraudAlert[]> {
    try {
      return await apiClient.get<FraudAlert[]>('/api/faculty/fraud-alerts');
    } catch {
      return [];
    }
  },

  async getFraudAlertById(id: string): Promise<FraudAlert | null> {
    try {
      return await apiClient.get<FraudAlert>(`/api/faculty/fraud-alerts/${id}`);
    } catch {
      return null;
    }
  },

  async getFacultyAnalytics(): Promise<FacultyAnalyticsData | null> {
    try {
      return await apiClient.get<FacultyAnalyticsData>('/api/faculty/analytics');
    } catch {
      return { averageAttendanceRate: 0, totalClassesConducted: 0, totalFlaggedProxies: 0 };
    }
  },

  async getFacultyProfile(): Promise<any> {
    try {
      const res = await apiClient.get<any>('/api/faculty/profile');
      if (!res) return null;
      return {
        name: res.fullName || res.name || '',
        email: res.email || '',
        phone: res.phone || '',
        department: res.department || '',
        designation: res.designation || '',
        employeeId: res.employeeId || 'FAC-8092',
      };
    } catch {
      return null;
    }
  },

  async updateFacultyProfile(data: { name: string; email: string; phone?: string }): Promise<boolean> {
    try {
      await apiClient.put('/api/faculty/profile', data);
      return true;
    } catch {
      return false;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    await apiClient.put('/api/auth/password', { currentPassword, newPassword });
    return true;
  },
};
