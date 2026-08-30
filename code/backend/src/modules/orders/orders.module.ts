import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersShippingService } from './orders-shipping.service';
import { OrdersCheckoutService } from './orders-checkout.service';
import { OrdersQueryService } from './orders-query.service';
import { OrdersStatusService } from './orders-status.service';
import { OrdersPaymentService } from './orders-payment.service';
import { OrdersReturnService } from './orders-return.service';
import { OrdersCronService } from './orders-cron.service';
import { RedisModule } from '../redis/redis.module';
import { MailModule } from '../mail/mail.module';
import { StorageModule } from '../storage/storage.module';
import { PaymentModule } from '../payment/payment.module';
import { OrdersEventsSubscriber } from './orders-events.subscriber';

@Module({
  imports: [
    RedisModule,
    MailModule,
    StorageModule,
    PaymentModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret_key_change_me',
    }),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersShippingService,
    OrdersCheckoutService,
    OrdersQueryService,
    OrdersStatusService,
    OrdersPaymentService,
    OrdersReturnService,
    OrdersCronService,
    OrdersEventsSubscriber,
  ],
})
export class OrdersModule {}
