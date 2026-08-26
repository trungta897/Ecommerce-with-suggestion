import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, Prisma, VoucherScope } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { VOUCHER_MESSAGES } from '../../common/constants/voucher-message.constant';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';

@Injectable()
export class VouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async validateVoucher(
    dto: ValidateVoucherDto,
    userId?: string,
    lang?: string,
  ) {
    const { code, subtotal, phone, items } = dto;

    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!voucher) {
      throw new BadRequestException(
        this.i18n.t(VOUCHER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    if (!voucher.isActive) {
      throw new BadRequestException(
        this.i18n.t(VOUCHER_MESSAGES.DISABLED, { lang }),
      );
    }

    const now = new Date();
    if (voucher.startDate && now < voucher.startDate) {
      throw new BadRequestException(
        this.i18n.t(VOUCHER_MESSAGES.NOT_STARTED, { lang }),
      );
    }
    if (voucher.endDate && now > voucher.endDate) {
      throw new BadRequestException(
        this.i18n.t(VOUCHER_MESSAGES.EXPIRED, { lang }),
      );
    }

    if (voucher.usageLimit !== null && voucher.usageLimit > 0) {
      if (voucher.usedCount >= voucher.usageLimit) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.SYSTEM_LIMIT_REACHED, { lang }),
        );
      }
    }

    // Check perUserLimit: User vs Guest
    let usedCountForUser = 0;
    const nonCancelledStatuses = {
      notIn: [
        OrderStatus.CANCELLED,
        OrderStatus.RETURN_REJECTED,
        OrderStatus.RETURNED,
        OrderStatus.REFUNDED,
      ],
    };

    if (userId) {
      usedCountForUser = await this.prisma.userVoucherUsage.count({
        where: {
          voucherId: voucher.id,
          userId,
          order: {
            status: nonCancelledStatuses,
          },
        },
      });
    } else if (phone) {
      usedCountForUser = await this.prisma.userVoucherUsage.count({
        where: {
          voucherId: voucher.id,
          order: {
            shippingPhone: phone,
            status: nonCancelledStatuses,
          },
        },
      });
    }

    if (usedCountForUser >= voucher.perUserLimit) {
      throw new BadRequestException(
        this.i18n.t(VOUCHER_MESSAGES.USER_LIMIT_REACHED, { lang }),
      );
    }

    if (voucher.minOrderValue && subtotal < Number(voucher.minOrderValue)) {
      throw new BadRequestException(
        this.i18n.t(VOUCHER_MESSAGES.MIN_ORDER_NOT_MET, {
          lang,
          args: { min: Number(voucher.minOrderValue).toLocaleString('vi-VN') },
        }),
      );
    }

    // Scope-based Discount Calculation
    let eligibleSubtotal = subtotal;

    if (voucher.scope === VoucherScope.CATEGORY && voucher.categoryId) {
      if (!items || items.length === 0) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.CATEGORY_NOT_MATCHED, { lang }),
        );
      }

      const productIds = items.map((i) => i.productId);
      const matchingProducts = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          categoryId: voucher.categoryId,
        },
        select: { id: true },
      });

      const matchingProductIds = new Set(matchingProducts.map((p) => p.id));
      const eligibleItems = items.filter((i) =>
        matchingProductIds.has(i.productId),
      );

      if (eligibleItems.length === 0) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.CATEGORY_NOT_MATCHED, { lang }),
        );
      }

      eligibleSubtotal = eligibleItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      );

      // Anti-Stacking Rule: Chặn voucher PERCENTAGE trên sản phẩm đang Flash Sale
      if (voucher.type === 'PERCENTAGE') {
        const activeFlashSale = await this.prisma.productDiscount.findFirst({
          where: {
            productId: { in: eligibleItems.map((i) => i.productId) },
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
          },
          orderBy: { startDate: 'asc' },
        });

        if (activeFlashSale) {
          throw new BadRequestException(
            this.i18n.t(VOUCHER_MESSAGES.FLASH_SALE_CONFLICT, { lang }),
          );
        }
      }
    } else if (voucher.scope === VoucherScope.PRODUCT && voucher.productId) {
      if (!items || items.length === 0) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.PRODUCT_NOT_MATCHED, { lang }),
        );
      }

      const eligibleItems = items.filter(
        (i) => i.productId === voucher.productId,
      );

      if (eligibleItems.length === 0) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.PRODUCT_NOT_MATCHED, { lang }),
        );
      }

      eligibleSubtotal = eligibleItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      );

      // Anti-Stacking Rule: Chặn voucher PERCENTAGE trên sản phẩm đang Flash Sale
      if (voucher.type === 'PERCENTAGE') {
        const activeFlashSale = await this.prisma.productDiscount.findFirst({
          where: {
            productId: voucher.productId,
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
          },
          orderBy: { startDate: 'asc' },
        });

        if (activeFlashSale) {
          throw new BadRequestException(
            this.i18n.t(VOUCHER_MESSAGES.FLASH_SALE_CONFLICT, { lang }),
          );
        }
      }
    }

    let discountAmount = 0;
    if (voucher.type === 'PERCENTAGE') {
      discountAmount = Math.floor(
        (eligibleSubtotal * Number(voucher.value)) / 100,
      );
      if (voucher.maxDiscount && discountAmount > Number(voucher.maxDiscount)) {
        discountAmount = Number(voucher.maxDiscount);
      }
    } else if (voucher.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(Number(voucher.value), eligibleSubtotal);
    } else if (voucher.type === 'FREE_SHIPPING') {
      discountAmount = 0; // The frontend will handle free shipping
    }

    return {
      valid: true,
      voucherId: voucher.id,
      code: voucher.code,
      type: voucher.type,
      scope: voucher.scope,
      discountAmount,
      minOrderValue: Number(voucher.minOrderValue),
      maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : null,
      category: voucher.category,
      product: voucher.product,
    };
  }

  async getPublicVouchers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.VoucherWhereInput = {
      isActive: true,
      isPublic: true,
      endDate: { gte: now },
      startDate: { lte: now },
    };

    const [data, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          product: {
            select: { id: true, name: true, slug: true, images: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.voucher.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getVoucherUsages(voucherId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [usages, total] = await Promise.all([
      this.prisma.userVoucherUsage.findMany({
        where: { voucherId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          order: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              shippingPhone: true,
              shippingName: true,
              createdAt: true,
            },
          },
        },
        orderBy: { usedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userVoucherUsage.count({ where: { voucherId } }),
    ]);

    return {
      data: usages,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.VoucherWhereInput = search
      ? {
          code: { contains: search },
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          product: { select: { id: true, name: true } },
          _count: { select: { usages: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.voucher.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
      include: {
        category: true,
        product: true,
      },
    });
    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }
    return voucher;
  }

  async create(dto: CreateVoucherDto) {
    const { startDate, endDate, ...rest } = dto;
    return this.prisma.voucher.create({
      data: {
        ...rest,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });
  }

  async update(id: string, dto: UpdateVoucherDto) {
    const { startDate, endDate, ...rest } = dto;
    const updateData: Prisma.VoucherUpdateInput = {
      ...rest,
    };
    if (startDate) {
      updateData.startDate = new Date(startDate);
    }
    if (endDate) {
      updateData.endDate = new Date(endDate);
    }

    return this.prisma.voucher.update({
      where: { id },
      data: updateData,
    });
  }

  async toggleStatus(id: string, lang?: string) {
    const voucher = await this.prisma.voucher.findUnique({ where: { id } });
    if (!voucher) {
      throw new BadRequestException(
        this.i18n.t(VOUCHER_MESSAGES.NOT_FOUND, { lang }),
      );
    }
    return this.prisma.voucher.update({
      where: { id },
      data: { isActive: !voucher.isActive },
    });
  }
}
