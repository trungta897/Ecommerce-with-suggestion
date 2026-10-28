import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  OrderStatus,
  Order,
  RefundStatus,
  PaymentStatus,
} from '@prisma/client';
import { appendAuditTrail } from '../../common/utils/audit-trail.util';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import {
  PAYMENT_AUDIT_ACTIONS,
  PAYMENT_HOLD_MS,
  REFUND_AUDIT_REASONS,
} from '../../common/constants/order.constant';
import {
  buildReopenCancelledWhere,
  canReopenCancelledOrder,
  requiresOnlinePayment,
} from './order-payment.policy';
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

    if (!order || order.userId !== userId) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    return this.processPayAgain(order, lang);
  }

  async payAgainGuest(orderId: string, phone: string, lang?: string) {
    if (!phone) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== null || order.shippingPhone !== phone) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    return this.processPayAgain(order, lang);
  }

  private async processPayAgain(order: Order, lang?: string) {
    if (!requiresOnlinePayment(order)) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.REPAY_NOT_SUPPORTED, { lang }),
      );
    }

    if (order.status === OrderStatus.PENDING_PAYMENT) {
      if (order.paymentStatus !== PaymentStatus.PENDING) {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.REPAY_NOT_ALLOWED, { lang }),
        );
      }

      const paymentExpiresAt = new Date(Date.now() + PAYMENT_HOLD_MS);
      const updated = await this.prisma.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
        },
        data: { paymentExpiresAt },
      });

      if (updated.count === 0) {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.PAYMENT_JUST_EXPIRED, { lang }),
        );
      }

      return this.prisma.order.findUnique({ where: { id: order.id } });
    }

    if (order.status === OrderStatus.CANCELLED) {
      if (!canReopenCancelledOrder(order)) {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.REPAY_NOT_ALLOWED, { lang }),
        );
      }

      const paymentExpiresAt = new Date(Date.now() + PAYMENT_HOLD_MS);

      return this.prisma.$transaction(async (tx) => {
        const claimResult = await tx.order.updateMany({
          where: buildReopenCancelledWhere(order.id),
          data: {
            status: OrderStatus.PENDING_PAYMENT,
            paymentExpiresAt,
          },
        });

        if (claimResult.count === 0) {
          throw new BadRequestException(
            this.i18n.t(ORDER_MESSAGES.REPAY_NOT_ALLOWED, { lang }),
          );
        }

        const orderItems = await tx.orderItem.findMany({
          where: { orderId: order.id },
        });

        if (orderItems.some((item) => item.productDiscountId !== null)) {
          throw new BadRequestException(
            this.i18n.t(ORDER_MESSAGES.REPAY_NOT_ALLOWED, { lang }),
          );
        }

        for (const item of orderItems) {
          const updatedProduct = await tx.product.updateMany({
            where: {
              id: item.productId,
              isActive: true,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });

          if (updatedProduct.count === 0) {
            throw new BadRequestException(
              this.i18n.t(ORDER_MESSAGES.INSUFFICIENT_STOCK_REPAY, { lang }),
            );
          }
        }

        return tx.order.findUnique({ where: { id: order.id } });
      });
    }

    throw new BadRequestException(
      this.i18n.t(ORDER_MESSAGES.REPAY_NOT_ALLOWED, { lang }),
    );
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
      data: { refundStatus: RefundStatus.PROCESSING },
    });

    if (claimResult.count === 0) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
      );
    }

    try {
      const orderToRefund = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      const isSuccess =
        orderToRefund?.paymentMethod === 'VNPAY'
          ? await this.vnPayService.refund(
              orderId,
              Number(orderToRefund.totalAmount),
              orderToRefund.paymentGatewayTxnId!,
              orderToRefund.paymentGatewayPayDate!,
              lang,
            )
          : true;

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
              action: PAYMENT_AUDIT_ACTIONS.REFUND_STATE_DESYNC,
              adminId,
              reason: REFUND_AUDIT_REASONS.STATE_DESYNC,
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
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.REFUND_FAILED, {
          lang,
          args: { reason: (error as Error).message },
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
        action: PAYMENT_AUDIT_ACTIONS.FORCE_RESET_REFUND,
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
