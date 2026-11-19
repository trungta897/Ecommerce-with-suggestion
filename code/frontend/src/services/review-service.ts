import { apiClient } from './api-client';

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string | null;
  content: string | null;
  isVerifiedPurchase: boolean;
  status: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface ReviewResponse {
  data: Review[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const reviewService = {
  createReview: async (
    productId: string,
    data: { rating: number; title?: string; content?: string }
  ) => {
    const response = await apiClient.post(`/reviews/${productId}`, data);
    return response.data;
  },

  getReviewsByProduct: async (productId: string, page = 1, limit = 10): Promise<ReviewResponse> => {
    const response = await apiClient.get(
      `/reviews/product/${productId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getAdminReviews: async (page = 1, limit = 10) => {
    const response = await apiClient.get(`/reviews/admin?page=${page}&limit=${limit}`);
    return response.data;
  },

  toggleVisibility: async (id: string) => {
    const response = await apiClient.patch(`/reviews/${id}/toggle-visibility`);
    return response.data;
  },
};
