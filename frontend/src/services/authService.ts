import { User } from '../types';
import { apiClient } from './apiClient';

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  /**
   * Authenticates user with credentials against backend POST /api/auth/login.
   * Provides seamless Demo mode fallback on GitHub Pages or when backend is offline.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<any>('/api/auth/login', credentials);
      const token = response.accessToken || response.token;
      if (token) {
        localStorage.setItem('smart_attendance_token', token);
      }
      const mustChange = response.mustChangePassword ?? response.user?.mustChangePassword ?? false;
      const userPayload: User = {
        ...response.user,
        mustChangePassword: mustChange,
      };
      return {
        user: userPayload,
        token: token,
      };
    } catch (err: any) {
      const isNetworkError = !err.status || err.message?.includes('fetch') || err.message?.includes('NetworkError') || err.message?.includes('Failed');
      const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

      if (isNetworkError || isGitHubPages) {
        console.warn('Backend server unreachable; falling back to Demo Authentication mode for GitHub Pages.');
        const email = (credentials.email || '').toLowerCase();
        let mockRole: 'ADMIN' | 'FACULTY' | 'STUDENT' = 'STUDENT';
        let mockName = 'Yadesh M';
        let mockEmail = credentials.email || 'yadesh@college.edu';

        if (email.includes('admin')) {
          mockRole = 'ADMIN';
          mockName = 'System Administrator';
          mockEmail = 'admin@college.edu';
        } else if (email.includes('faculty') || email.includes('vishal') || email.includes('prof') || email.includes('teacher')) {
          mockRole = 'FACULTY';
          mockName = 'Dr. Sarah Connor';
          mockEmail = credentials.email || 'faculty@college.edu';
        }

        const mockUser: User = {
          userId: mockRole === 'ADMIN' ? 1 : mockRole === 'FACULTY' ? 2 : 3,
          email: mockEmail,
          role: mockRole,
          firstName: mockName.split(' ')[0],
          lastName: mockName.split(' ')[1] || 'User',
          department: 'CS',
          semester: '6',
          section: 'A',
          status: 'ACTIVE',
          mustChangePassword: false,
        };

        const mockToken = `demo-token-${mockRole.toLowerCase()}`;
        localStorage.setItem('smart_attendance_token', mockToken);
        localStorage.setItem('smart_attendance_user', JSON.stringify(mockUser));

        return {
          user: mockUser,
          token: mockToken,
        };
      }
      throw err;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      return await apiClient.get<User>('/api/auth/me');
    } catch (err: any) {
      const savedUser = localStorage.getItem('smart_attendance_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          // ignore
        }
      }
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // ignore offline logout errors
    } finally {
      localStorage.removeItem('smart_attendance_token');
    }
  },
};
