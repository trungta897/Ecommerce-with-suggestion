import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { PROMOTION_MESSAGES } from '../../common/constants/promotion-message.constant';
import { Prisma } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Lấy danh sách sản phẩm Flash Sale đang active và còn suất
   */
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
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Lọc các bản ghi còn suất bán và sản phẩm đang active
    return discounts.filter(
      (d) =>
        d.product && d.product.isActive && d.flashSaleSold < d.flashSaleQty,
    );
  }

  /**
   * Admin: Tạo một đợt Flash Sale / Product Discount mới
   * Validate chống chồng lấn khung giờ trước khi INSERT
   */
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

    // Validate chống chồng lấn thời gian cho cùng 1 sản phẩm
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
        product: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  /**
   * Admin: Cập nhật đợt Flash Sale
   * Validate chống chồng lấn khung giờ loại trừ bản ghi đang sửa (id != :id)
   */
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

    // Kiểm tra xung đột thời gian (loại trừ chính bản ghi này)
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
        product: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  /**
   * Admin: Lấy danh sách Flash Sale có phân trang và bộ lọc
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    productId?: string,
    isActive?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductDiscountWhereInput = {};

    if (productId) {
      where.productId = productId;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

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

  /**
   * Lấy chi tiết 1 bản ghi discount
   */
  async findOne(id: string, lang?: string) {
    const discount = await this.prisma.productDiscount.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!discount) {
      throw new NotFoundException(
        this.i18n.t(PROMOTION_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    return discount;
  }

  /**
   * Xóa hoặc vô hiệu hóa discount
   */
  async deleteDiscount(id: string, lang?: string) {
    const existing = await this.prisma.productDiscount.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        this.i18n.t(PROMOTION_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    return this.prisma.productDiscount.delete({
      where: { id },
    });
  }
}
