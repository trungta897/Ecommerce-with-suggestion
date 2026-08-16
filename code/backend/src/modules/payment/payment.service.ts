import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { appendAuditTrail } from '../../common/utils/audit-trail.util';
import { ZaloPayService } from './zalopay.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface ZaloPayCallbackData {
  app_trans_id: string;
  amount: number;
  zp_trans_id: number | string;
  server_time: number | string;
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zaloPayService: ZaloPayService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // 1. ZaloPay Webhook (4-Layer Protection)
  async handleZaloPayWebhook(body: {
    data: string;
    mac: string;
    type?: number;
  }) {
    // Lớp 1: Verify MAC
    const isValid = this.zaloPayService.verifyCallback(body.data, body.mac);
    if (!isValid) {
      return { return_code: -1, return_message: 'Invalid MAC' };
    }

    const callbackData = JSON.parse(body.data) as ZaloPayCallbackData;
    const appTransId: string = callbackData.app_trans_id;

    // Lấy đơn hàng theo Khớp Chính Xác
    const order = await this.prisma.order.findFirst({
      where: { paymentGatewayTxnId: appTransId },
    });

    if (!order) {
      return { return_code: -1, return_message: 'Order not found' };
    }

    // Lớp 2: Amount Match
    const expectedAmount = Number(order.totalAmount);
    if (callbackData.amount !== expectedAmount) {
      return { return_code: -1, return_message: 'Amount mismatch' };
    }

    // Lớp 3 & 4: Atomic Idempotency & Late IPN
    await this.prisma.$transaction(async (tx) => {
      if (order.status === OrderStatus.CANCELLED) {
        // Late IPN: Tiền về khi đơn đã timeout huỷ
        const updated = await tx.order.updateMany({
          where: { id: order.id, paymentStatus: PaymentStatus.PENDING },
          data: {
            paymentStatus: PaymentStatus.COMPLETED,
            isOrphanedPayment: true,
            paymentGatewayTransNo: String(callbackData.zp_trans_id),
            paymentGatewayPayDate: String(callbackData.server_time),
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
            paymentStatus: PaymentStatus.COMPLETED,
            status: OrderStatus.PENDING,
            paymentGatewayTransNo: String(callbackData.zp_trans_id),
            paymentGatewayPayDate: String(callbackData.server_time),
          },
        });

        if (updated.count > 0) {
          this.eventEmitter.emit('order.paid', { orderId: order.id });
        }
      }
      // Nếu updateMany.count === 0, tức là đã xử lý trước đó rồi (Idempotency)
    });

    return { return_code: 1, return_message: 'success' };
  }
  // 2. Stripe Webhook (Mocked)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleStripeWebhook(_data: unknown) {
    return { received: true };
  }

  // 3. Bank Transfer Webhook (Napas/VietQR - Mocked)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleBankTransferWebhook(_data: unknown) {
    return { success: true };
  }

  // 4. Admin Manual Confirmation (Double Safety Net)
  async manualConfirmPayment(
    adminId: string,
    orderId: string,
    amountReceived: number,
    isForceConfirm: boolean = false,
    reason?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Đơn hàng không ở trạng thái chờ thanh toán',
      );
    }

    const expectedAmount = Number(order.totalAmount);
    const MAX_TOLERANCE = 5000;
    const shortage = expectedAmount - amountReceived;
    const paymentDiscrepancy = shortage !== 0 ? -shortage : 0; // If shortage > 0, they paid less, discrepancy is negative. If shortage < 0, they paid more, discrepancy is positive.

    if (shortage > MAX_TOLERANCE && !isForceConfirm) {
      throw new BadRequestException(
        `Khách chuyển thiếu vượt ngưỡng (Thiếu: ${shortage}đ). Yêu cầu Force Confirm.`,
      );
    }

    if (isForceConfirm && !reason) {
      throw new BadRequestException(
        'Bắt buộc phải nhập lý do khi Force Confirm',
      );
    }

    // Atomic update status
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: OrderStatus.PENDING_PAYMENT },
        data: {
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.COMPLETED,
          paymentDiscrepancy,
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Trạng thái đơn hàng đã thay đổi');
      }

      // If Force Confirm, append Audit Trail via Raw SQL to avoid race conditions
      if (isForceConfirm) {
        await appendAuditTrail(tx, orderId, {
          action: 'FORCE_CONFIRM_PAYMENT',
          adminId,
          reason,
          shortage,
        });
      }
    });

    return { success: true, message: 'Xác nhận thanh toán thành công' };
  }
}
