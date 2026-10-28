import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LogActivityDto } from './dto/log-activity.dto';
import { ActivityType, Prisma } from '@prisma/client';
import {
  DEBOUNCE_TTL_SECONDS,
  DEFAULT_ACTIVITY_LIMIT,
  FALLBACK_CACHE_TTL_SECONDS,
  HYBRID_CACHE_TTL_SECONDS,
  ML_CANDIDATE_MULTIPLIER,
  ML_MAX_CANDIDATES,
  ML_SERVICE_TIMEOUT_MS,
  RECOMMENDATIONS_LIMIT,
} from '../../common/constants/activity.constant';
import {
  collectSeedExternalItems,
  fetchDbFallbackRecommendations,
  rankAndHydrateMlProducts,
  type ProductWithCategory,
} from './recommendations.helper';

export interface ActivityEventPayload {
  userId?: string;
  sessionId?: string;
  productId: string;
  action: ActivityType;
  searchQuery?: string;
}

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent('activity.log')
  async handleActivityLogEvent(payload: ActivityEventPayload) {
    if (!payload?.productId || !payload?.action) return;
    await this.logActivity(payload.userId || null, {
      productId: payload.productId,
      action: payload.action,
      sessionId: payload.sessionId,
      searchQuery: payload.searchQuery,
    });
  }

  private async invalidateActorRecCache(
    userId?: string | null,
    sessionId?: string,
    productId?: string,
  ) {
    const actors = [userId, sessionId].filter((v): v is string => Boolean(v));
    const keysToDelete: string[] = [];
    for (const actor of actors) {
      keysToDelete.push(`REC:CACHE:${actor}:ALL:4`, `REC:CACHE:${actor}:ALL:8`);
      if (productId) {
        keysToDelete.push(
          `REC:CACHE:${actor}:${productId}:4`,
          `REC:CACHE:${actor}:${productId}:8`,
        );
      }
    }
    await Promise.all(
      keysToDelete.map((key) => this.redisService.del(key).catch(() => 0)),
    );
  }

  async logActivity(userId: string | null, dto: LogActivityDto) {
    const actorKey = userId
      ? `USER:${userId}`
      : `SESSION:${dto.sessionId || 'UNKNOWN'}`;

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

      await this.prisma.product
        .update({
          where: { id: dto.productId },
          data: { viewCount: { increment: 1 } },
        })
        .catch(() => {});
    }

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
      await this.invalidateActorRecCache(userId, dto.sessionId, dto.productId);
    } catch (err) {
      this.logger.error('Failed to create user activity log:', err);
    }

    return { success: true };
  }

  async getRecentlyViewed(
    userId?: string,
    sessionId?: string,
    limit: number = DEFAULT_ACTIVITY_LIMIT,
  ) {
    if (!userId && !sessionId) {
      return [];
    }

    const orConditions: Prisma.UserActivityLogWhereInput[] = [];
    if (userId) orConditions.push({ userId });
    if (sessionId) orConditions.push({ sessionId });

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
    if (userId) orConditions.push({ userId });
    if (sessionId) orConditions.push({ sessionId });

    const result = await this.prisma.userActivityLog.deleteMany({
      where: {
        action: ActivityType.VIEW,
        OR: orConditions,
      },
    });

    await this.invalidateActorRecCache(userId, sessionId);
    return { deletedCount: result.count };
  }

  async getRecommendations(
    userId?: string,
    sessionId?: string,
    currentProductId?: string,
    limit: number = RECOMMENDATIONS_LIMIT,
  ) {
    const actorIdentifier = userId || sessionId || 'GUEST';
    const cacheKey = `REC:CACHE:${actorIdentifier}:${currentProductId || 'ALL'}:${limit}`;

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as ProductWithCategory[];
      }
    } catch (err) {
      this.logger.warn(`Redis get cache error: ${err}`);
    }

    try {
      const { itemIds, weights } = await collectSeedExternalItems(
        this.prisma,
        userId,
        sessionId,
        currentProductId,
      );

      if (userId || itemIds.length > 0) {
        const mlUrl =
          this.configService.get<string>('ML_SERVICE_URL') ||
          'http://localhost:8001';
        const mlApiKey =
          this.configService.get<string>('ML_API_KEY') || 'test_api_key_123';
        const candidateLimit = Math.min(
          limit * ML_CANDIDATE_MULTIPLIER,
          ML_MAX_CANDIDATES,
        );

        const query = new URLSearchParams({ limit: String(candidateLimit) });
        if (itemIds.length > 0) {
          query.set('items', itemIds.join(','));
          query.set('weights', weights.join(','));
        }

        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          ML_SERVICE_TIMEOUT_MS,
        );

        const response = await fetch(
          `${mlUrl}/recommend/hybrid/${encodeURIComponent(actorIdentifier)}?${query.toString()}`,
          {
            method: 'GET',
            headers: {
              'X-API-Key': mlApiKey,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          },
        ).finally(() => clearTimeout(timeout));

        if (response.ok) {
          const mlData = (await response.json()) as {
            items: Array<{ product_id: string; score: number }>;
            algorithm?: string;
          };

          if (mlData.items && mlData.items.length > 0) {
            const externalOrInternalIds = mlData.items.map((i) => i.product_id);
            const dbProducts = await this.prisma.product.findMany({
              where: {
                isActive: true,
                OR: [
                  { id: { in: externalOrInternalIds } },
                  { sourceExternalId: { in: externalOrInternalIds } },
                ],
              },
              include: {
                category: true,
              },
            });

            const ranked = rankAndHydrateMlProducts(
              dbProducts,
              mlData.items,
              currentProductId,
              limit,
            );

            if (ranked.length > 0) {
              if (ranked.length < limit) {
                const fallbackMore = await fetchDbFallbackRecommendations(
                  this.prisma,
                  userId,
                  sessionId,
                  currentProductId,
                  limit,
                );
                const existingIds = new Set(ranked.map((p) => p.id));
                for (const fb of fallbackMore) {
                  if (!existingIds.has(fb.id)) {
                    ranked.push(fb);
                    existingIds.add(fb.id);
                    if (ranked.length >= limit) break;
                  }
                }
              }

              await this.redisService
                .set(cacheKey, JSON.stringify(ranked), HYBRID_CACHE_TTL_SECONDS)
                .catch(() => {});

              return ranked;
            }
          }
        }
      }
    } catch (err) {
      this.logger.warn(
        `ML Service call failed or timed out (500ms). Falling back to DB recommendations. Reason: ${err}`,
      );
    }

    const fallbackResults = await fetchDbFallbackRecommendations(
      this.prisma,
      userId,
      sessionId,
      currentProductId,
      limit,
    );

    await this.redisService
      .set(
        cacheKey,
        JSON.stringify(fallbackResults),
        FALLBACK_CACHE_TTL_SECONDS,
      )
      .catch(() => {});

    return fallbackResults;
  }
}
