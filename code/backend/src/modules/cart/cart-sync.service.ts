import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CartSyncService {
  private readonly logger = new Logger(CartSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.debug(
      'Starting background sync of Cart from Redis to PostgreSQL...',
    );
    try {
      // Get up to 1000 updated user IDs from the Redis set
      const userIds = await this.redisService.spop('cart_updates', 1000);

      if (!userIds || userIds.length === 0) {
        this.logger.debug('No cart updates to sync.');
        return;
      }

      this.logger.log(`Found ${userIds.length} carts to sync. Processing...`);

      for (const userId of userIds) {
        const cartKey = `cart:${userId}`;
        const cartData = await this.redisService.hgetall(cartKey);

        await this.prisma.$transaction(async (prisma) => {
          // Delete items that are no longer in Redis
          const redisProductIds = Object.keys(cartData);

          if (redisProductIds.length === 0) {
            // Cart is empty, delete all items for this user in PG
            await prisma.cartItem.deleteMany({
              where: { userId },
            });
            return;
          }

          // Delete items that are in PG but not in Redis
          await prisma.cartItem.deleteMany({
            where: {
              userId,
              productId: {
                notIn: redisProductIds,
              },
            },
          });

          // Upsert items that exist in Redis
          for (const [productId, qtyStr] of Object.entries(cartData)) {
            const quantity = parseInt(qtyStr, 10);
            if (isNaN(quantity) || quantity <= 0) continue;

            await prisma.cartItem.upsert({
              where: {
                userId_productId: {
                  userId,
                  productId,
                },
              },
              update: {
                quantity,
              },
              create: {
                userId,
                productId,
                quantity,
              },
            });
          }
        });
      }

      this.logger.log(`Successfully synced ${userIds.length} carts.`);
    } catch (error) {
      this.logger.error('Error syncing carts from Redis to PostgreSQL', error);
    }
  }
}
