import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Order, OrderStatus, PaymentStatus } from '@prisma/client';
import { VnPayService } from './vnpay.service';
import { ReturnQueryFromVNPay } from 'vnpay';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { I18nService } from 'nestjs-i18n';
import { appendAuditTrail } from '../../common/utils/audit-trail.util';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import {
  PAYMENT_AUDIT_ACTIONS,
  REFUND_AUDIT_REASONS,
} from '../../common/constants/order.constant';
import {
  buildPayableWhere,
  isPayableNow,
} from '../orders/order-payment.policy';

const SUPERSEDED_TXN_REF_REGEX = /^[0-9a-fA-F]{32}\d+$/;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vnPayService: VnPayService,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService,
  ) {}

  async createVnPayOrderForUser(
    orderId: string,
    userId: string,
    ipAddr: string,
    lang: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException(
        this.i18n.t(ORDER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    return this.createPaymentLinkForOrder(order, ipAddr, lang);
  }

  async createVnPayOrderForGuest(
    orderId: string,
    phone: string | undefined,
    ipAddr: string,
    lang: string,
  ) {
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

    return this.createPaymentLinkForOrder(order, ipAddr, lang);
  }

  private async createPaymentLinkForOrder(
    order: Order,
    ipAddr: string,
    lang: string,
  ) {
    const now = new Date();
    if (!isPayableNow(order, now)) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.PAYMENT_WINDOW_CLOSED, { lang }),
      );
    }

    // Format: 32 hex chars (orderId without hyphens) + 13 digits (timestamp) = 45 alphanumeric chars
    const appTransId = `${order.id.replace(/-/g, '')}${Date.now()}`;

    const updated = await this.prisma.order.updateMany({
      where: buildPayableWhere(order.id, now),
      data: { paymentGatewayTxnId: appTransId },
    });

    if (updated.count === 0) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.PAYMENT_WINDOW_CLOSED, { lang }),
      );
    }

    const amountToPayVnd = Math.round(
      order.isDepositPayment
        ? Number(order.depositAmount)
        : Number(order.totalAmount),
    );

    const paymentUrl = this.vnPayService.createPaymentUrl(
      order.id,
      amountToPayVnd,
      ipAddr,
      appTransId,
    );

    return { orderUrl: paymentUrl };
  }

  private async resolveOrderFromTxnRef(txnRef: string): Promise<Order | null> {
    const byCurrentTxnId = await this.prisma.order.findFirst({
      where: { paymentGatewayTxnId: txnRef },
    });
    if (byCurrentTxnId) {
      return byCurrentTxnId;
    }

    if (!SUPERSEDED_TXN_REF_REGEX.test(txnRef)) {
      return null;
    }

    const rawHex = txnRef.slice(0, 32).toLowerCase();
    const orderId = `${rawHex.slice(0, 8)}-${rawHex.slice(8, 12)}-${rawHex.slice(12, 16)}-${rawHex.slice(16, 20)}-${rawHex.slice(20, 32)}`;

    return this.prisma.order.findUnique({
      where: { id: orderId },
    });
  }

  // 1. VNPay Webhook (4-Layer Protection + Superseded Session & Duplicate Payment Guard)
  async handleVnPayWebhook(query: ReturnQueryFromVNPay) {
    // Lớp 1: Verify Signature
    const verifyResult = this.vnPayService.verifyIpn(query);
    if (!verifyResult.isSuccess) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const appTransId: string = String(query.vnp_TxnRef);
    const vnp_Amount = Number(query.vnp_Amount) / 100; // VNPay amount is multiplied by 100

    const order = await this.resolveOrderFromTxnRef(appTransId);
    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // Lớp 2: Amount Match in VND
    const expectedAmountVnd = Math.round(
      order.isDepositPayment
        ? Number(order.depositAmount)
        : Number(order.totalAmount),
    );
    if (vnp_Amount !== expectedAmountVnd) {
      return { RspCode: '04', Message: 'Amount mismatch' };
    }

    // Nếu vnp_ResponseCode !== '00', khách hàng huỷ thanh toán hoặc thanh toán lỗi
    if (query.vnp_ResponseCode !== '00') {
      return { RspCode: '00', Message: 'Confirm Success' };
    }

    const transNo = String(query.vnp_TransactionNo);
    const payDate = String(query.vnp_PayDate);

    // Lớp 3: Idempotency cho cùng một giao dịch VNPay gọi lại IPN
    if (
      order.paymentGatewayTransNo &&
      order.paymentGatewayTransNo === transNo
    ) {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // Lớp 4: Atomic Update & Duplicate Payment Detection (cả B1 và B2)
    let emitPaid = false;
    let emitOrphaned = false;

    await this.prisma.$transaction(async (tx) => {
      const targetPaymentStatus = order.isDepositPayment
        ? PaymentStatus.PARTIALLY_PAID
        : PaymentStatus.COMPLETED;

      if (
        order.paymentStatus === PaymentStatus.PENDING &&
        order.status === OrderStatus.PENDING_PAYMENT
      ) {
        const updated = await tx.order.updateMany({
          where: {
            id: order.id,
            status: OrderStatus.PENDING_PAYMENT,
            paymentStatus: PaymentStatus.PENDING,
          },
          data: {
            paymentStatus: targetPaymentStatus,
            status: OrderStatus.PENDING,
            paymentGatewayTxnId: appTransId,
            paymentGatewayTransNo: transNo,
            paymentGatewayPayDate: payDate,
          },
        });

        if (updated.count > 0) {
          emitPaid = true;
          return;
        }
      } else if (
        order.paymentStatus === PaymentStatus.PENDING &&
        order.status === OrderStatus.CANCELLED
      ) {
        const updated = await tx.order.updateMany({
          where: {
            id: order.id,
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.PENDING,
          },
          data: {
            paymentStatus: targetPaymentStatus,
            isOrphanedPayment: true,
            paymentGatewayTxnId: appTransId,
            paymentGatewayTransNo: transNo,
            paymentGatewayPayDate: payDate,
          },
        });

        if (updated.count > 0) {
          emitOrphaned = true;
          return;
        }
      }

      // 4b: Đơn đã thu tiền từ một phiên VNPay khác (hoặc bị đổi trạng thái đồng thời)
      const latestOrder = await tx.order.findUnique({
        where: { id: order.id },
      });
      if (!latestOrder || latestOrder.paymentGatewayTransNo === transNo) {
        return;
      }

      await tx.order.update({
        where: { id: order.id },
        data: { isOrphanedPayment: true },
      });

      await appendAuditTrail(tx, order.id, {
        action: PAYMENT_AUDIT_ACTIONS.DUPLICATE_PAYMENT_SUPERSEDED_TXN,
        reason: REFUND_AUDIT_REASONS.DUPLICATE_SUPERSEDED_TXN,
        txnRef: appTransId,
        transactionNo: transNo,
        payDate,
      });

      emitOrphaned = true;
    });

    if (emitPaid) {
      this.eventEmitter.emit('order.paid', { orderId: order.id });
    }
    if (emitOrphaned) {
      this.eventEmitter.emit('payment.orphaned', { orderId: order.id });
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  // 3. Stripe Webhook (Mocked)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleStripeWebhook(_data: unknown) {
    return { received: true };
  }
}
