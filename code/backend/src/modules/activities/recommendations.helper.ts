import { Category, Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RECOMMENDATIONS_LIMIT } from '../../common/constants/activity.constant';

export type ProductWithCategory = Product & { category: Category | null };

export async function fetchDbFallbackRecommendations(
  prisma: PrismaService,
  userId?: string,
  sessionId?: string,
  currentProductId?: string,
  limit: number = RECOMMENDATIONS_LIMIT,
): Promise<ProductWithCategory[]> {
  const seedProductIds: string[] = [];
  const seedCategoryIds: string[] = [];

  if (currentProductId) {
    seedProductIds.push(currentProductId);
    const currentProd = await prisma.product.findUnique({
      where: { id: currentProductId },
      select: { categoryId: true },
    });
    if (currentProd?.categoryId) {
      seedCategoryIds.push(currentProd.categoryId);
    }
  }

  if (userId || sessionId) {
    const orConditions: Prisma.UserActivityLogWhereInput[] = [];
    if (userId) orConditions.push({ userId });
    if (sessionId) orConditions.push({ sessionId });

    const recentActivities = await prisma.userActivityLog.findMany({
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

  if (seedProductIds.length > 0) {
    const recRows = await prisma.productRecommendation.findMany({
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

  if (recommendedProductMap.size < limit && seedCategoryIds.length > 0) {
    const categoryProducts = await prisma.product.findMany({
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

  if (recommendedProductMap.size < limit) {
    const fallbackProducts = await prisma.product.findMany({
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
