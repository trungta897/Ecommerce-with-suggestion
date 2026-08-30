import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Headers,
  Request as Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { WishlistService } from './wishlist.service';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('wishlist')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  UserRole.CUSTOMER,
  UserRole.EMPLOYEE,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Req() req: RequestWithUser) {
    return this.wishlistService.getUserWishlist(req.user.userId);
  }

  @Get('ids')
  getWishlistIds(@Req() req: RequestWithUser) {
    return this.wishlistService.getUserWishlistIds(req.user.userId);
  }

  @Post(':productId')
  toggleWishlist(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.wishlistService.toggleWishlist(
      req.user.userId,
      productId,
      lang,
    );
  }

  @Delete(':productId')
  removeFromWishlist(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.wishlistService.removeFromWishlist(
      req.user.userId,
      productId,
      lang,
    );
  }
}
