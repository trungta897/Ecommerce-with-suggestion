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
  Req,
} from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { I18nLang } from 'nestjs-i18n';
import { Request } from 'express';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get('public')
  async getPublicVouchers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.vouchersService.getPublicVouchers(+page, +limit);
  }

  @Post('validate')
  async validateVoucher(
    @Body() dto: ValidateVoucherDto,
    @Req() req: Request & { user?: { id: string } },
    @I18nLang() lang: string,
  ) {
    const userId = req.user?.id;
    return this.vouchersService.validateVoucher(dto, userId, lang);
  }

  @Get('validate')
  async validateVoucherQuery(
    @Query('code') code: string,
    @Query('subtotal') subtotalStr: string,
    @Query('phone') phone: string,
    @Req() req: Request & { user?: { id: string } },
    @I18nLang() lang: string,
  ) {
    if (!code || !subtotalStr) {
      throw new BadRequestException('Voucher code and subtotal are required');
    }

    const subtotal = Number(subtotalStr);
    if (isNaN(subtotal) || subtotal < 0) {
      throw new BadRequestException('Invalid subtotal');
    }

    const dto: ValidateVoucherDto = {
      code,
      subtotal,
      phone,
    };

    const userId = req.user?.id;
    return this.vouchersService.validateVoucher(dto, userId, lang);
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    return this.vouchersService.findAll(+page, +limit, search);
  }

  @Get(':id/usages')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getVoucherUsages(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.vouchersService.getVoucherUsages(id, +page, +limit);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() dto: CreateVoucherDto) {
    return this.vouchersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateVoucherDto) {
    return this.vouchersService.update(id, dto);
  }

  @Patch(':id/toggle')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async toggleStatus(@Param('id') id: string, @I18nLang() lang: string) {
    return this.vouchersService.toggleStatus(id, lang);
  }
}
