import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartSyncService } from './cart-sync.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [CartController],
  providers: [CartService, CartSyncService],
  exports: [CartService],
})
export class CartModule {}
