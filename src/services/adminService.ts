import { FacultyMember, Student, Subject, FraudAlert } from '../types';
import { apiClient } from './apiClient';

export interface SystemSettingsData {
  geoFencingRadiusMeters: number;
  faceRecognitionThreshold: number;
  qrCodeValiditySeconds: number;
  requireDeviceVerification: boolean;
  allowProxyAppeal: boolean;
  notifyOnCriticalFraud: boolean;
}

export interface AdminProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role: 'ADMIN';
  accountStatus: 'ACTIVE' | 'INACTIVE';
}

export interface DashboardMetrics {
  totalFaculty: number | null;
  totalStudents: number | null;
  totalSubjects: number | null;
  fraudAlertsCount: number | null;
}

export interface AdminActivity {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  performedBy: string;
}

export const adminService = {
  // Dashboard APIs
  async getDashboardMetrics(): Promise<DashboardMetrics | null> {
    try {
      const metrics = await apiClient.get<DashboardMetrics>('/api/admin/metrics');
      return metrics;
    } catch {
      // Graceful fallback for non-existent admin metrics endpoint
      const faculty = await this.getFacultyList();
      return {
        totalFaculty: faculty.length,
        totalStudents: 0,
        totalSubjects: 0,
        fraudAlertsCount: 0,
      };
    }
  },

  async getRecentActivities(): Promise<AdminActivity[]> {
    try {
      return await apiClient.get<AdminActivity[]>('/api/admin/activities');
    } catch {
      return [];
    }
  },

  // Faculty Management APIs (Connected to backend Faculty Service /api/admin/faculty)
  async getFacultyList(): Promise<FacultyMember[]> {
    try {
      const list = await apiClient.get<any[]>('/api/admin/faculty');
      return (list || []).map(f => ({
        id: String(f.id),
        employeeId: f.employeeId || '',
        name: f.fullName || f.name || '',
        email: f.email || '',
        department: f.department || '',
        designation: f.designation || 'Professor',
        status: f.status || 'ACTIVE',
        assignedSubjectsCount: f.assignedSubjectsCount || 0,
        phone: f.phone || '',
      }));
    } catch {
      return [];
    }
  },

  async getFacultyById(id: string): Promise<FacultyMember | null> {
    try {
      const f = await apiClient.get<any>(`/api/admin/faculty/${id}`);
      if (!f) return null;
      return {
        id: String(f.id),
        employeeId: f.employeeId || '',
        name: f.fullName || f.name || '',
        email: f.email || '',
        department: f.department || '',
        designation: f.designation || 'Professor',
        status: f.status || 'ACTIVE',
        assignedSubjectsCount: f.assignedSubjectsCount || 0,
        phone: f.phone || '',
      };
    } catch {
      return null;
    }
  },

  async addFaculty(data: {
    email: string;
    password?: string;
    fullName?: string;
    name?: string;
    employeeId?: string;
    department?: string;
    designation?: string;
    phone?: string;
  }): Promise<FacultyMember | null> {
    const payload = {
      email: data.email,
      password: data.password || 'facultyPass123',
      fullName: data.fullName || data.name || 'Faculty Member',
      employeeId: data.employeeId || `EMP${Math.floor(Math.random() * 10000)}`,
      department: data.department || 'Computer Science',
      designation: data.designation || 'Professor',
      phone: data.phone || '1234567890',
    };
    const f = await apiClient.post<any>('/api/admin/faculty', payload);
    return {
      id: String(f.id),
      employeeId: f.employeeId || '',
      name: f.fullName || f.name || '',
      email: f.email || '',
      department: f.department || '',
      designation: f.designation || 'Professor',
      status: f.status || 'ACTIVE',
      assignedSubjectsCount: 0,
      phone: f.phone || '',
    };
  },

  async updateFaculty(id: string, data: Partial<FacultyMember> & { phone?: string }): Promise<FacultyMember | null> {
    const f = await apiClient.put<any>(`/api/admin/faculty/${id}`, data);
    return {
      id: String(f.id),
      employeeId: f.employeeId || '',
      name: f.fullName || f.name || '',
      email: f.email || '',
      department: f.department || '',
      designation: f.designation || 'Professor',
      status: f.status || 'ACTIVE',
      assignedSubjectsCount: 0,
      phone: f.phone || '',
    };
  },

  async toggleFacultyStatus(id: string, newStatus: 'ACTIVE' | 'INACTIVE'): Promise<boolean> {
    try {
      await apiClient.put(`/api/admin/faculty/${id}`, { status: newStatus });
      return true;
    } catch {
      return false;
    }
  },

  async removeFaculty(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.delete<any>(`/api/admin/faculty/${id}`);
      return { success: true, message: res?.message || 'Faculty member and associated faculty data removed successfully.' };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to remove faculty member.';
      return { success: false, message: msg };
    }
  },

  // Student View APIs (Admin view)
  async getStudentList(): Promise<Student[]> {
    try {
      const list = await apiClient.get<any[]>('/api/admin/students');
      return (list || []).map(s => ({
        id: String(s.id),
        rollNumber: s.rollNumber || s.studentId || s.student_id || String(s.id),
        name: s.fullName || s.name || s.full_name || '',
        email: s.email || '',
        department: s.department || '',
        semester: Number(s.semester || s.academicYear || 1),
        section: s.section || 'A',
        faceRegistered: !!s.faceRegistered || s.enrollmentStatus === 'COMPLETED',
        deviceRegistered: !!s.deviceRegistered || s.enrollmentStatus === 'COMPLETED',
        status: s.status || 'ACTIVE',
      }));
    } catch {
      return [];
    }
  },

  async getStudentById(id: string): Promise<Student | null> {
    try {
      const s = await apiClient.get<any>(`/api/admin/students/${id}`);
      if (!s) return null;
      return {
        id: String(s.id),
        rollNumber: s.rollNumber || s.studentId || s.student_id || String(s.id),
        name: s.fullName || s.name || s.full_name || '',
        email: s.email || '',
        department: s.department || '',
        semester: Number(s.semester || s.academicYear || 1),
        section: s.section || 'A',
        faceRegistered: !!s.faceRegistered || s.enrollmentStatus === 'COMPLETED',
        deviceRegistered: !!s.deviceRegistered || s.enrollmentStatus === 'COMPLETED',
        status: s.status || 'ACTIVE',
      };
    } catch {
      return null;
    }
  },

  // Subject View APIs (Admin view)
  async getSubjectList(): Promise<Subject[]> {
    try {
      return await apiClient.get<Subject[]>('/api/admin/subjects');
    } catch {
      return [];
    }
  },

  async getSubjectById(id: string): Promise<Subject | null> {
    try {
      return await apiClient.get<Subject>(`/api/admin/subjects/${id}`);
    } catch {
      return null;
    }
  },

  // Fraud Monitoring APIs
  async getFraudAlerts(): Promise<FraudAlert[]> {
    try {
      return await apiClient.get<FraudAlert[]>('/api/admin/fraud');
    } catch {
      return [];
    }
  },

  async getFraudAlertById(id: string): Promise<FraudAlert | null> {
    try {
      return await apiClient.get<FraudAlert>(`/api/admin/fraud/${id}`);
    } catch {
      return null;
    }
  },

  // Settings APIs
  async getSystemSettings(): Promise<SystemSettingsData> {
    try {
      return await apiClient.get<SystemSettingsData>('/api/admin/settings');
    } catch {
      return {
        geoFencingRadiusMeters: 50,
        faceRecognitionThreshold: 85,
        qrCodeValiditySeconds: 30,
        requireDeviceVerification: true,
        allowProxyAppeal: true,
        notifyOnCriticalFraud: true,
      };
    }
  },

  async updateSystemSettings(settings: SystemSettingsData): Promise<boolean> {
    try {
      await apiClient.put('/api/admin/settings', settings);
      return true;
    } catch {
      return false;
    }
  },

  // Profile APIs
  async getAdminProfile(): Promise<AdminProfileData | null> {
    try {
      return await apiClient.get<AdminProfileData>('/api/admin/profile');
    } catch {
      return null;
    }
  },

  async updateAdminProfile(data: Partial<AdminProfileData>): Promise<boolean> {
    try {
      await apiClient.put('/api/admin/profile', data);
      return true;
    } catch {
      return false;
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      await apiClient.put('/api/auth/password', { currentPassword: oldPassword, newPassword });
      return true;
    } catch {
      return false;
    }
  },

  // Department Management APIs
  async getDepartments(): Promise<{ id: string; name: string; code: string; createdAt?: string }[]> {
    try {
      const res = await apiClient.get<any[]>('/api/admin/departments');
      return (res || []).map(d => ({
        id: String(d.id),
        name: d.name || '',
        code: d.code || '',
        createdAt: d.createdAt || '',
      }));
    } catch {
      return [];
    }
  },

  async addDepartment(name: string, code?: string): Promise<{ id: string; name: string; code: string } | null> {
    const res = await apiClient.post<any>('/api/admin/departments', { name, code });
    return {
      id: String(res.id),
      name: res.name || '',
      code: res.code || '',
    };
  },

  async deleteDepartment(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.delete<any>(`/api/admin/departments/${id}`);
      return { success: true, message: res?.message || 'Department removed successfully.' };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to remove department.';
      return { success: false, message: msg };
    }
  },
};
