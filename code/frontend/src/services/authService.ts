import { AuthResponse, UserRole } from '@/types';
import { apiClient } from './api-client';

export const authService = {
  login: async (credentials: Record<string, unknown>): Promise<AuthResponse> => {
    // In real implementation:
    // const response = await apiClient.post<AuthResponse>("/auth/login", credentials);
    // return response.data;

    // Mock implementation for UI building
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve({
          user: {
            id: '1',
            email: credentials.email as string,
            role: UserRole.CUSTOMER,
            isVerified: true,
          },
          accessToken: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        });
      }, 1000)
    );
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  register: async (userData: Record<string, unknown>): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Bỏ qua nếu server offline hoặc đang dùng UI mock
    }
  },
};
