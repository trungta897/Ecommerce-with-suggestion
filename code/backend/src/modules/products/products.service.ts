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
import { Category, Prisma, Product } from '@prisma/client';
import { DEFAULT_LANG } from '../../common/constants/order.constant';
import {
  DEFAULT_HOME_SECTION_SLUGS,
  findAllAdminProductsHelper,
  getHomeSectionsHelper,
  type HomeSectionResult,
} from './products-home.helper';

export interface PaginatedProductsResult {
  data: Array<Product & { category: Category | null }>;
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly redis: RedisService,
    private readonly i18n: I18nService,
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
  ): Promise<PaginatedProductsResult> {
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
        return JSON.parse(cachedData) as PaginatedProductsResult;
      }
    }

    const [data, total] = await Promise.all([
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

    const result: PaginatedProductsResult = {
      data,
      metadata: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };

    if (!skipCache) {
      await this.redis.set(cacheKey, JSON.stringify(result), 300);
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
    return findAllAdminProductsHelper(
      this.prisma,
      page,
      limit,
      categorySlug,
      q,
      status,
      stockStatus,
    );
  }

  async findById(id: string, lang: string = DEFAULT_LANG) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException(this.i18n.t('products.NOT_FOUND', { lang }));
    }
    return product;
  }

  async findBySlug(slug: string, lang: string = DEFAULT_LANG) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!product) {
      throw new NotFoundException(this.i18n.t('products.NOT_FOUND', { lang }));
    }
    return product;
  }

  async create(dto: CreateProductDto, lang: string = DEFAULT_LANG) {
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

  async update(id: string, dto: UpdateProductDto, lang: string = DEFAULT_LANG) {
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

  async remove(id: string, lang: string = DEFAULT_LANG) {
    const existingProduct = await this.findById(id, lang);
    const result = await this.prisma.product.update({
      where: { id: existingProduct.id },
      data: { isActive: false },
    });

    await this.clearProductCache();
    return result;
  }

  async getHomeSections(
    slugs: string[] = DEFAULT_HOME_SECTION_SLUGS,
    limitPerCategory: number = 8,
  ): Promise<HomeSectionResult[]> {
    return getHomeSectionsHelper(
      this.prisma,
      this.redis,
      slugs,
      limitPerCategory,
    );
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
