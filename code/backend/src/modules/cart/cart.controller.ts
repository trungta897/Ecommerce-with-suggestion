import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Headers,
  Request as Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { MergeCartDto } from './dto/merge-cart.dto';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: RequestWithUser) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post()
  addItem(
    @Req() req: RequestWithUser,
    @Body() dto: AddToCartDto,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.cartService.addItem(req.user.userId, dto, lang);
  }

  @Put(':productId')
  updateItem(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartDto,
    @Headers('accept-language') lang: string = 'vi',
  ) {
    return this.cartService.updateItem(req.user.userId, productId, dto, lang);
  }

  @Delete(':productId')
  removeItem(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(req.user.userId, productId);
  }

  @Post('merge')
  mergeCart(@Req() req: RequestWithUser, @Body() dto: MergeCartDto) {
    return this.cartService.mergeCart(req.user.userId, dto);
  }
}
