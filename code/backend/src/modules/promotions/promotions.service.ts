import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { PROMOTION_MESSAGES } from '../../common/constants/promotion-message.constant';
import { Prisma } from '@prisma/client';

@Injectable()
export class PromotionsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async onModuleInit() {
    try {
      const total = await this.prisma.productDiscount.count();
      if (total > 0) return;
      const prods = await this.prisma.product.findMany({
        where: { isActive: true, price: { gt: 100000 } },
        take: 8,
        orderBy: { createdAt: 'desc' },
      });
      const rates = [0.2, 0.25, 0.15, 0.3, 0.2, 0.18, 0.22, 0.28];
      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 3600000);
      const endDate = new Date(now.getTime() + 72 * 3600000);
      for (let i = 0; i < prods.length; i++) {
        const orig = Number(prods[i].price);
        const discountPrice = Math.max(
          1000,
          Math.round((orig * (1 - rates[i % rates.length])) / 1000) * 1000,
        );
        await this.prisma.productDiscount.create({
          data: {
            productId: prods[i].id,
            discountPrice,
            flashSaleQty: 25 + (i % 4) * 5,
            flashSaleSold: 5 + (i % 5) * 2,
            startDate,
            endDate,
            isActive: true,
          },
        });
      }
    } catch {
      // Ignore seed errors during unit test / disconnected DB startup
    }
  }

  async getActiveFlashSales() {
    const now = new Date();
    const discounts = await this.prisma.productDiscount.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return discounts.filter(
      (d) =>
        d.product && d.product.isActive && d.flashSaleSold < d.flashSaleQty,
    );
  }

  async createDiscount(dto: CreateDiscountDto, lang?: string) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException(
        this.i18n.t(PROMOTION_MESSAGES.INVALID_DATES, { lang }),
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product || !product.isActive) {
      throw new BadRequestException(
        this.i18n.t(PROMOTION_MESSAGES.PRODUCT_NOT_FOUND, { lang }),
      );
    }

    if (dto.discountPrice <= 0 || dto.discountPrice >= Number(product.price)) {
      throw new BadRequestException(
        this.i18n.t(PROMOTION_MESSAGES.INVALID_DISCOUNT_PRICE, { lang }),
      );
    }

    const conflict = await this.prisma.productDiscount.findFirst({
      where: {
        productId: dto.productId,
        isActive: true,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (conflict) {
      throw new BadRequestException(
        this.i18n.t(PROMOTION_MESSAGES.OVERLAP_ERROR, {
          args: {
            start: conflict.startDate.toISOString(),
            end: conflict.endDate.toISOString(),
          },
          lang,
        }),
      );
    }

    return this.prisma.productDiscount.create({
      data: {
        productId: dto.productId,
        discountPrice: dto.discountPrice,
        flashSaleQty: dto.flashSaleQty,
        flashSaleSold: 0,
        startDate,
        endDate,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        product: { include: { category: true } },
      },
    });
  }

  async updateDiscount(id: string, dto: UpdateDiscountDto, lang?: string) {
    const existing = await this.prisma.productDiscount.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        this.i18n.t(PROMOTION_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    const productId = dto.productId || existing.productId;
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;

    if (endDate <= startDate) {
      throw new BadRequestException(
        this.i18n.t(PROMOTION_MESSAGES.INVALID_DATES, { lang }),
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.isActive) {
      throw new BadRequestException(
        this.i18n.t(PROMOTION_MESSAGES.PRODUCT_NOT_FOUND, { lang }),
      );
    }

    const nextDiscountPrice =
      dto.discountPrice !== undefined
        ? dto.discountPrice
        : Number(existing.discountPrice);
    if (nextDiscountPrice <= 0 || nextDiscountPrice >= Number(product.price)) {
      throw new BadRequestException(
        this.i18n.t(PROMOTION_MESSAGES.INVALID_DISCOUNT_PRICE, { lang }),
      );
    }

    const conflict = await this.prisma.productDiscount.findFirst({
      where: {
        id: { not: id },
        productId,
        isActive: true,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (conflict) {
      throw new BadRequestException(
        this.i18n.t(PROMOTION_MESSAGES.OVERLAP_ERROR, {
          args: {
            start: conflict.startDate.toISOString(),
            end: conflict.endDate.toISOString(),
          },
          lang,
        }),
      );
    }

    const updateData: Prisma.ProductDiscountUpdateInput = {};
    if (dto.productId) updateData.product = { connect: { id: dto.productId } };
    if (dto.discountPrice !== undefined)
      updateData.discountPrice = dto.discountPrice;
    if (dto.flashSaleQty !== undefined)
      updateData.flashSaleQty = dto.flashSaleQty;
    if (dto.startDate) updateData.startDate = startDate;
    if (dto.endDate) updateData.endDate = endDate;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return this.prisma.productDiscount.update({
      where: { id },
      data: updateData,
      include: {
        product: { include: { category: true } },
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    productId?: string,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductDiscountWhereInput = {};
    if (productId) where.productId = productId;
    if (isActive !== undefined) where.isActive = isActive;

    const [discounts, total] = await Promise.all([
      this.prisma.productDiscount.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              stock: true,
              images: true,
              category: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.productDiscount.count({ where }),
    ]);

    return {
      data: discounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, lang?: string) {
    const discount = await this.prisma.productDiscount.findUnique({
      where: { id },
      include: { product: { include: { category: true } } },
    });
    if (!discount) {
      throw new NotFoundException(
        this.i18n.t(PROMOTION_MESSAGES.NOT_FOUND, { lang }),
      );
    }
    return discount;
  }

  async deleteDiscount(id: string, lang?: string) {
    const existing = await this.prisma.productDiscount.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(
        this.i18n.t(PROMOTION_MESSAGES.NOT_FOUND, { lang }),
      );
    }
    return this.prisma.productDiscount.delete({ where: { id } });
  }
}
