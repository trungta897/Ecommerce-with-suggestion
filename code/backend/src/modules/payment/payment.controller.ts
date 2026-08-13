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

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook/zalopay')
  async handleZaloPayWebhook(@Body() data: any) {
    return this.paymentService.handleZaloPayWebhook(data);
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
