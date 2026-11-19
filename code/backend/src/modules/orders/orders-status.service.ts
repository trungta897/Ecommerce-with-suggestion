import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class OrdersStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService,
  ) {}

  async cancelOrder(
    orderId: string,
    userId?: string,
    isStaff: boolean = false,
    lang?: string,
    options?: { expiredBefore?: Date },
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Atomic Claim with status condition
      const updateResult = await tx.order.updateMany({
        where: {
          id: orderId,
          status: options?.expiredBefore
            ? OrderStatus.PENDING_PAYMENT
            : { in: [OrderStatus.PENDING, OrderStatus.PENDING_PAYMENT] },
          ...(options?.expiredBefore
            ? { paymentExpiresAt: { lt: options.expiredBefore } }
            : {}),
          ...(userId && !isStaff ? { userId } : {}),
        },
        data: {
          status: OrderStatus.CANCELLED,
          ...(options?.expiredBefore ? {} : { paymentExpiresAt: null }),
        },
      });

      if (updateResult.count === 0) {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.CANNOT_CANCEL, { lang }),
        );
      }

      // 2. Safe idempotent stock increment and flash sale quota rollback
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        if (item.productDiscountId) {
          await tx.$executeRaw`
            UPDATE product_discounts
            SET flashSaleSold = GREATEST(0, flashSaleSold - ${item.quantity})
            WHERE id = ${item.productDiscountId}
          `;
        }
      }

      // 3. Read-after-claim: restore VIP points if used
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (order?.userId && order.usedVipPoints > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { vipPoints: { increment: order.usedVipPoints } },
        });
        await tx.order.update({
          where: { id: orderId },
          data: { usedVipPoints: 0 },
        });
      }

      // 4. Safe Voucher rollback
      if (order?.voucherId) {
        await tx.$executeRaw`
          UPDATE vouchers
          SET usedCount = GREATEST(0, usedCount - 1)
          WHERE id = ${order.voucherId}
        `;
        await tx.userVoucherUsage.deleteMany({
          where: { orderId, voucherId: order.voucherId },
        });
      }

      return tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
      });
    });

    this.eventEmitter.emit(`order.updated.${orderId}`, {
      status: OrderStatus.CANCELLED,
    });
    this.eventEmitter.emit(`order.status.changed`, {
      orderId,
      status: OrderStatus.CANCELLED,
    });

    return updated;
  }

  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    lang?: string,
  ) {
    const { status, deliveryPartner, trackingId } = dto;

    if (!Object.values(OrderStatus).includes(status)) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
      );
    }

    if (status === OrderStatus.CANCELLED) {
      return this.cancelOrder(orderId, undefined, true, lang);
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.OrderUpdateInput = {
        status,
        ...(deliveryPartner ? { deliveryPartner } : {}),
        ...(trackingId ? { trackingId } : {}),
      };

      if (status === OrderStatus.COMPLETED && !order.pointsCreditedAt) {
        if (order.userId && order.earnedVipPoints > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { vipPoints: { increment: order.earnedVipPoints } },
          });
        }
        updateData.pointsCreditedAt = new Date();
        updateData.completedAt = new Date();
      }

      if (status === OrderStatus.RETURNED) {
        if (
          order.userId &&
          order.pointsCreditedAt &&
          order.earnedVipPoints > 0
        ) {
          const user = await tx.user.findUnique({
            where: { id: order.userId },
          });
          if (user) {
            if (user.vipPoints >= order.earnedVipPoints) {
              await tx.user.update({
                where: { id: order.userId },
                data: { vipPoints: { decrement: order.earnedVipPoints } },
              });
            } else {
              const debt = order.earnedVipPoints - user.vipPoints;
              await tx.user.update({
                where: { id: order.userId },
                data: { vipPoints: 0, vipPointsDebt: { increment: debt } },
              });
            }
          }
          // Prevent double revoke
          updateData.pointsCreditedAt = null;
          updateData.earnedVipPoints = 0;
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: updateData,
      });
    });

    this.eventEmitter.emit(`order.updated.${orderId}`, {
      status,
      deliveryPartner,
      trackingId,
    });
    this.eventEmitter.emit(`order.status.changed`, {
      orderId,
      status,
      deliveryPartner,
      trackingId,
    });

    return updated;
  }
}
