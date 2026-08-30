import { Body, Controller, Param, Post, Req, Query } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { VnPayService } from './vnpay.service';
import type { ReturnQueryFromVNPay } from 'vnpay';
import { USD_TO_VND_RATE } from '../../common/constants/currency.constant';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly vnPayService: VnPayService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('vnpay/create/:orderId')
  async createVnPayOrder(
    @Req() req: ExpressRequest,
    @Param('orderId') orderId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Format: orderId_timestamp -> unique mỗi lần gọi
    const appTransId = `${orderId.replace(/-/g, '').slice(0, 8)}_${Date.now().toString().slice(-5)}`;

    // Atomic Update DB lưu appTransId TRƯỚC
    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentGatewayTxnId: appTransId },
    });

    // Dynamic resolution of client IP from headers/socket
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddr =
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : Array.isArray(forwarded)
          ? forwarded[0]?.trim()
          : req.socket?.remoteAddress) || '127.0.0.1';

    // Total Amount / deposit Amount in USD converted to VND for VNPay
    const amountUsd = order.isDepositPayment
      ? Number(order.depositAmount)
      : Number(order.totalAmount);
    const amountToPayVnd = Math.round(amountUsd * USD_TO_VND_RATE);

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
