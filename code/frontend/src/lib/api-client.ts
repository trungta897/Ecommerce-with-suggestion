import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { generateIdempotencyKey } from "@/utils/idempotency";

// Mở rộng cấu hình Axios để hỗ trợ cờ useIdempotency
declare module 'axios' {
  export interface AxiosRequestConfig {
    useIdempotency?: boolean;
  }
}

// Khởi tạo instance của Axios
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "", // Thay đổi theo URL của Backend sau này
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor cho Request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const isMutation = ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase() || "");
    const shouldAttachIdempotency = config.useIdempotency !== false && isMutation;

    // Tự động thêm Idempotency-Key cho các thao tác mutation
    if (shouldAttachIdempotency && !config.headers.has("Idempotency-Key")) {
      config.headers.set("Idempotency-Key", generateIdempotencyKey());
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
  (error) => {
    // Xử lý lỗi tập trung ở đây
    if (error.response) {
      console.error(`API Error: ${error.response.status} - ${error.response.statusText}`);
    } else {
      console.error(`API Network/Timeout Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);
