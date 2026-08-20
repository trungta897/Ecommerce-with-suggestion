import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, Prisma } from '@prisma/client';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get('validate')
  async validateVoucher(
    @Query('code') code: string,
    @Query('subtotal') subtotalStr: string,
    @Query('phone') phone: string,
  ) {
    if (!code || !subtotalStr || !phone) {
      throw new BadRequestException(
        'Voucher code, subtotal, and phone are required',
      );
    }

    const subtotal = Number(subtotalStr);
    if (isNaN(subtotal) || subtotal < 0) {
      throw new BadRequestException('Invalid subtotal');
    }

    return this.vouchersService.validateVoucher(code, subtotal, phone);
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE)
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.vouchersService.findAll(+page, +limit);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() data: Prisma.VoucherCreateInput) {
    return this.vouchersService.create(data);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.VoucherUpdateInput,
  ) {
    return this.vouchersService.update(id, data);
  }

  @Patch(':id/toggle')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async toggleStatus(@Param('id') id: string) {
    return this.vouchersService.toggleStatus(id);
  }
}
