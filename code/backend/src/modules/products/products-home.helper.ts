import { Category, Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';

export const DEFAULT_HOME_SECTION_SLUGS = [
  'laptop',
  'man-hinh',
  'may-tinh-de-ban',
  'o-cung',
  'vga',
  'ram',
];

export interface HomeSectionResult {
  slug: string;
  name: string;
  products: Array<Product & { category: Category | null }>;
}

export async function getHomeSectionsHelper(
  prisma: PrismaService,
  redis: RedisService,
  slugs: string[] = DEFAULT_HOME_SECTION_SLUGS,
  limitPerCategory: number = 8,
): Promise<HomeSectionResult[]> {
  const cacheKey = `products:home-sections:${slugs.join(',')}:${limitPerCategory}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as HomeSectionResult[];
    } catch {
      // invalid json, proceed
    }
  }

  const sections: HomeSectionResult[] = await Promise.all(
    slugs.map(async (slug) => {
      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          children: {
            select: { id: true, slug: true },
          },
        },
      });

      if (!category) {
        return {
          slug,
          name: slug,
          products: [],
        };
      }

      const categoryIds = [category.id, ...category.children.map((c) => c.id)];

      const products = await prisma.product.findMany({
        where: {
          categoryId: { in: categoryIds },
          isActive: true,
        },
        include: {
          category: true,
        },
        orderBy: {
          soldCount: 'desc',
        },
        take: Number(limitPerCategory),
      });

      return {
        slug: category.slug,
        name: category.name,
        products,
      };
    }),
  );

  await redis.set(cacheKey, JSON.stringify(sections), 120);

  return sections;
}

export async function findAllAdminProductsHelper(
  prisma: PrismaService,
  page: number = 1,
  limit: number = 10,
  categorySlug?: string,
  q?: string,
  status?: string,
  stockStatus?: string,
) {
  const skip = (page - 1) * limit;
  const where: Prisma.ProductWhereInput = {};

  if (status === 'active') {
    where.isActive = true;
  } else if (status === 'inactive') {
    where.isActive = false;
  }

  if (stockStatus === 'in_stock') {
    where.stock = { gt: 0 };
  } else if (stockStatus === 'out_of_stock') {
    where.stock = { lte: 0 };
  }

  if (categorySlug && categorySlug !== 'all') {
    where.category = { slug: categorySlug };
  }

  if (q) {
    const keywords = q
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    if (keywords.length > 0) {
      where.AND = keywords.map((kw) => ({
        OR: [
          { name: { contains: kw } },
          { brand: { contains: kw } },
          { description: { contains: kw } },
        ],
      }));
    }
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data,
    metadata: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}
