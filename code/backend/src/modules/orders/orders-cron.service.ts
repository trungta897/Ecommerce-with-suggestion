import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, RefundStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly eventEmitter: EventEmitter2,
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
        refundStatus: RefundStatus.PROCESSING,
        updatedAt: {
          lt: fifteenMinsAgo,
        },
      },
      select: {
        id: true,
        totalAmount: true,
        paymentMethod: true,
        updatedAt: true,
      },
    });

    if (stuckOrders.length > 0) {
      for (const order of stuckOrders) {
        this.logger.warn(
          `Detected stuck refund for order ${order.id} (updatedAt: ${order.updatedAt.toISOString()}). Notifying Super Admin for audit.`,
        );
        this.eventEmitter.emit('refund.stuck', {
          orderId: order.id,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          updatedAt: order.updatedAt,
        });
      }
    }
  }

  @Cron('0 2 * * *') // 2:00 AM every day
  async cleanupStalePhoneAccounts() {
    this.logger.debug('Running cleanupStalePhoneAccounts cronjob');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // [CASCADE NOTE] UserActivityLog.userId không có onDelete:Cascade
    // -> khi xóa user, userId của logs sẽ SetNull, dữ liệu RecSys không mất.
    const staleAccounts = await this.prisma.user.findMany({
      where: {
        email: { endsWith: '@placeholder.local' },
        createdAt: { lt: thirtyDaysAgo },
        orders: { none: {} },
      },
      select: { id: true, phone: true },
    });

    if (staleAccounts.length === 0) return;

    const ids = staleAccounts.map((u) => u.id);
    await this.prisma.user.deleteMany({ where: { id: { in: ids } } });
    this.logger.log(
      `Deleted ${ids.length} stale phone-only accounts (no orders, >30 days)`,
    );
  }
}
