import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredOrders() {
    this.logger.debug('Running handleExpiredOrders cronjob');

    const now = new Date();

    // Find all expired orders
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        paymentExpiresAt: {
          lt: now,
        },
      },
    });

    for (const order of expiredOrders) {
      await this.prisma.$transaction(async (tx) => {
        // Atomic Update chống Concurrency
        const updated = await tx.order.updateMany({
          where: {
            id: order.id,
            status: OrderStatus.PENDING_PAYMENT, // Condition
          },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });

        if (updated.count > 0) {
          // Trả lại tồn kho
          const items = await tx.orderItem.findMany({
            where: { orderId: order.id },
          });
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
          this.logger.debug(`Order ${order.id} cancelled due to timeout`);
        }
      });
    }
  }

  @Cron('*/15 * * * *') // Every 15 mins
  async cleanupProcessingRefunds() {
    this.logger.debug('Running cleanupProcessingRefunds cronjob');
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    const stuckOrders = await this.prisma.order.findMany({
      where: {
        refundStatus: 'PROCESSING',
        updatedAt: {
          lt: fifteenMinsAgo,
        },
      },
    });

    for (const order of stuckOrders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { refundStatus: null },
      });
      this.logger.warn(`Reset stuck refund status for order ${order.id}`);
    }
  }
}
