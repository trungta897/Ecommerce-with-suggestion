import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ActivityType } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

describe('ActivitiesModule (Hybrid Recommendation & Tracking)', () => {
  let service: ActivitiesService;
  let controller: ActivitiesController;

  const mockPrisma = {
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    userActivityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    productRecommendation: {
      findMany: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    setNx: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'ML_SERVICE_URL') return 'http://localhost:8001';
      if (key === 'ML_API_KEY') return 'test_api_key_123';
      return undefined;
    }),
  };

  const mockJwt = {
    verify: jest.fn(),
    decode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ActivitiesService(
      mockPrisma as unknown as PrismaService,
      mockRedis as unknown as RedisService,
      mockConfig as unknown as ConfigService,
    );
    controller = new ActivitiesController(
      service,
      mockJwt as unknown as JwtService,
    );
  });

  describe('ActivitiesController JWT Verification (REC-03)', () => {
    it('verifies JWT signature via jwtService.verify and rejects forged tokens', async () => {
      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('invalid signature');
      });
      mockRedis.setNx.mockResolvedValueOnce(true);
      mockPrisma.product.update.mockResolvedValueOnce({});
      mockPrisma.userActivityLog.create.mockResolvedValueOnce({});

      const forgedReq = {
        headers: { authorization: 'Bearer forged.jwt.token' },
      } as unknown as Request;

      await controller.logActivity(forgedReq, {
        productId: 'prod-1',
        action: ActivityType.VIEW,
        sessionId: 'guest-sess-1',
      });

      expect(mockJwt.verify).toHaveBeenCalledWith('forged.jwt.token');
      expect(mockJwt.decode).not.toHaveBeenCalled();
      expect(mockPrisma.userActivityLog.create).toHaveBeenCalledWith({
        data: {
          userId: undefined,
          sessionId: 'guest-sess-1',
          productId: 'prod-1',
          action: ActivityType.VIEW,
          searchQuery: undefined,
        },
      });
    });
  });

  describe('ActivitiesService.getRecommendations (REC-01, REC-04, REC-07)', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('sends weighted seed ASINs to ML service, preserves ML score ranking, and populates aiScore', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockRedis.set.mockResolvedValue('OK');

      mockPrisma.product.findUnique.mockResolvedValueOnce({
        id: 'prod-current',
        sourceExternalId: 'B00CURRENT',
      });
      mockPrisma.userActivityLog.findMany.mockResolvedValueOnce([
        {
          action: ActivityType.ADD_TO_CART,
          product: {
            id: 'prod-cart',
            sourceExternalId: 'B00CART123',
            isActive: true,
          },
        },
      ]);

      // ML returns B00HIGH first (score 0.96), B00LOW second (score 0.81)
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            algorithm: 'trained_hybrid',
            items: [
              { product_id: 'B00HIGH', score: 0.96 },
              { product_id: 'B00LOW', score: 0.81 },
            ],
          }),
      });

      // Prisma findMany returns them in REVERSE order (B00LOW first, B00HIGH second)
      mockPrisma.product.findMany.mockResolvedValueOnce([
        {
          id: 'internal-low',
          name: 'Second Best GPU',
          sourceExternalId: 'B00LOW',
          isActive: true,
          category: null,
        },
        {
          id: 'internal-high',
          name: 'Top Match GPU',
          sourceExternalId: 'B00HIGH',
          isActive: true,
          category: null,
        },
      ]);

      const result = await service.getRecommendations(
        'user-uuid-1',
        'sess-1',
        'prod-current',
        2,
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('items=B00CURRENT%2CB00CART123'),
        expect.any(Object),
      );
      expect(result).toHaveLength(2);
      // Must preserve ML score rank order: B00HIGH (96%) then B00LOW (81%)
      expect(result[0].id).toBe('internal-high');
      expect(result[0].aiScore).toBe(96);
      expect(result[1].id).toBe('internal-low');
      expect(result[1].aiScore).toBe(81);
    });

    it('caps same-category recommendations at ~62.5% (5/8) and fills remaining 37.5% (3/8) from historical visits/clicks/purchases', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockRedis.set.mockResolvedValue('OK');

      // Seed: current product in cat-laptop
      mockPrisma.product.findUnique
        .mockResolvedValueOnce({
          id: 'prod-laptop-main',
          sourceExternalId: 'B00LAPTOP0',
        })
        .mockResolvedValueOnce({
          categoryId: 'cat-laptop',
        });

      // Historical activity: user previously clicked/viewed products in cat-mouse and cat-audio
      const historyLogs = [
        {
          action: ActivityType.CLICK,
          product: {
            id: 'prod-mouse-seed',
            sourceExternalId: 'B00MOUSE0',
            categoryId: 'cat-mouse',
            isActive: true,
          },
        },
        {
          action: ActivityType.VIEW,
          product: {
            id: 'prod-audio-seed',
            sourceExternalId: 'B00AUDIO0',
            categoryId: 'cat-audio',
            isActive: true,
          },
        },
      ];
      mockPrisma.userActivityLog.findMany
        .mockResolvedValueOnce(historyLogs)
        .mockResolvedValueOnce(historyLogs);

      // ML returns 7 laptops (cat-laptop) + 3 historical category items (cat-mouse, cat-audio)
      const mlItems = [
        ...Array.from({ length: 7 }, (_, i) => ({
          product_id: `B00LAP${i + 1}`,
          score: 0.98 - i * 0.01,
        })),
        { product_id: 'B00MOUSE1', score: 0.85 },
        { product_id: 'B00MOUSE2', score: 0.84 },
        { product_id: 'B00AUDIO1', score: 0.83 },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            algorithm: 'trained_hybrid',
            items: mlItems,
          }),
      });

      const dbCandidates = [
        ...Array.from({ length: 7 }, (_, i) => ({
          id: `laptop-${i + 1}`,
          name: `Laptop ${i + 1}`,
          sourceExternalId: `B00LAP${i + 1}`,
          categoryId: 'cat-laptop',
          isActive: true,
          category: null,
        })),
        {
          id: 'mouse-1',
          name: 'Gaming Mouse 1',
          sourceExternalId: 'B00MOUSE1',
          categoryId: 'cat-mouse',
          isActive: true,
          category: null,
        },
        {
          id: 'mouse-2',
          name: 'Gaming Mouse 2',
          sourceExternalId: 'B00MOUSE2',
          categoryId: 'cat-mouse',
          isActive: true,
          category: null,
        },
        {
          id: 'audio-1',
          name: 'Headset 1',
          sourceExternalId: 'B00AUDIO1',
          categoryId: 'cat-audio',
          isActive: true,
          category: null,
        },
      ];
      mockPrisma.product.findMany.mockResolvedValueOnce(dbCandidates);

      const result = await service.getRecommendations(
        'user-uuid-1',
        'sess-1',
        'prod-laptop-main',
        8,
      );

      expect(result).toHaveLength(8);
      const laptopCount = result.filter(
        (p) => p.categoryId === 'cat-laptop',
      ).length;
      const historyOtherCount = result.filter(
        (p) => p.categoryId === 'cat-mouse' || p.categoryId === 'cat-audio',
      ).length;

      // 5 out of 8 (62.5%) are same-category laptops, 3 out of 8 (37.5%) are from historical categories
      expect(laptopCount).toBe(5);
      expect(historyOtherCount).toBe(3);
    });

    it('invalidates recommendation cache when receiving @OnEvent(activity.log)', async () => {
      mockPrisma.userActivityLog.create.mockResolvedValueOnce({});
      mockRedis.del.mockResolvedValue(1);

      await service.handleActivityLogEvent({
        userId: 'user-uuid-99',
        productId: 'prod-abc',
        action: ActivityType.ADD_TO_CART,
      });

      expect(mockPrisma.userActivityLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-uuid-99',
          sessionId: undefined,
          productId: 'prod-abc',
          action: ActivityType.ADD_TO_CART,
          searchQuery: undefined,
        },
      });
      expect(mockRedis.del).toHaveBeenCalledWith(
        'REC:CACHE:user-uuid-99:ALL:4',
      );
      expect(mockRedis.del).toHaveBeenCalledWith(
        'REC:CACHE:user-uuid-99:ALL:8',
      );
    });
  });
});
