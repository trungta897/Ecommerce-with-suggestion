import Redis from 'ioredis';
import { ENV } from '../constants';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: ENV.redisHost,
      port: ENV.redisPort,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
  }
  return redisClient;
}

/**
 * Đọc mã OTP đăng nhập số điện thoại được lưu trong Redis
 * @param phone Số điện thoại khách hàng (ví dụ: '0912345678')
 * @param timeoutMs Thời gian tối đa chờ OTP sinh ra trong Redis
 */
export async function getPhoneOtpFromRedis(
  phone: string,
  timeoutMs = 5000
): Promise<string | null> {
  const client = getRedisClient();
  if (client.status !== 'ready' && client.status !== 'connecting') {
    await client.connect().catch((err) => {
      console.warn('[e2e-redis] Warning: cannot connect to Redis:', err.message);
    });
  }

  const redisKey = `OTP:PHONE:${phone}`;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const otp = await client.get(redisKey);
      if (otp) return otp;
    } catch {
      // Redis error, wait and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return null;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit().catch(() => {});
    redisClient = null;
  }
}
