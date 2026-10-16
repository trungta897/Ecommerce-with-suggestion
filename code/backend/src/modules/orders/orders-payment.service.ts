import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, Order, RefundStatus } from '@prisma/client';
import { appendAuditTrail } from '../../common/utils/audit-trail.util';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import { I18nService } from 'nestjs-i18n';
import { VnPayService } from '../payment/vnpay.service';

@Injectable()
export class OrdersPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly vnPayService: VnPayService,
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
              this.i18n.t(ORDER_MESSAGES.INSUFFICIENT_STOCK_REPAY, { lang }),
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

  async refundOrder(orderId: string, adminId: string, lang?: string) {
    const claimResult = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        status: OrderStatus.RETURNED,
        refundStatus: {
          notIn: [RefundStatus.PROCESSING, RefundStatus.COMPLETED],
        },
      },
      data: {
        refundStatus: RefundStatus.PROCESSING,
      },
    });

    if (claimResult.count === 0) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
      );
    }

    try {
      let isSuccess = false;
      const orderToRefund = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (orderToRefund?.paymentMethod === 'VNPAY') {
        isSuccess = await this.vnPayService.refund(
          orderId,
          Number(orderToRefund.totalAmount),
          orderToRefund.paymentGatewayTxnId!,
          orderToRefund.paymentGatewayPayDate!,
          lang,
        );
      } else {
        isSuccess = true; // COD, STRIPE etc. mock or actual implementation
      }

      if (isSuccess) {
        await this.prisma.$transaction(async (tx) => {
          const updated = await tx.order.updateMany({
            where: { id: orderId, refundStatus: RefundStatus.PROCESSING },
            data: {
              status: OrderStatus.REFUNDED,
              refundStatus: RefundStatus.COMPLETED,
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
        return {
          success: true,
          message: this.i18n.t(ORDER_MESSAGES.REFUND_SUCCESS, { lang }),
        };
      }
    } catch (error) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { refundStatus: null },
      });
      const errorMsg = (error as Error).message;
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.REFUND_FAILED, {
          lang,
          args: { reason: errorMsg },
        }),
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
        this.i18n.t(ORDER_MESSAGES.REFUND_RESET_REASON_REQUIRED, { lang }),
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.refundStatus !== RefundStatus.PROCESSING) {
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

    return {
      success: true,
      message: this.i18n.t(ORDER_MESSAGES.REFUND_RESET_SUCCESS, { lang }),
    };
  }
}
