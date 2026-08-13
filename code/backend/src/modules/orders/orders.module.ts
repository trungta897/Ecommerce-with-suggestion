import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersCronService } from './orders-cron.service';
import { RedisModule } from '../redis/redis.module';
import { MailModule } from '../mail/mail.module';
import { StorageModule } from '../storage/storage.module';
import { OrdersEventsSubscriber } from './orders-events.subscriber';

@Module({
  imports: [RedisModule, MailModule, StorageModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersCronService, OrdersEventsSubscriber],
})
export class OrdersModule {}
