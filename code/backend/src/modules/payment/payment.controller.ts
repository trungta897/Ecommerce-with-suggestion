import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import type { ReturnQueryFromVNPay } from 'vnpay';
import { I18nLang } from 'nestjs-i18n';
import { DEFAULT_LANG } from '../../common/constants/order.constant';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  private extractClientIp(req: ExpressRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    return (
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : Array.isArray(forwarded)
          ? forwarded[0]?.trim()
          : req.socket?.remoteAddress) || '127.0.0.1'
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('vnpay/create/:orderId')
  async createVnPayOrder(
    @Req() req: ExpressRequest & { user: { id: string } },
    @Param('orderId') orderId: string,
    @I18nLang() lang: string = DEFAULT_LANG,
  ) {
    const ipAddr = this.extractClientIp(req);
    return this.paymentService.createVnPayOrderForUser(
      orderId,
      req.user.id,
      ipAddr,
      lang,
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('vnpay/create/guest/:orderId')
  async createGuestVnPayOrder(
    @Req() req: ExpressRequest,
    @Param('orderId') orderId: string,
    @Body('phone') phone?: string,
    @I18nLang() lang: string = DEFAULT_LANG,
  ) {
    const ipAddr = this.extractClientIp(req);
    return this.paymentService.createVnPayOrderForGuest(
      orderId,
      phone,
      ipAddr,
      lang,
    );
  }

  @Post('webhook/vnpay')
  async handleVnPayWebhook(@Query() query: ReturnQueryFromVNPay) {
    return this.paymentService.handleVnPayWebhook(query);
  }

  @Post('webhook/stripe')
  handleStripeWebhook(@Body() data: unknown) {
    return this.paymentService.handleStripeWebhook(data);
  }
}
