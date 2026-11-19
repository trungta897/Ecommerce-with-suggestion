import { BadRequestException, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { requireSecret } from '../../common/utils/secrets.helper';

/** Kiểm thử các biện pháp củng cố luồng OTP và quản lý khóa bí mật (theo góp ý mục D1). */
describe('AuthService OTP hardening', () => {
  let store: Map<string, string>;
  let redis: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
    setNx: jest.Mock;
    incr: jest.Mock;
  };
  let service: AuthService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    store = new Map();
    redis = {
      set: jest.fn((k: string, v: string) => {
        store.set(k, v);
        return Promise.resolve();
      }),
      get: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
      del: jest.fn((k: string) => {
        store.delete(k);
        return Promise.resolve();
      }),
      setNx: jest.fn((k: string, v: string) => {
        if (store.has(k)) return Promise.resolve(false);
        store.set(k, v);
        return Promise.resolve(true);
      }),
      incr: jest.fn((k: string) => {
        const n = parseInt(store.get(k) ?? '0', 10) + 1;
        store.set(k, String(n));
        return Promise.resolve(n);
      }),
    };
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
    const i18n = { t: jest.fn((key: string) => key) };
    service = new AuthService(
      prisma as never,
      { sign: jest.fn() } as never,
      i18n as never,
      redis as never,
      {} as never,
    );
  });

  it('sinh OTP 6 chữ số nằm trong khoảng hợp lệ', async () => {
    for (let i = 0; i < 50; i++) {
      store.clear();
      await service.requestPhoneOtp('0912345678');
      const otp = store.get('OTP:PHONE:0912345678') as string;
      expect(otp).toMatch(/^\d{6}$/);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    }
  });

  it('không xóa bộ đếm nhập sai khi cấp OTP mới', async () => {
    store.set('OTP:FAIL_PHONE:0912345678', '2');
    await service.requestPhoneOtp('0912345678');
    expect(store.get('OTP:FAIL_PHONE:0912345678')).toBe('2');
    expect(redis.del).not.toHaveBeenCalledWith('OTP:FAIL_PHONE:0912345678');
  });

  it('giới hạn số lần yêu cầu OTP trên mỗi số điện thoại', async () => {
    for (let i = 0; i < 10; i++) {
      await service.requestPhoneOtp('0912345678');
    }
    await expect(service.requestPhoneOtp('0912345678')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('khóa xác thực sau 3 lần nhập sai kể cả khi có OTP mới', async () => {
    await service.requestPhoneOtp('0912345678');
    for (let i = 0; i < 3; i++) {
      await expect(
        service.verifyPhoneOtp('0912345678', '000000'),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
    await service.requestPhoneOtp('0912345678'); // cấp OTP mới
    const correct = store.get('OTP:PHONE:0912345678') as string;
    await expect(
      service.verifyPhoneOtp('0912345678', correct),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('AuthController phone validation', () => {
  const makeController = () => {
    const authService = {
      requestPhoneOtp: jest.fn().mockResolvedValue({ ok: true }),
    };
    const i18n = { t: jest.fn((k: string) => k) };
    return {
      authService,
      controller: new AuthController(authService as never, i18n as never),
    };
  };

  it.each(['abc', '123', '09123', '0912345678901', ''])(
    'từ chối số điện thoại không hợp lệ: "%s"',
    async (phone) => {
      const { controller, authService } = makeController();
      await expect(controller.requestPhoneOtp(phone)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(authService.requestPhoneOtp).not.toHaveBeenCalled();
    },
  );

  it.each(['0912345678', '+84912345678'])(
    'chấp nhận số điện thoại hợp lệ: %s',
    async (phone) => {
      const { controller, authService } = makeController();
      await controller.requestPhoneOtp(phone);
      expect(authService.requestPhoneOtp).toHaveBeenCalledWith(phone);
    },
  );
});

describe('requireSecret', () => {
  const original = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = original;
  });

  it('dùng giá trị cấu hình khi có', () => {
    expect(requireSecret('abc', 'X', 'dev')).toBe('abc');
  });

  it('dùng giá trị mặc định ở môi trường phát triển', () => {
    process.env.NODE_ENV = 'development';
    expect(requireSecret(undefined, 'X', 'dev')).toBe('dev');
  });

  it('dừng khởi động khi thiếu khóa ở môi trường production', () => {
    process.env.NODE_ENV = 'production';
    expect(() => requireSecret(undefined, 'JWT_SECRET', 'dev')).toThrow(
      /JWT_SECRET/,
    );
  });
});
