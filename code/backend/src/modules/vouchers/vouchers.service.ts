import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  async validateVoucher(code: string, subtotal: number) {
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

    if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }

    if (voucher.minOrderValue && subtotal < Number(voucher.minOrderValue)) {
      throw new BadRequestException(`Đơn hàng chưa đạt giá trị tối thiểu ${voucher.minOrderValue}đ`);
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
}
