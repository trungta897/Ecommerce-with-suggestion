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
      where.OR = [{ name: { contains: q } }, { description: { contains: q } }];
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

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return this.storage.uploadFile(
      'products',
      `${Date.now()}-${file.originalname}`,
      file.buffer,
    );
  }

  private async clearProductCache() {
    await this.redis.deletePattern('products:*');
  }
}
