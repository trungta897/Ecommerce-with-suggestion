import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { VnPayService } from './vnpay.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, VnPayService],
  exports: [VnPayService],
})
export class PaymentModule {}
