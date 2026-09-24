import { Subject } from '../types';
import { apiClient } from './apiClient';

export const subjectService = {
  async getAllSubjects(): Promise<Subject[]> {
    return apiClient.get<Subject[]>('/api/subjects');
  },

  async createSubject(subject: Partial<Subject>): Promise<Subject | null> {
    return apiClient.post<Subject>('/api/subjects', subject);
  },

  async assignFacultyToSubject(subjectId: string, facultyId: string): Promise<boolean> {
    return apiClient.post<boolean>('/api/subjects/assign', { subjectId, facultyId });
  },
};
