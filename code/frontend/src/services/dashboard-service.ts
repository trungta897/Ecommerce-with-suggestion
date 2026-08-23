import { apiClient } from './api-client';
import { DashboardStats } from '@/types/dashboard';

export const dashboardService = {
  getStats: async (refresh?: boolean): Promise<DashboardStats> => {
    const query = refresh ? '?refresh=true' : '';
    const response = await apiClient.get<DashboardStats>(`/admin/dashboard/stats${query}`);
    return response.data;
  },
};
