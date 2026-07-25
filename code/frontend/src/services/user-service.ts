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
};
