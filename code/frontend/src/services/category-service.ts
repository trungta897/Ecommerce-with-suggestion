import { apiClient } from './api-client';
import { Category } from '@/types';

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const { data } = await apiClient.get('/categories');
    return data;
  },

  getById: async (id: string): Promise<Category> => {
    const { data } = await apiClient.get(`/categories/${id}`);
    return data;
  },

  create: async (categoryData: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.post('/categories', categoryData);
    return data;
  },

  update: async (id: string, updates: Partial<Category>): Promise<Category> => {
    const { data } = await apiClient.patch(`/categories/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  }
};
