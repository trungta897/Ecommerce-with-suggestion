import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { appendAuditTrail } from '../../common/utils/audit-trail.util';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. ZaloPay Webhook (Mocked for architecture demo)
  async handleZaloPayWebhook(_data: any) {
    // Layer 1: Verify MAC (Mocked)
    // Layer 2: Amount Match
    // Layer 3: Idempotency (check if paymentStatus is already COMPLETED)
    // Layer 4: Late IPN (Orphaned Payment)
    return { return_code: 1, return_message: 'success' };
  }

  // 2. Stripe Webhook (Mocked)
  async handleStripeWebhook(_data: any) {
    return { received: true };
  }

  // 3. Bank Transfer Webhook (Napas/VietQR - Mocked)
  async handleBankTransferWebhook(_data: any) {
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
