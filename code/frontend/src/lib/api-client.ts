import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { generateIdempotencyKey } from '@/utils/idempotency';
import { useAuthStore } from '@/store';

// Mở rộng cấu hình Axios để hỗ trợ cờ useIdempotency và biến đếm retry
declare module 'axios' {
  export interface AxiosRequestConfig {
    useIdempotency?: boolean;
    retry?: number;
  }
}

// Khởi tạo instance của Axios
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho Request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Tự động gắn Token xác thực từ Zustand Store nếu đã đăng nhập
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    // 2. Tự động thêm Idempotency-Key cho các thao tác mutation
    const isMutation = ['post', 'put', 'patch', 'delete'].includes(
      config.method?.toLowerCase() || ''
    );
    const shouldAttachIdempotency = config.useIdempotency !== false && isMutation;

    if (shouldAttachIdempotency && !config.headers.has('Idempotency-Key')) {
      config.headers.set('Idempotency-Key', generateIdempotencyKey());
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho Response
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const config = error.config;
    if (!config) {
      return Promise.reject(error);
    }

    // 1. Chỉ logout khi request thực sự có gửi kèm Bearer Token mà bị 401
    const hasAuthHeader = !!config.headers?.Authorization;
    if (error.response?.status === 401 && hasAuthHeader) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // 2. Chỉ tự động retry cho request GET (an toàn & idempotent theo chuẩn HTTP)
    const isGetMethod = config.method?.toLowerCase() === 'get';
    const currentRetry = config.retry || 0;

    if (isGetMethod && currentRetry < 3 && error.response?.status >= 500) {
      config.retry = currentRetry + 1;
      await new Promise((resolve) => setTimeout(resolve, 1000 * config.retry));
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);
