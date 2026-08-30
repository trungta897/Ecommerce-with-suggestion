import { apiClient } from './api-client';
import { Product } from '@/types/product';

export interface RecommendationParams {
  sessionId?: string;
  productId?: string;
  limit?: number;
}

export const activityService = {
  getRecommendations: async (params?: RecommendationParams): Promise<Product[]> => {
    const { data } = await apiClient.get<Product[]>('/activities/recommendations', {
      params: {
        sessionId: params?.sessionId,
        productId: params?.productId,
        limit: params?.limit || 4,
      },
    });
    return data;
  },

  logActivity: async (payload: {
    action: string;
    productId: string;
    sessionId?: string;
    searchQuery?: string;
  }): Promise<void> => {
    await apiClient.post('/activities/log', payload);
  },

  getRecentlyViewed: async (sessionId?: string, limit: number = 15): Promise<Product[]> => {
    const { data } = await apiClient.get<Product[]>('/activities/recently-viewed', {
      params: { sessionId, limit },
    });
    return data;
  },

  clearRecentlyViewed: async (sessionId?: string): Promise<void> => {
    await apiClient.delete('/activities/recently-viewed', {
      params: { sessionId },
    });
  },
};
