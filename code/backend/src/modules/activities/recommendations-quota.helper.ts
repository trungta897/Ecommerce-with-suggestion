import { ActivityType, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ACTIVITY_ACTION_WEIGHTS,
  RECOMMENDATIONS_LIMIT,
  SAME_CATEGORY_MAX_RATIO,
} from '../../common/constants/activity.constant';
import {
  toAiScorePercentage,
  type ProductWithCategory,
} from './recommendations.helper';

export interface UserBehaviorProfile {
  primaryCategoryId?: string;
  behaviorCategoryIds: string[];
  excludeProductIds: Set<string>;
}

export async function collectUserBehaviorProfile(
  prisma: PrismaService,
  userId?: string,
  sessionId?: string,
  currentProductId?: string,
): Promise<UserBehaviorProfile> {
  const excludeProductIds = new Set<string>();
  const categoryScores = new Map<string, number>();
  let currentCategoryId: string | undefined;

  if (currentProductId) {
    excludeProductIds.add(currentProductId);
    const currentProd = await prisma.product.findUnique({
      where: { id: currentProductId },
      select: { categoryId: true },
    });
    if (currentProd?.categoryId) {
      currentCategoryId = currentProd.categoryId;
    }
  }

  if (userId || sessionId) {
    const orConditions: Prisma.UserActivityLogWhereInput[] = [];
    if (userId) orConditions.push({ userId });
    if (sessionId) orConditions.push({ sessionId });

    const recentLogs =
      (await prisma.userActivityLog.findMany({
        where: { OR: orConditions },
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: {
          product: {
            select: { id: true, categoryId: true, isActive: true },
          },
        },
      })) || [];

    for (const log of recentLogs) {
      if (!log.product || !log.product.isActive) continue;
      const weight = ACTIVITY_ACTION_WEIGHTS[log.action] ?? 1;
      if (weight <= 0) continue;
      if (log.product.categoryId) {
        const prev = categoryScores.get(log.product.categoryId) || 0;
        categoryScores.set(log.product.categoryId, prev + weight);
      }
    }
  }

  if (userId && prisma.orderItem?.findMany) {
    const purchasedItems = await prisma.orderItem
      .findMany({
        where: {
          order: {
            userId,
            status: { not: OrderStatus.CANCELLED },
          },
        },
        orderBy: { order: { createdAt: 'desc' } },
        take: 15,
        include: {
          product: {
            select: { id: true, categoryId: true, isActive: true },
          },
        },
      })
      .catch(() => []);

    for (const item of purchasedItems) {
      if (!item.product || !item.product.isActive) continue;
      excludeProductIds.add(item.product.id);
      if (item.product.categoryId) {
        const prev = categoryScores.get(item.product.categoryId) || 0;
        categoryScores.set(
          item.product.categoryId,
          prev + ACTIVITY_ACTION_WEIGHTS[ActivityType.PURCHASE],
        );
      }
    }
  }

  const sortedCategories = Array.from(categoryScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([catId]) => catId);

  const primaryCategoryId = currentCategoryId || sortedCategories[0];
  const behaviorCategoryIds = sortedCategories.filter(
    (catId) => catId !== primaryCategoryId,
  );

  return {
    primaryCategoryId,
    behaviorCategoryIds,
    excludeProductIds,
  };
}

export async function buildQuotaBalancedRecommendations(
  prisma: PrismaService,
  candidates: ProductWithCategory[],
  userId?: string,
  sessionId?: string,
  currentProductId?: string,
  limit: number = RECOMMENDATIONS_LIMIT,
): Promise<ProductWithCategory[]> {
  const profile = await collectUserBehaviorProfile(
    prisma,
    userId,
    sessionId,
    currentProductId,
  );

  const { primaryCategoryId, behaviorCategoryIds, excludeProductIds } = profile;
  if (!primaryCategoryId) {
    return candidates.slice(0, limit);
  }

  const maxSameCategory = Math.max(
    1,
    Math.round(limit * SAME_CATEGORY_MAX_RATIO),
  );
  const behaviorQuota = Math.max(0, limit - maxSameCategory);

  const result: ProductWithCategory[] = [];
  const usedIds = new Set<string>(excludeProductIds);

  // 1. Primary Category Bucket (Up to 60-65% max)
  for (const item of candidates) {
    if (result.length >= maxSameCategory) break;
    if (item.categoryId === primaryCategoryId && !usedIds.has(item.id)) {
      usedIds.add(item.id);
      result.push(item);
    }
  }

  if (result.length < maxSameCategory) {
    const dbSameCategory =
      (await prisma.product.findMany({
        where: {
          categoryId: primaryCategoryId,
          isActive: true,
          id: { notIn: Array.from(usedIds) },
        },
        orderBy: [
          { soldCount: 'desc' },
          { avgRating: 'desc' },
          { viewCount: 'desc' },
        ],
        take: maxSameCategory - result.length,
        include: { category: true },
      })) || [];

    for (const prod of dbSameCategory) {
      usedIds.add(prod.id);
      result.push({
        ...prod,
        aiScore: toAiScorePercentage(
          Number(prod.avgRating || 0),
          result.length,
        ),
      });
    }
  }

  // 2. Cross-Category Historical Behavior Bucket (35-40% from past visits, clicks, purchases)
  const behaviorSet = new Set<string>(behaviorCategoryIds);
  let behaviorAdded = 0;

  for (const item of candidates) {
    if (behaviorAdded >= behaviorQuota || result.length >= limit) break;
    if (
      item.categoryId !== primaryCategoryId &&
      behaviorSet.has(item.categoryId) &&
      !usedIds.has(item.id)
    ) {
      usedIds.add(item.id);
      result.push(item);
      behaviorAdded++;
    }
  }

  if (behaviorAdded < behaviorQuota && behaviorCategoryIds.length > 0) {
    const dbBehaviorProducts =
      (await prisma.product.findMany({
        where: {
          categoryId: { in: behaviorCategoryIds },
          isActive: true,
          id: { notIn: Array.from(usedIds) },
        },
        orderBy: [
          { soldCount: 'desc' },
          { avgRating: 'desc' },
          { viewCount: 'desc' },
        ],
        take: behaviorQuota - behaviorAdded,
        include: { category: true },
      })) || [];

    for (const prod of dbBehaviorProducts) {
      usedIds.add(prod.id);
      result.push({
        ...prod,
        aiScore: toAiScorePercentage(
          Number(prod.avgRating || 0),
          result.length,
        ),
      });
      behaviorAdded++;
    }
  }

  // 3. Remaining Cross-Category ML Candidates
  for (const item of candidates) {
    if (result.length >= limit) break;
    if (item.categoryId !== primaryCategoryId && !usedIds.has(item.id)) {
      usedIds.add(item.id);
      result.push(item);
    }
  }

  // 4. Safe Backfill if still < limit (e.g., brand-new user with no cross-category history)
  for (const item of candidates) {
    if (result.length >= limit) break;
    if (!usedIds.has(item.id)) {
      usedIds.add(item.id);
      result.push(item);
    }
  }

  return result.slice(0, limit);
}
