import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { VOUCHER_MESSAGES } from '../../common/constants/voucher-message.constant';

@Injectable()
export class VouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async validateVoucher(
    code: string,
    subtotal: number,
    phone: string,
    lang?: string,
  ) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
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
      // Check global usage
      if (voucher.usedCount >= voucher.usageLimit) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.SYSTEM_LIMIT_REACHED, { lang }),
        );
      }

      // Check per-phone usage limit (Assume 1 usage per phone per voucher for now)
      const usedByPhone = await this.prisma.order.count({
        where: {
          voucherId: voucher.id,
          shippingPhone: phone,
          status: {
            notIn: ['CANCELLED', 'RETURN_REJECTED', 'RETURNED', 'REFUNDED'],
          },
        },
      });

      if (usedByPhone >= 1) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.USER_LIMIT_REACHED, { lang }),
        );
      }
    }

    if (voucher.minOrderValue && subtotal < Number(voucher.minOrderValue)) {
      throw new BadRequestException(
        this.i18n.t(VOUCHER_MESSAGES.MIN_ORDER_NOT_MET, {
          lang,
          args: { min: voucher.minOrderValue.toString() },
        }),
      );
    }

    let discountAmount = 0;
    if (voucher.type === 'PERCENTAGE') {
      discountAmount = Math.floor((subtotal * Number(voucher.value)) / 100);
      if (voucher.maxDiscount && discountAmount > Number(voucher.maxDiscount)) {
        discountAmount = Number(voucher.maxDiscount);
      }
    } else if (voucher.type === 'FIXED_AMOUNT') {
      discountAmount = Number(voucher.value);
    } else if (voucher.type === 'FREE_SHIPPING') {
      discountAmount = 0; // The frontend will handle free shipping by setting shipping fee to 0
    }

    return {
      valid: true,
      voucherId: voucher.id,
      code: voucher.code,
      type: voucher.type,
      discountAmount,
    };
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.voucher.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.voucher.count(),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(data: Prisma.VoucherCreateInput) {
    return this.prisma.voucher.create({ data });
  }

  async update(id: string, data: Prisma.VoucherUpdateInput) {
    return this.prisma.voucher.update({ where: { id }, data });
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
