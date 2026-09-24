import { apiClient } from './apiClient';

export interface Department {
  id: number | string;
  name: string;
  code: string;
  createdAt?: string;
}

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    try {
      const data = await apiClient.get<Department[]>('/api/departments');
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      try {
        const fallback = await apiClient.get<Department[]>('/api/admin/departments');
        if (Array.isArray(fallback)) return fallback;
        return [];
      } catch {
        return [];
      }
    }
  },
};
