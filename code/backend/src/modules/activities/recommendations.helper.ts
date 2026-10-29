import {
  ActivityType,
  Category,
  OrderStatus,
  Prisma,
  Product,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ACTIVITY_ACTION_WEIGHTS,
  CURRENT_PRODUCT_SEED_WEIGHT,
  RECOMMENDATIONS_LIMIT,
} from '../../common/constants/activity.constant';
import { buildQuotaBalancedRecommendations } from './recommendations-quota.helper';

export type ProductWithCategory = Product & {
  category: Category | null;
  aiScore?: number;
};

export function toAiScorePercentage(
  rawScore: number,
  rankIndex: number = 0,
): number {
  if (Number.isFinite(rawScore) && rawScore > 0 && rawScore <= 1) {
    return Math.min(99, Math.max(75, Math.round(rawScore * 100)));
  }
  if (Number.isFinite(rawScore) && rawScore > 1 && rawScore <= 5) {
    return Math.min(
      99,
      Math.max(75, Math.round(75 + ((rawScore - 1) / 4) * 23 - rankIndex)),
    );
  }
  return Math.min(99, Math.max(75, 92 - rankIndex * 2));
}

export async function collectSeedExternalItems(
  prisma: PrismaService,
  userId?: string,
  sessionId?: string,
  currentProductId?: string,
): Promise<{ itemIds: string[]; weights: number[] }> {
  const weightMap = new Map<string, number>();

  if (currentProductId) {
    const currentProd = await prisma.product.findUnique({
      where: { id: currentProductId },
      select: { id: true, sourceExternalId: true },
    });
    const extId = currentProd?.sourceExternalId || currentProd?.id;
    if (extId) {
      weightMap.set(extId, CURRENT_PRODUCT_SEED_WEIGHT);
    }
  }

  if (userId || sessionId) {
    const orConditions: Prisma.UserActivityLogWhereInput[] = [];
    if (userId) orConditions.push({ userId });
    if (sessionId) orConditions.push({ sessionId });

    const recentLogs = await prisma.userActivityLog.findMany({
      where: { OR: orConditions },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        product: {
          select: { id: true, sourceExternalId: true, isActive: true },
        },
      },
    });

    for (const log of recentLogs) {
      if (!log.product || !log.product.isActive) continue;
      const extId = log.product.sourceExternalId || log.product.id;
      const actionWeight = ACTIVITY_ACTION_WEIGHTS[log.action] ?? 1;
      if (actionWeight <= 0) continue;
      const prev = weightMap.get(extId) || 0;
      weightMap.set(extId, Math.min(15, prev + actionWeight));
    }
  }

  if (userId && prisma.orderItem?.findMany) {
    const purchased = await prisma.orderItem
      .findMany({
        where: {
          order: { userId, status: { not: OrderStatus.CANCELLED } },
        },
        orderBy: { order: { createdAt: 'desc' } },
        take: 10,
        include: {
          product: {
            select: { id: true, sourceExternalId: true, isActive: true },
          },
        },
      })
      .catch(() => []);

    for (const item of purchased) {
      if (!item.product || !item.product.isActive) continue;
      const extId = item.product.sourceExternalId || item.product.id;
      const prev = weightMap.get(extId) || 0;
      weightMap.set(
        extId,
        Math.min(15, prev + ACTIVITY_ACTION_WEIGHTS[ActivityType.PURCHASE]),
      );
    }
  }

  const entries = Array.from(weightMap.entries()).slice(0, 8);
  return {
    itemIds: entries.map(([id]) => id),
    weights: entries.map(([, w]) => w),
  };
}

export function rankAndHydrateMlProducts(
  dbProducts: ProductWithCategory[],
  mlItems: Array<{ product_id: string; score: number }>,
  currentProductId: string | undefined,
  limit: number,
): ProductWithCategory[] {
  const byId = new Map<string, ProductWithCategory>();
  const byExternalId = new Map<string, ProductWithCategory>();

  for (const prod of dbProducts) {
    byId.set(prod.id, prod);
    if (prod.sourceExternalId) {
      byExternalId.set(prod.sourceExternalId, prod);
    }
  }

  const ranked: ProductWithCategory[] = [];
  const seenIds = new Set<string>();
  if (currentProductId) {
    seenIds.add(currentProductId);
  }

  for (let i = 0; i < mlItems.length; i++) {
    const mlItem = mlItems[i];
    const matched =
      byId.get(mlItem.product_id) || byExternalId.get(mlItem.product_id);
    if (!matched || !matched.isActive || seenIds.has(matched.id)) {
      continue;
    }
    seenIds.add(matched.id);
    ranked.push({
      ...matched,
      aiScore: toAiScorePercentage(mlItem.score, ranked.length),
    });
    if (ranked.length >= limit) {
      break;
    }
  }

  return ranked;
}

export async function fetchDbFallbackRecommendations(
  prisma: PrismaService,
  userId?: string,
  sessionId?: string,
  currentProductId?: string,
  limit: number = RECOMMENDATIONS_LIMIT,
): Promise<ProductWithCategory[]> {
  const seedProductIds: string[] = [];
  if (currentProductId) seedProductIds.push(currentProductId);

  if (userId || sessionId) {
    const orConditions: Prisma.UserActivityLogWhereInput[] = [];
    if (userId) orConditions.push({ userId });
    if (sessionId) orConditions.push({ sessionId });

    const recentActivities =
      (await prisma.userActivityLog.findMany({
        where: { OR: orConditions },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { productId: true },
      })) || [];

    for (const act of recentActivities) {
      if (act.productId && !seedProductIds.includes(act.productId)) {
        seedProductIds.push(act.productId);
      }
    }
  }

  const recommendedProductMap = new Map<string, ProductWithCategory>();
  const excludeIds = new Set<string>(seedProductIds);

  if (seedProductIds.length > 0) {
    const recRows = await prisma.productRecommendation.findMany({
      where: { productId: { in: seedProductIds } },
      orderBy: { score: 'desc' },
      take: limit * 2,
      include: { recommended: { include: { category: true } } },
    });

    for (const row of recRows) {
      const prod = row.recommended;
      if (
        prod &&
        prod.isActive &&
        !excludeIds.has(prod.id) &&
        !recommendedProductMap.has(prod.id)
      ) {
        recommendedProductMap.set(prod.id, {
          ...prod,
          aiScore: toAiScorePercentage(row.score, recommendedProductMap.size),
        });
      }
    }
  }

  const orderedBalanced = await buildQuotaBalancedRecommendations(
    prisma,
    Array.from(recommendedProductMap.values()),
    userId,
    sessionId,
    currentProductId,
    limit,
  );

  if (orderedBalanced.length < limit) {
    const fallbackProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        id: {
          notIn: Array.from(
            new Set([...excludeIds, ...orderedBalanced.map((p) => p.id)]),
          ),
        },
      },
      orderBy: [
        { avgRating: 'desc' },
        { soldCount: 'desc' },
        { viewCount: 'desc' },
      ],
      take: limit - orderedBalanced.length,
      include: { category: true },
    });

    for (const prod of fallbackProducts) {
      orderedBalanced.push({
        ...prod,
        aiScore: toAiScorePercentage(
          Number(prod.avgRating || 0),
          orderedBalanced.length,
        ),
      });
    }
  }

  return orderedBalanced.slice(0, limit);
}
