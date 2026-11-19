import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { I18nLang } from 'nestjs-i18n';
import { VouchersService } from './vouchers.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { DEFAULT_LANG } from '../../common/constants/order.constant';

@ApiTags('Vouchers')
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
    @I18nLang() lang: string = DEFAULT_LANG,
  ) {
    return this.vouchersService.validateVoucher(dto, req.user?.id, lang);
  }

  @Get('validate')
  async validateVoucherQuery(
    @Query('code') code: string,
    @Query('subtotal') subtotalStr: string,
    @Query('phone') phone: string,
    @Req() req: Request & { user?: { id: string } },
    @I18nLang() lang: string = DEFAULT_LANG,
  ) {
    return this.vouchersService.validateVoucherQuery(
      code,
      subtotalStr,
      phone,
      req.user?.id,
      lang,
    );
  }

  @ApiBearerAuth()
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

  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findOne(
    @Param('id') id: string,
    @I18nLang() lang: string = DEFAULT_LANG,
  ) {
    return this.vouchersService.findOne(id, lang);
  }

  @ApiBearerAuth()
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() dto: CreateVoucherDto) {
    return this.vouchersService.create(dto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateVoucherDto) {
    return this.vouchersService.update(id, dto);
  }

  @ApiBearerAuth()
  @Patch(':id/toggle')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async toggleStatus(
    @Param('id') id: string,
    @I18nLang() lang: string = DEFAULT_LANG,
  ) {
    return this.vouchersService.toggleStatus(id, lang);
  }
}
