import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../database/prisma.service';
import { VnPayService } from './vnpay.service';
import type { ReturnQueryFromVNPay } from 'vnpay';
import type { Order } from '@prisma/client';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import { DEFAULT_LANG } from '../../common/constants/order.constant';
import {
  buildPayableWhere,
  isPayableNow,
} from '../orders/order-payment.policy';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly vnPayService: VnPayService,
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('vnpay/create/:orderId')
  async createVnPayOrder(
    @Req() req: ExpressRequest & { user: { id: string } },
    @Param('orderId') orderId: string,
    @I18nLang() lang: string = DEFAULT_LANG,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== req.user.id) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    return this.createPaymentLinkForOrder(order, req, lang);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('vnpay/create/guest/:orderId')
  async createGuestVnPayOrder(
    @Req() req: ExpressRequest,
    @Param('orderId') orderId: string,
    @Body('phone') phone?: string,
    @I18nLang() lang: string = DEFAULT_LANG,
  ) {
    if (!phone) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== null || order.shippingPhone !== phone) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    return this.createPaymentLinkForOrder(order, req, lang);
  }

  private async createPaymentLinkForOrder(
    order: Order,
    req: ExpressRequest,
    lang: string,
  ) {
    const now = new Date();
    if (!isPayableNow(order, now)) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.PAYMENT_WINDOW_CLOSED, { lang }),
      );
    }

    // Format: 32 hex chars (orderId without hyphens) + 13 digits (timestamp) = 45 alphanumeric chars
    const appTransId = `${order.id.replace(/-/g, '')}${Date.now()}`;

    const updated = await this.prisma.order.updateMany({
      where: buildPayableWhere(order.id, now),
      data: { paymentGatewayTxnId: appTransId },
    });

    if (updated.count === 0) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.PAYMENT_WINDOW_CLOSED, { lang }),
      );
    }

    const forwarded = req.headers['x-forwarded-for'];
    const ipAddr =
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : Array.isArray(forwarded)
          ? forwarded[0]?.trim()
          : req.socket?.remoteAddress) || '127.0.0.1';

    const amountToPayVnd = Math.round(
      order.isDepositPayment
        ? Number(order.depositAmount)
        : Number(order.totalAmount),
    );

    const paymentUrl = this.vnPayService.createPaymentUrl(
      order.id,
      amountToPayVnd,
      ipAddr,
      appTransId,
    );

    return { orderUrl: paymentUrl };
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
