import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, Order } from '@prisma/client';
import { appendAuditTrail } from '../../common/utils/audit-trail.util';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class OrdersPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async payAgain(userId: string, orderId: string, lang?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }
    if (order.userId !== userId) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.UNAUTHORIZED, { lang }),
      );
    }

    return this.processPayAgain(order, lang);
  }

  async payAgainGuest(orderId: string, phone: string, lang?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }
    if (order.shippingPhone !== phone) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.PHONE_MISMATCH, { lang }),
      );
    }

    return this.processPayAgain(order, lang);
  }

  private async processPayAgain(order: Order, lang?: string) {
    if (order.status === OrderStatus.PENDING_PAYMENT) {
      const paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentExpiresAt },
      });
      return updatedOrder;
    }

    if (order.status === OrderStatus.CANCELLED) {
      const paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        const claimResult = await tx.order.updateMany({
          where: { id: order.id, status: OrderStatus.CANCELLED },
          data: {
            status: OrderStatus.PENDING_PAYMENT,
            paymentExpiresAt,
          },
        });

        if (claimResult.count === 0) {
          throw new BadRequestException(
            this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
          );
        }

        const orderItems = await tx.orderItem.findMany({
          where: { orderId: order.id },
        });
        for (const item of orderItems) {
          const updatedProduct = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          if (updatedProduct.count === 0) {
            throw new BadRequestException(
              'Không đủ tồn kho để thanh toán lại đơn hàng này',
            );
          }
        }

        return await tx.order.findUnique({ where: { id: order.id } });
      });

      return updatedOrder;
    } else {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
      );
    }
  }

  async forceConfirmPayment(
    adminId: string,
    orderId: string,
    reason: string,
    lang?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order)
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'COMPLETED',
        status: 'CONFIRMED',
        auditTrail: {
          push: {
            action: 'FORCE_CONFIRM_PAYMENT',
            adminId,
            reason,
            timestamp: new Date(),
          },
        },
      },
    });
  }

  async refundOrder(orderId: string, adminId: string, lang?: string) {
    const claimResult = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        status: OrderStatus.RETURNED,
        refundStatus: { notIn: ['PROCESSING', 'COMPLETED'] },
      },
      data: {
        refundStatus: 'PROCESSING',
      },
    });

    if (claimResult.count === 0) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
      );
    }

    try {
      const isSuccess = true; // Mocked

      if (isSuccess) {
        await this.prisma.$transaction(async (tx) => {
          const updated = await tx.order.updateMany({
            where: { id: orderId, refundStatus: 'PROCESSING' },
            data: {
              status: OrderStatus.REFUNDED,
              refundStatus: 'COMPLETED',
            },
          });

          if (updated.count === 0) {
            await appendAuditTrail(tx, orderId, {
              action: 'REFUND_STATE_DESYNC',
              adminId,
              reason: 'Tiền đã được provider xử lý nhưng DB mất cờ PROCESSING',
            });
            console.error(`[CRITICAL] REFUND_STATE_DESYNC cho đơn ${orderId}`);
            return;
          }

          const items = await tx.orderItem.findMany({ where: { orderId } });
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        });
        return { success: true, message: 'Hoàn tiền thành công' }; // Admin msg, mostly ok to keep hardcoded or add to i18n
      }
    } catch (error) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { refundStatus: null },
      });
      throw new BadRequestException(
        'Hoàn tiền thất bại: ' + (error as Error).message,
      );
    }
  }

  async forceResetRefundStatus(
    orderId: string,
    adminId: string,
    reason: string,
    lang?: string,
  ) {
    if (!reason) {
      throw new BadRequestException(
        'Bắt buộc phải nhập lý do khi Gỡ kẹt hoàn tiền',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.refundStatus !== 'PROCESSING') {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { refundStatus: null },
      });

      await appendAuditTrail(tx, orderId, {
        action: 'FORCE_RESET_REFUND',
        adminId,
        reason,
      });
    });

    return { success: true, message: 'Đã gỡ kẹt cờ hoàn tiền' };
  }
}
