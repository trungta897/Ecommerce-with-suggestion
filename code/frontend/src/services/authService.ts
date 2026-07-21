import { AuthResponse, UserRole } from '@/types';

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
            is_verified: true,
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
};
