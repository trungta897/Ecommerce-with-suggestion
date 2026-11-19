import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { I18nLang } from 'nestjs-i18n';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('flash-sale/active')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm Flash Sale đang diễn ra' })
  async getActiveFlashSales() {
    return this.promotionsService.getActiveFlashSales();
  }

  @Get('discounts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Danh sách các đợt Flash Sale / Giảm giá' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('productId') productId?: string,
    @Query('isActive') isActiveStr?: string,
  ) {
    const isActive =
      isActiveStr === 'true'
        ? true
        : isActiveStr === 'false'
          ? false
          : undefined;
    return this.promotionsService.findAll(+page, +limit, productId, isActive);
  }

  @Get('discounts/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Xem chi tiết 1 đợt giảm giá' })
  async findOne(@Param('id') id: string, @I18nLang() lang: string) {
    return this.promotionsService.findOne(id, lang);
  }

  @Post('discounts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Tạo mới đợt Flash Sale / Giảm giá' })
  async create(@Body() dto: CreateDiscountDto, @I18nLang() lang: string) {
    return this.promotionsService.createDiscount(dto, lang);
  }

  @Patch('discounts/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Cập nhật đợt Flash Sale / Giảm giá' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDiscountDto,
    @I18nLang() lang: string,
  ) {
    return this.promotionsService.updateDiscount(id, dto, lang);
  }

  @Delete('discounts/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Xóa đợt Flash Sale' })
  async delete(@Param('id') id: string, @I18nLang() lang: string) {
    return this.promotionsService.deleteDiscount(id, lang);
  }
}
