import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ZaloPayService } from './zalopay.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly zaloPayService: ZaloPayService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('webhook/zalopay')
  async handleZaloPayWebhook(@Body() data: any) {
    return this.paymentService.handleZaloPayWebhook(data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('zalopay/create/:orderId')
  async createZaloPayOrder(
    @Req() req: Request & { user: { id: string } },
    @Param('orderId') orderId: string,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order || order.userId !== req.user.id) {
      throw new NotFoundException('Order not found or access denied');
    }

    // Format: yymmdd_orderId_timestamp -> unique mỗi lần gọi
    const transDate = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const appTransId = `${transDate}_${orderId.replace(/-/g, '').slice(0, 8)}_${Date.now().toString().slice(-5)}`;

    // Atomic Update DB lưu appTransId TRƯỚC
    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentGatewayTxnId: appTransId }
    });

    return this.zaloPayService.createOrder(
      orderId,
      appTransId,
      Number(order.totalAmount),
      `Thanh toán đơn hàng #${orderId.slice(0, 8)}`,
    );
  }

  @Post('webhook/stripe')
  async handleStripeWebhook(@Body() data: any) {
    return this.paymentService.handleStripeWebhook(data);
  }

  @Post('webhook/bank-transfer')
  async handleBankTransferWebhook(@Body() data: any) {
    return this.paymentService.handleBankTransferWebhook(data);
  }

  // Admin routes
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('admin/confirm/:orderId')
  async manualConfirm(
    @Req() req: Request & { user: { id: string } },
    @Param('orderId') orderId: string,
    @Body()
    body: { amountReceived: number; isForceConfirm?: boolean; reason?: string },
  ) {
    const adminId = req.user.id;
    return this.paymentService.manualConfirmPayment(
      adminId,
      orderId,
      body.amountReceived,
      body.isForceConfirm,
      body.reason,
    );
  }
}
