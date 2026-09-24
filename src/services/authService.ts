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
   * Role and user payload are provided by the backend response.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
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
  },

  async getCurrentUser(): Promise<User | null> {
    return apiClient.get<User>('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('smart_attendance_token');
    }
  },
};
