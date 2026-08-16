import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  async validateVoucher(code: string, subtotal: number, phone: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
    });

    if (!voucher) {
      throw new BadRequestException('Mã giảm giá không tồn tại');
    }

    if (!voucher.isActive) {
      throw new BadRequestException('Mã giảm giá đã bị khóa');
    }

    const now = new Date();
    if (voucher.startDate && now < voucher.startDate) {
      throw new BadRequestException('Mã giảm giá chưa bắt đầu');
    }
    if (voucher.endDate && now > voucher.endDate) {
      throw new BadRequestException('Mã giảm giá đã hết hạn');
    }

    if (voucher.usageLimit !== null && voucher.usageLimit > 0) {
      // Check global usage
      if (voucher.usedCount >= voucher.usageLimit) {
        throw new BadRequestException(
          'Mã giảm giá đã hết lượt sử dụng trên toàn hệ thống',
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
        throw new BadRequestException('Bạn đã sử dụng mã giảm giá này rồi');
      }
    }

    if (voucher.minOrderValue && subtotal < Number(voucher.minOrderValue)) {
      throw new BadRequestException(
        `Đơn hàng chưa đạt giá trị tối thiểu ${voucher.minOrderValue.toString()}đ`,
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

  async toggleStatus(id: string) {
    const voucher = await this.prisma.voucher.findUnique({ where: { id } });
    if (!voucher) throw new BadRequestException('Voucher not found');
    return this.prisma.voucher.update({
      where: { id },
      data: { isActive: !voucher.isActive },
    });
  }
}
