import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartSyncService } from './cart-sync.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [CartController],
  providers: [CartService, CartSyncService, PrismaService],
  exports: [CartService],
})
export class CartModule {}
