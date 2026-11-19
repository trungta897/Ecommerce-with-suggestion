import { AuthResponse } from '@/types';
import { apiClient } from './api-client';
import { getOrCreateSessionId, clearSessionAndRegenerate } from '@/utils/session';

export const authService = {
  login: async (credentials: Record<string, unknown>): Promise<AuthResponse> => {
    const sessionId = getOrCreateSessionId();
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      ...credentials,
      sessionId,
    });
    return response.data;
  },

  requestPhoneOtp: async (phone: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/phone/login', { phone });
    return response.data;
  },

  verifyPhoneOtp: async (phone: string, otp: string): Promise<AuthResponse> => {
    const sessionId = getOrCreateSessionId();
    const response = await apiClient.post<AuthResponse>('/auth/phone/verify', {
      phone,
      otp,
      sessionId,
    });
    return response.data;
  },

  register: async (userData: Record<string, unknown>): Promise<void> => {
    await apiClient.post('/auth/register', userData);
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Bỏ qua nếu server offline hoặc đang dùng UI mock
    } finally {
      clearSessionAndRegenerate();
    }
  },
};
