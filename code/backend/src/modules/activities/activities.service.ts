import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LogActivityDto } from './dto/log-activity.dto';
import { ActivityType, Category, Prisma, Product } from '@prisma/client';

type ProductWithCategory = Product & { category: Category | null };

const DEBOUNCE_TTL_SECONDS = 300; // 5 minutes
const DEFAULT_LIMIT = 10;
const RECOMMENDATIONS_LIMIT = 8;

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async logActivity(userId: string | null, dto: LogActivityDto) {
    const actorKey = userId
      ? `USER:${userId}`
      : `SESSION:${dto.sessionId || 'UNKNOWN'}`;

    // Atomic debounce for VIEW actions to avoid spam / duplicate logs on rapid reloads
    if (dto.action === ActivityType.VIEW) {
      const throttleKey = `THROTTLE:VIEW:${actorKey}:${dto.productId}`;
      const isFirst = await this.redisService.setNx(
        throttleKey,
        '1',
        DEBOUNCE_TTL_SECONDS,
      );

      if (!isFirst) {
        return { success: true, throttled: true };
      }

      // Increment view count on product
      await this.prisma.product
        .update({
          where: { id: dto.productId },
          data: { viewCount: { increment: 1 } },
        })
        .catch(() => {});
    }

    // Save activity log in DB
    try {
      await this.prisma.userActivityLog.create({
        data: {
          userId: userId || undefined,
          sessionId: dto.sessionId || undefined,
          productId: dto.productId,
          action: dto.action,
          searchQuery: dto.searchQuery || undefined,
        },
      });
    } catch (err) {
      console.error('Failed to create user activity log:', err);
    }

    return { success: true };
  }

  async getRecentlyViewed(
    userId?: string,
    sessionId?: string,
    limit: number = DEFAULT_LIMIT,
  ) {
    if (!userId && !sessionId) {
      return [];
    }

    const orConditions: Prisma.UserActivityLogWhereInput[] = [];
    if (userId) {
      orConditions.push({ userId });
    }
    if (sessionId) {
      orConditions.push({ sessionId });
    }

    const recentLogs = await this.prisma.userActivityLog.findMany({
      where: {
        action: ActivityType.VIEW,
        OR: orConditions,
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 4,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const seenIds = new Set<string>();
    const products: ProductWithCategory[] = [];

    for (const log of recentLogs) {
      if (log.product && log.product.isActive && !seenIds.has(log.productId)) {
        seenIds.add(log.productId);
        products.push(log.product);
        if (products.length >= limit) {
          break;
        }
      }
    }

    return products;
  }

  async clearRecentlyViewed(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      return { deletedCount: 0 };
    }

    const orConditions: Prisma.UserActivityLogWhereInput[] = [];
    if (userId) {
      orConditions.push({ userId });
    }
    if (sessionId) {
      orConditions.push({ sessionId });
    }

    const result = await this.prisma.userActivityLog.deleteMany({
      where: {
        action: ActivityType.VIEW,
        OR: orConditions,
      },
    });

    return { deletedCount: result.count };
  }

  async getRecommendations(
    userId?: string,
    sessionId?: string,
    currentProductId?: string,
    limit: number = RECOMMENDATIONS_LIMIT,
  ) {
    const seedProductIds: string[] = [];
    const seedCategoryIds: string[] = [];

    if (currentProductId) {
      seedProductIds.push(currentProductId);
      const currentProd = await this.prisma.product.findUnique({
        where: { id: currentProductId },
        select: { categoryId: true },
      });
      if (currentProd?.categoryId) {
        seedCategoryIds.push(currentProd.categoryId);
      }
    }

    // If user or session is present, get recent interaction seeds
    if (userId || sessionId) {
      const orConditions: Prisma.UserActivityLogWhereInput[] = [];
      if (userId) orConditions.push({ userId });
      if (sessionId) orConditions.push({ sessionId });

      const recentActivities = await this.prisma.userActivityLog.findMany({
        where: { OR: orConditions },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          product: {
            select: { id: true, categoryId: true },
          },
        },
      });

      for (const act of recentActivities) {
        if (act.product) {
          if (!seedProductIds.includes(act.product.id)) {
            seedProductIds.push(act.product.id);
          }
          if (
            act.product.categoryId &&
            !seedCategoryIds.includes(act.product.categoryId)
          ) {
            seedCategoryIds.push(act.product.categoryId);
          }
        }
      }
    }

    const recommendedProductMap = new Map<string, ProductWithCategory>();
    const excludeIds = new Set<string>(seedProductIds);

    // 1. Check ProductRecommendation table for seedProductIds
    if (seedProductIds.length > 0) {
      const recRows = await this.prisma.productRecommendation.findMany({
        where: {
          productId: { in: seedProductIds },
        },
        orderBy: { score: 'desc' },
        take: limit * 2,
        include: {
          recommended: {
            include: { category: true },
          },
        },
      });

      for (const row of recRows) {
        const prod = row.recommended;
        if (
          prod &&
          prod.isActive &&
          !excludeIds.has(prod.id) &&
          !recommendedProductMap.has(prod.id)
        ) {
          recommendedProductMap.set(prod.id, prod);
          if (recommendedProductMap.size >= limit) {
            break;
          }
        }
      }
    }

    // 2. If we still need more products, find top products from matching categories
    if (recommendedProductMap.size < limit && seedCategoryIds.length > 0) {
      const categoryProducts = await this.prisma.product.findMany({
        where: {
          categoryId: { in: seedCategoryIds },
          isActive: true,
          id: {
            notIn: Array.from(
              new Set([
                ...excludeIds,
                ...Array.from(recommendedProductMap.keys()),
              ]),
            ),
          },
        },
        orderBy: [
          { soldCount: 'desc' },
          { avgRating: 'desc' },
          { viewCount: 'desc' },
        ],
        take: limit - recommendedProductMap.size,
        include: {
          category: true,
        },
      });

      for (const prod of categoryProducts) {
        recommendedProductMap.set(prod.id, prod);
      }
    }

    // 3. Fallback (Cold start): Top rated & best selling products
    if (recommendedProductMap.size < limit) {
      const fallbackProducts = await this.prisma.product.findMany({
        where: {
          isActive: true,
          id: {
            notIn: Array.from(
              new Set([
                ...excludeIds,
                ...Array.from(recommendedProductMap.keys()),
              ]),
            ),
          },
        },
        orderBy: [
          { avgRating: 'desc' },
          { soldCount: 'desc' },
          { viewCount: 'desc' },
        ],
        take: limit - recommendedProductMap.size,
        include: {
          category: true,
        },
      });

      for (const prod of fallbackProducts) {
        recommendedProductMap.set(prod.id, prod);
      }
    }

    return Array.from(recommendedProductMap.values()).slice(0, limit);
  }
}
