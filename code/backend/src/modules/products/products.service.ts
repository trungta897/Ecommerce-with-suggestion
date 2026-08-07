import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StorageService } from '../storage/storage.service';
import { I18nService } from 'nestjs-i18n';
import 'multer';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private i18n: I18nService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    categorySlug?: string,
    includeInactive = false,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = includeInactive
      ? {}
      : { isActive: true };

    if (categorySlug) {
      const slugs = categorySlug.split(',').map((s) => s.trim());
      where.category = { slug: { in: slugs } };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
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

    const createData: Prisma.ProductUncheckedCreateInput = dto;

    return this.prisma.product.create({
      data: createData,
      include: { category: true },
    });
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

    const updateData: Prisma.ProductUncheckedUpdateInput = dto;

    return this.prisma.product.update({
      where: { id: existingProduct.id },
      data: updateData,
      include: { category: true },
    });
  }

  async remove(id: string, lang: string = 'vi') {
    const existingProduct = await this.findById(id, lang);
    return this.prisma.product.update({
      where: { id: existingProduct.id },
      data: { isActive: false },
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return this.storage.uploadFile(
      'products',
      `${Date.now()}-${file.originalname}`,
      file.buffer,
    );
  }
}
