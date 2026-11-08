import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DEFAULT_BASE_URL = 'http://localhost:3000';
const DEFAULT_API_URL = 'http://localhost:8000';
const DEFAULT_ADMIN_EMAIL = 'admin@datn.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123456';
const DEFAULT_EMPLOYEE_EMAIL = 'employee@datn.com';
const DEFAULT_EMPLOYEE_PASSWORD = 'Staff@123456';
const DEFAULT_CUSTOMER_PHONE = '0912345678';
const DEFAULT_REDIS_HOST = 'localhost';
const DEFAULT_REDIS_PORT = 6379;

export const ENV = {
  baseUrl: process.env.E2E_BASE_URL ?? DEFAULT_BASE_URL,
  apiUrl: process.env.E2E_API_URL ?? DEFAULT_API_URL,
  adminEmail: process.env.E2E_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL,
  adminPassword: process.env.E2E_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD,
  employeeEmail: process.env.E2E_EMPLOYEE_EMAIL ?? DEFAULT_EMPLOYEE_EMAIL,
  employeePassword: process.env.E2E_EMPLOYEE_PASSWORD ?? DEFAULT_EMPLOYEE_PASSWORD,
  customerPhone: process.env.E2E_CUSTOMER_PHONE ?? DEFAULT_CUSTOMER_PHONE,
  redisHost: process.env.REDIS_HOST ?? DEFAULT_REDIS_HOST,
  redisPort: Number(process.env.REDIS_PORT ?? DEFAULT_REDIS_PORT),
  startServers: process.env.E2E_START_SERVERS === 'true',
  isCI: Boolean(process.env.CI),
} as const;

/** Đường dẫn tuyệt đối tới các thư mục liên quan trong monorepo */
export const PATHS = {
  frontendDir: path.resolve(__dirname, '..', '..', '..', 'code', 'frontend'),
  backendDir: path.resolve(__dirname, '..', '..', '..', 'code', 'backend'),
  messagesDir: path.resolve(__dirname, '..', '..', '..', 'code', 'frontend', 'src', 'messages'),
  adminStorageState: path.resolve(__dirname, '..', '.auth', 'admin.json'),
  employeeStorageState: path.resolve(__dirname, '..', '.auth', 'employee.json'),
  customerStorageState: path.resolve(__dirname, '..', '.auth', 'customer.json'),
} as const;
