import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

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
      try {
        await this.ordersService.cancelOrder(order.id, undefined, true);
        this.logger.log(`Order ${order.id} cancelled due to payment timeout`);
      } catch (error: unknown) {
        if (error instanceof BadRequestException) {
          // Atomic Claim count === 0 (Order status changed by Webhook or user before cron executed)
          this.logger.debug(
            `Order ${order.id} skipped from timeout cancellation: ${error.message}`,
          );
        } else {
          const errMsg =
            error instanceof Error ? error.message : JSON.stringify(error);
          const errStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `Failed to cancel expired order ${order.id}: ${errMsg}`,
            errStack,
          );
        }
      }
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
