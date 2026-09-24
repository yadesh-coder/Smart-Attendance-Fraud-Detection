import { FraudAlert } from '../types';
import { apiClient } from './apiClient';

export const fraudService = {
  async getFraudAlerts(): Promise<FraudAlert[]> {
    return apiClient.get<FraudAlert[]>('/api/fraud/alerts');
  },

  async getFraudDetails(id: string): Promise<FraudAlert | null> {
    return apiClient.get<FraudAlert>(`/api/fraud/alerts/${id}`);
  },

  async updateAlertStatus(alertId: string, status: FraudAlert['verificationStatus']): Promise<boolean> {
    return apiClient.patch<boolean>(`/api/fraud/alerts/${alertId}`, { status });
  },
};
