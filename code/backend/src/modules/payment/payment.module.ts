import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ZaloPayService } from './zalopay.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, ZaloPayService],
})
export class PaymentModule {}
