import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import Redis from 'ioredis';
import { I18nValidationPipe } from 'nestjs-i18n';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

/**
 * Kiểm thử tích hợp API bằng Supertest trên ứng dụng NestJS thật.
 * Yêu cầu MySQL và Redis đang chạy (xem docker-compose.yml) và đã chạy
 * `npm run db:seed-test-roles` để có tài khoản quản trị thử nghiệm.
 */
describe('API integration (Supertest)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let redis: Redis;
  const phone = `09${Math.floor(10000000 + Math.random() * 89999999)}`;
  let customerToken = '';
  let adminToken = '';

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new I18nValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    });

    // Đăng nhập khách hàng bằng SĐT + OTP (đọc OTP trực tiếp từ Redis)
    await request(app.getHttpServer())
      .post('/auth/phone/login')
      .send({ phone })
      .expect(201);
    const otp = await redis.get(`OTP:PHONE:${phone}`);
    const verify = await request(app.getHttpServer())
      .post('/auth/phone/verify')
      .send({ phone, otp })
      .expect(201);
    customerToken = (verify.body as { accessToken: string }).accessToken;

    const admin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: process.env.E2E_ADMIN_EMAIL ?? 'admin@datn.com',
        password: process.env.E2E_ADMIN_PASSWORD ?? 'Admin@123456',
      });
    adminToken = (admin.body as { accessToken?: string }).accessToken ?? '';
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { phone } });
    await redis.del(
      `OTP:PHONE:${phone}`,
      `OTP:FAIL_PHONE:${phone}`,
      `OTP:REQ_PHONE:${phone}`,
    );
    redis.disconnect();
    await app.close();
  });

  it('GET /products trả về danh sách phân trang', async () => {
    const res = await request(app.getHttpServer()).get('/products').expect(200);
    const body = res.body as { data: unknown[]; metadata: unknown };
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.metadata).toBeDefined();
  });

  it('POST /auth/phone/login từ chối số điện thoại sai định dạng', async () => {
    await request(app.getHttpServer())
      .post('/auth/phone/login')
      .send({ phone: 'abc' })
      .expect(400);
  });

  it('GET /orders/admin không có token trả về 401', async () => {
    await request(app.getHttpServer()).get('/orders/admin').expect(401);
  });

  it('GET /orders/admin với vai trò CUSTOMER trả về 403 (RolesGuard)', async () => {
    await request(app.getHttpServer())
      .get('/orders/admin')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('GET /orders/admin với vai trò quản trị trả về 200', async () => {
    expect(adminToken).not.toBe('');
    await request(app.getHttpServer())
      .get('/orders/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('GET /orders/my trả về danh sách rỗng cho khách mới', async () => {
    const res = await request(app.getHttpServer())
      .get('/orders/my')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    const body = res.body as { data?: unknown[] } | unknown[];
    const items = Array.isArray(body) ? body : (body.data ?? []);
    expect(items).toHaveLength(0);
  });

  it('GET /orders/guest/:id với đơn không tồn tại trả về 404', async () => {
    await request(app.getHttpServer())
      .get('/orders/guest/00000000-0000-0000-0000-000000000000')
      .query({ phone: '0900000000' })
      .expect(404);
  });

  it('POST /payment/webhook/vnpay với chữ ký sai trả về RspCode 97', async () => {
    const res = await request(app.getHttpServer())
      .post('/payment/webhook/vnpay')
      .query({
        vnp_Amount: '100000',
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'invalid-ref',
        vnp_SecureHash: 'deadbeef',
      });
    expect((res.body as { RspCode: string }).RspCode).toBe('97');
  });

  it('POST /orders/:id/return của người khác bị từ chối', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders/00000000-0000-0000-0000-000000000000/return')
      .set('Authorization', `Bearer ${customerToken}`)
      .field('returnReason', 'DEFECTIVE');
    expect([400, 403, 404]).toContain(res.status);
  });
});
