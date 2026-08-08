import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from '../../database/prisma.service';
import { StorageModule } from '../storage/storage.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [StorageModule, RedisModule],
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService],
  exports: [ProductsService],
})
export class ProductsModule {}
