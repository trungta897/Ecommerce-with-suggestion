import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StorageService } from '../storage/storage.service';
import { RedisService } from '../redis/redis.service';
import { I18nService } from 'nestjs-i18n';
import 'multer';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly redis: RedisService,
    private i18n: I18nService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    categorySlug?: string,
    includeInactive = false,
    q?: string,
    minPrice?: string,
    maxPrice?: string,
    minRating?: string,
    sort?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = includeInactive
      ? {}
      : { isActive: true };

    if (categorySlug) {
      const slugs = categorySlug.split(',').map((s) => s.trim());
      where.category = { slug: { in: slugs } };
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
            { category: { name: { contains: kw } } },
          ],
        }));
      }
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice)
        (where.price as Prisma.DecimalFilter).gte = parseFloat(minPrice);
      if (maxPrice)
        (where.price as Prisma.DecimalFilter).lte = parseFloat(maxPrice);
    }

    if (minRating) {
      where.avgRating = { gte: parseFloat(minRating) };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'price_asc'
        ? { price: 'asc' }
        : sort === 'price_desc'
          ? { price: 'desc' }
          : sort === 'popular'
            ? { soldCount: 'desc' }
            : { createdAt: 'desc' };

    const skipCache = !!(q || minPrice || maxPrice || minRating || sort);
    const cacheKey = `products:page=${page}:limit=${limit}:cat=${categorySlug || 'all'}:inactive=${includeInactive}`;

    if (!skipCache) {
      const cachedData = await this.redis.get(cacheKey);
      if (cachedData) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(cachedData);
      }
    }

    const [data, total] = await Promise.all([
      // [EAGER LOADING] Sử dụng include để lấy kèm category, tránh lỗi N+1 Query
      // [PAGINATION] Cơ chế phân trang được áp dụng thông qua skip và take
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy,
        skip,
        take: Number(limit),
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = {
      data,
      metadata: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };

    if (!skipCache) {
      await this.redis.set(cacheKey, JSON.stringify(result), 300); // cache for 5 minutes
    }

    return result;
  }

  async findAllAdmin(
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
      this.prisma.product.findMany({
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
      this.prisma.product.count({ where }),
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

  async findById(id: string, lang: string = 'vi') {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException(this.i18n.t('products.NOT_FOUND', { lang }));
    }
    return product;
  }

  async findBySlug(slug: string, lang: string = 'vi') {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException(this.i18n.t('products.NOT_FOUND', { lang }));
    }
    return product;
  }

  async create(dto: CreateProductDto, lang: string = 'vi') {
    const existing = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(
        this.i18n.t('products.SLUG_EXISTS', { lang }),
      );
    }

    const createData = dto as unknown as Prisma.ProductUncheckedCreateInput;

    const result = await this.prisma.product.create({
      data: createData,
      include: { category: true },
    });

    await this.clearProductCache();
    return result;
  }

  async update(id: string, dto: UpdateProductDto, lang: string = 'vi') {
    const existingProduct = await this.findById(id, lang);
    if (dto.slug) {
      const existing = await this.prisma.product.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== existingProduct.id) {
        throw new ConflictException(
          this.i18n.t('products.SLUG_EXISTS', { lang }),
        );
      }
    }

    const updateData = dto as unknown as Prisma.ProductUncheckedUpdateInput;

    const result = await this.prisma.product.update({
      where: { id: existingProduct.id },
      data: updateData,
      include: { category: true },
    });

    await this.clearProductCache();
    return result;
  }

  async remove(id: string, lang: string = 'vi') {
    const existingProduct = await this.findById(id, lang);
    const result = await this.prisma.product.update({
      where: { id: existingProduct.id },
      data: { isActive: false },
    });

    await this.clearProductCache();
    return result;
  }

  async getHomeSections(
    slugs: string[] = [
      'laptop',
      'man-hinh',
      'may-tinh-de-ban',
      'o-cung',
      'vga',
      'ram',
    ],
    limitPerCategory: number = 8,
  ) {
    const cacheKey = `products:home-sections:${slugs.join(',')}:${limitPerCategory}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(cached);
      } catch {
        // invalid json, proceed
      }
    }

    const sections = await Promise.all(
      slugs.map(async (slug) => {
        const category = await this.prisma.category.findUnique({
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

        const categoryIds = [
          category.id,
          ...category.children.map((c) => c.id),
        ];

        const products = await this.prisma.product.findMany({
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

    // Cache home sections for 120 seconds
    await this.redis.set(cacheKey, JSON.stringify(sections), 120);

    return sections;
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return this.storage.uploadFile(
      'products',
      `${Date.now()}-${file.originalname}`,
      file.buffer,
    );
  }

  private async clearProductCache() {
    await Promise.all([
      this.redis.deletePattern('products:home-sections:*'),
      this.redis.deletePattern('products:page=*'),
    ]);
  }
}
