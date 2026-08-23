import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '@nestjs/passport';
import { Req } from '@nestjs/common';
import { Request } from 'express';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UserRole } from '@prisma/client';
import { I18nLang } from 'nestjs-i18n';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':productId')
  @UseGuards(AuthGuard('jwt'))
  create(
    @Param('productId') productId: string,
    @Body() createReviewDto: CreateReviewDto,
    @Req() req: Request & { user: { id: string } },
    @I18nLang() lang: string,
  ) {
    return this.reviewsService.create(
      productId,
      createReviewDto,
      req.user.id,
      lang,
    );
  }

  @Get('product/:productId')
  findAllByProduct(
    @Param('productId') productId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.reviewsService.findAllByProduct(productId, +page, +limit);
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPER_ADMIN)
  findAllForAdmin(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.reviewsService.findAllForAdmin(+page, +limit);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  findMyReviews(@Req() req: Request & { user: { id: string } }) {
    return this.reviewsService.findMyReviews(req.user.id);
  }

  @Patch(':id/toggle-visibility')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPER_ADMIN)
  toggleVisibility(@Param('id') id: string, @I18nLang() lang: string) {
    return this.reviewsService.toggleVisibility(id, lang);
  }
}
