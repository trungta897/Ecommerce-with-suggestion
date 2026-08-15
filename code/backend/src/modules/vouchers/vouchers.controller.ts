import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { VouchersService } from './vouchers.service';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get('validate')
  async validateVoucher(
    @Query('code') code: string,
    @Query('subtotal') subtotalStr: string,
  ) {
    if (!code || !subtotalStr) {
      throw new BadRequestException('Voucher code and subtotal are required');
    }

    const subtotal = Number(subtotalStr);
    if (isNaN(subtotal) || subtotal < 0) {
      throw new BadRequestException('Invalid subtotal');
    }

    return this.vouchersService.validateVoucher(code, subtotal);
  }
}
