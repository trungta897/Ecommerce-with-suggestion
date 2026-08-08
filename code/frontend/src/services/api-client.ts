import axios from 'axios';
import { useAuthStore } from '@/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // [ERROR HANDLING] Xử lý lỗi bất đồng bộ và cơ chế fallback/retry
    const config = error.config;
    if (!config || !config.retry) {
      config.retry = 0;
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    } else if (config.retry < 3 && error.response?.status >= 500) {
      config.retry += 1;
      await new Promise((resolve) => setTimeout(resolve, 1000 * config.retry));
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);
