import { apiClient } from './api-client';
import { User } from '@/types';

export const userService = {
  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get('/users/profile');
    return data;
  },
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    const { data } = await apiClient.patch('/users/profile', updates);
    return data;
  },

  // Admin Endpoints
  getAllUsers: async (
    page = 1,
    limit = 10,
    role?: string
  ): Promise<{
    data: User[];
    meta: { totalPages: number; totalItems?: number; page?: number; limit?: number };
  }> => {
    const { data } = await apiClient.get('/admin/users', { params: { page, limit, role } });
    return data;
  },

  inviteStaff: async (email: string, fullName: string, role: string) => {
    const { data } = await apiClient.post('/admin/users/invite', { email, fullName, role });
    return data;
  },

  changeRole: async (id: string, role: string) => {
    const { data } = await apiClient.patch(`/admin/users/${id}/role`, { role });
    return data;
  },

  toggleActive: async (id: string) => {
    const { data } = await apiClient.patch(`/admin/users/${id}/toggle-active`);
    return data;
  },
};
