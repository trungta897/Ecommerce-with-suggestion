import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { VnPayService } from './vnpay.service';
import { ReturnQueryFromVNPay } from 'vnpay';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vnPayService: VnPayService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // 1. VNPay Webhook (4-Layer Protection)
  async handleVnPayWebhook(query: ReturnQueryFromVNPay) {
    // Lớp 1: Verify Signature
    const verifyResult = this.vnPayService.verifyIpn(query);
    if (!verifyResult.isSuccess) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const appTransId: string = String(query.vnp_TxnRef);
    const vnp_Amount = Number(query.vnp_Amount) / 100; // VNPay amount is multiplied by 100

    const order = await this.prisma.order.findFirst({
      where: { paymentGatewayTxnId: appTransId },
    });

    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // Lớp 2: Amount Match
    const expectedAmount = order.isDepositPayment
      ? Number(order.depositAmount)
      : Number(order.totalAmount);
    if (vnp_Amount !== expectedAmount) {
      return { RspCode: '04', Message: 'Amount mismatch' };
    }

    // Nếu vnp_ResponseCode !== '00', khách hàng huỷ thanh toán hoặc thanh toán lỗi
    if (query.vnp_ResponseCode !== '00') {
      return { RspCode: '00', Message: 'Confirm Success' };
    }

    // Lớp 3 & 4: Atomic Idempotency & Late IPN
    await this.prisma.$transaction(async (tx) => {
      if (order.status === OrderStatus.CANCELLED) {
        // Late IPN: Tiền về khi đơn đã timeout huỷ
        const updated = await tx.order.updateMany({
          where: { id: order.id, paymentStatus: PaymentStatus.PENDING },
          data: {
            paymentStatus: order.isDepositPayment
              ? PaymentStatus.PARTIALLY_PAID
              : PaymentStatus.COMPLETED,
            isOrphanedPayment: true,
            paymentGatewayTransNo: String(query.vnp_TransactionNo),
            paymentGatewayPayDate: String(query.vnp_PayDate),
          },
        });

        if (updated.count > 0) {
          this.eventEmitter.emit('payment.orphaned', { orderId: order.id });
        }
      } else if (order.status === OrderStatus.PENDING_PAYMENT) {
        // Normal success IPN
        const updated = await tx.order.updateMany({
          where: { id: order.id, paymentStatus: PaymentStatus.PENDING },
          data: {
            paymentStatus: order.isDepositPayment
              ? PaymentStatus.PARTIALLY_PAID
              : PaymentStatus.COMPLETED,
            status: OrderStatus.PENDING,
            paymentGatewayTransNo: String(query.vnp_TransactionNo),
            paymentGatewayPayDate: String(query.vnp_PayDate),
          },
        });

        if (updated.count > 0) {
          this.eventEmitter.emit('order.paid', { orderId: order.id });
        }
      }
    });

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  // 3. Stripe Webhook (Mocked)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleStripeWebhook(_data: unknown) {
    return { received: true };
  }
}
