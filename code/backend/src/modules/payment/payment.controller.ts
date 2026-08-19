import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { VnPayService } from './vnpay.service';
import type { ReturnQueryFromVNPay } from 'vnpay';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly vnPayService: VnPayService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('vnpay/create/:orderId')
  async createVnPayOrder(
    @Req() req: Request & { user: { id: string } },
    @Param('orderId') orderId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== req.user.id) {
      throw new NotFoundException('Order not found or access denied');
    }

    // Format: orderId_timestamp -> unique mỗi lần gọi
    const appTransId = `${orderId.replace(/-/g, '').slice(0, 8)}_${Date.now().toString().slice(-5)}`;

    // Atomic Update DB lưu appTransId TRƯỚC
    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentGatewayTxnId: appTransId },
    });

    // We assume '127.0.0.1' or get ip from req
    const ipAddr = '127.0.0.1'; // TODO: Get actual client IP

    // Total Amount / deposit Amount based on order type
    const amountToPay = order.isDepositPayment
      ? Number(order.depositAmount)
      : Number(order.totalAmount);

    const paymentUrl = this.vnPayService.createPaymentUrl(
      orderId,
      amountToPay,
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
