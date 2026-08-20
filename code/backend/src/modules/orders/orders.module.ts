import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersPaymentService } from './orders-payment.service';
import { OrdersReturnService } from './orders-return.service';
import { OrdersCronService } from './orders-cron.service';
import { RedisModule } from '../redis/redis.module';
import { MailModule } from '../mail/mail.module';
import { StorageModule } from '../storage/storage.module';
import { PaymentModule } from '../payment/payment.module';
import { OrdersEventsSubscriber } from './orders-events.subscriber';

@Module({
  imports: [RedisModule, MailModule, StorageModule, PaymentModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersPaymentService,
    OrdersReturnService,
    OrdersCronService,
    OrdersEventsSubscriber,
  ],
})
export class OrdersModule {}
