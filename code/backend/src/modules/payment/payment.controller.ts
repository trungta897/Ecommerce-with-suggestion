import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  Req,
  Query,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../database/prisma.service';
import { VnPayService } from './vnpay.service';
import type { ReturnQueryFromVNPay } from 'vnpay';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly vnPayService: VnPayService,
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  @Post('vnpay/create/:orderId')
  async createVnPayOrder(
    @Req() req: ExpressRequest,
    @Param('orderId') orderId: string,
    @Body('phone') phone?: string,
    @I18nLang() lang: string = 'vi',
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    // Verify order eligibility for payment
    if (
      order.paymentStatus === PaymentStatus.COMPLETED ||
      order.paymentStatus === PaymentStatus.PARTIALLY_PAID ||
      (order.status !== OrderStatus.PENDING_PAYMENT &&
        order.status !== OrderStatus.PENDING)
    ) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
      );
    }

    // Verify guest phone if provided or if guest order
    if (order.shippingPhone && phone && order.shippingPhone !== phone) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.PHONE_MISMATCH, { lang }),
      );
    }

    // Format: orderId_timestamp -> unique mỗi lần gọi
    const appTransId = `${orderId.replace(/-/g, '').slice(0, 8)}_${Date.now().toString().slice(-5)}`;

    // Atomic Update DB lưu appTransId với điều kiện trạng thái chưa hoàn tất
    const updated = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        paymentStatus: {
          notIn: [PaymentStatus.COMPLETED, PaymentStatus.PARTIALLY_PAID],
        },
        status: { in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PENDING] },
      },
      data: { paymentGatewayTxnId: appTransId },
    });

    if (updated.count === 0) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
      );
    }

    // Dynamic resolution of client IP from headers/socket
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddr =
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : Array.isArray(forwarded)
          ? forwarded[0]?.trim()
          : req.socket?.remoteAddress) || '127.0.0.1';

    // Total Amount / deposit Amount in VND for VNPay
    const amountToPayVnd = Math.round(
      order.isDepositPayment
        ? Number(order.depositAmount)
        : Number(order.totalAmount),
    );

    const paymentUrl = this.vnPayService.createPaymentUrl(
      orderId,
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
  handleStripeWebhook(@Body() data: any) {
    return this.paymentService.handleStripeWebhook(data);
  }
}
