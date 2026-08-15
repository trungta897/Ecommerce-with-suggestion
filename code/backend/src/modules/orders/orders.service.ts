import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentMethod, OrderStatus } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { appendAuditTrail } from '../../common/utils/audit-trail.util';
import { StorageService } from '../storage/storage.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RequestReturnDto } from './dto/request-return.dto';
import { RejectReturnDto } from './dto/reject-return.dto';
import {
  RETURN_ELIGIBLE_DAYS,
  RETURN_MAX_EVIDENCE_FILES,
  RETURN_MAX_FILE_SIZE,
  RETURN_ALLOWED_MIME_TYPES,
} from '../../common/constants/order.constant';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly storage: StorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    // 1. Get cart items
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    // 2. Calculate totals and check stock
    let subtotal = 0;
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm ${item.product.name} không đủ tồn kho (Còn: ${item.product.stock})`,
        );
      }
      // Assuming price is decimal, parsing it
      const price = item.product.discountPrice
        ? Number(item.product.discountPrice)
        : Number(item.product.price);
      subtotal += price * item.quantity;
    }

    const shippingFee = 0; // Simplified for now
    const discountAmount = 0; // Simplified for now
    const totalAmount = subtotal + shippingFee - discountAmount;

    // 3. Determine Payment Expiry
    let paymentExpiresAt: Date | null = null;
    if (createOrderDto.paymentMethod !== PaymentMethod.COD) {
      paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    }

    // 4. Atomic Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // a. Reduce stock first using condition
      for (const item of cartItems) {
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
            `Sản phẩm ${item.product.name} đã hết hàng trong quá trình thanh toán`,
          );
        }
      }

      // b. Create Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING_PAYMENT,
          subtotal,
          shippingFee,
          discountAmount,
          totalAmount,
          paymentMethod: createOrderDto.paymentMethod,
          paymentExpiresAt,
          shippingName: createOrderDto.shippingName,
          shippingAddress: createOrderDto.shippingAddress,
          shippingPhone: createOrderDto.shippingPhone,
          deliveryMethod: createOrderDto.deliveryMethod,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.discountPrice || item.product.price,
              subtotal:
                Number(item.product.discountPrice || item.product.price) *
                item.quantity,
            })),
          },
        },
      });

      // c. Clear Cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return newOrder;
    });

    // Handle Stripe specific logic (e.g., USD conversion) if needed
    if (order.paymentMethod === PaymentMethod.STRIPE) {
      // Typically we fetch USD rate from Redis here if required
      // e.g. const usdRate = await this.redisService.get('VND_USD_RATE');
    }

    return order;
  }

  async payAgain(userId: string, orderId: string) {
    // Luồng thanh toán lại xử lý Kịch bản A và Kịch bản B
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    if (order.userId !== userId) {
      throw new BadRequestException('Không có quyền truy cập');
    }

    if (order.status === OrderStatus.PENDING_PAYMENT) {
      // Kịch bản A: Đơn vẫn đang PENDING_PAYMENT, chưa hết hạn, tồn kho đang giữ
      // -> Chỉ cập nhật timeout mới
      const paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { paymentExpiresAt },
      });
      return updatedOrder;
    } else if (order.status === OrderStatus.CANCELLED) {
      // Kịch bản B: Đơn đã CANCELLED, tồn kho đã bị nhả ra
      // Cần atomic claim lại đơn và trừ lại kho
      const paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        // 1. Claim đơn hàng trước
        const claimResult = await tx.order.updateMany({
          where: { id: orderId, status: OrderStatus.CANCELLED },
          data: {
            status: OrderStatus.PENDING_PAYMENT,
            paymentExpiresAt,
          },
        });

        if (claimResult.count === 0) {
          throw new BadRequestException(
            'Không thể thanh toán lại đơn hàng này do trạng thái đã thay đổi',
          );
        }

        // 2. Trừ lại tồn kho
        const orderItems = await tx.orderItem.findMany({ where: { orderId } });
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

        return await tx.order.findUnique({ where: { id: orderId } });
      });

      return updatedOrder;
    } else {
      throw new BadRequestException(
        `Không thể thanh toán lại đơn hàng ở trạng thái ${order.status}`,
      );
    }
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return { data: orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAdminOrders(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;
    const whereCondition = status ? { status: status as OrderStatus } : {};
    
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: whereCondition,
        include: { user: { select: { id: true, name: true, email: true } }, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: whereCondition }),
    ]);

    return { data: orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateOrderStatus(orderId: string, status: string) {
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }
    
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as OrderStatus },
    });
    
    return updated;
  }

  async refundOrder(orderId: string, adminId: string) {
    // 1. Atomic Claim đơn hàng
    const claimResult = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        status: OrderStatus.RETURNED,
        refundStatus: { notIn: ['PROCESSING', 'COMPLETED'] }, // RefundStatus enum
      },
      data: {
        refundStatus: 'PROCESSING',
      },
    });

    if (claimResult.count === 0) {
      throw new BadRequestException(
        'Không thể bắt đầu hoàn tiền (đơn không hợp lệ hoặc đang xử lý)',
      );
    }

    try {
      // 2. Gọi API Hoàn tiền (ZaloPay, Stripe)
      // Ví dụ: await this.zaloPayService.refund(order);
      const isSuccess = true; // Mocked

      if (isSuccess) {
        // 3. Hoàn thành & Nhả tồn kho
        await this.prisma.$transaction(async (tx) => {
          const updated = await tx.order.updateMany({
            where: { id: orderId, refundStatus: 'PROCESSING' },
            data: {
              status: OrderStatus.REFUNDED,
              refundStatus: 'COMPLETED',
            },
          });

          if (updated.count === 0) {
            // REFUND_STATE_DESYNC: Tiền đã đi nhưng trạng thái đã bị đổi (VD: bị Cronjob dọn dẹp)
            await appendAuditTrail(tx, orderId, {
              action: 'REFUND_STATE_DESYNC',
              adminId,
              reason: 'Tiền đã được provider xử lý nhưng DB mất cờ PROCESSING',
            });
            // Log CRITICAL here
            console.error(`[CRITICAL] REFUND_STATE_DESYNC cho đơn ${orderId}`);
            return;
          }

          // Nhả tồn kho
          const items = await tx.orderItem.findMany({ where: { orderId } });
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        });
        return { success: true, message: 'Hoàn tiền thành công' };
      }
    } catch (error) {
      // 4. Rollback an toàn nếu API lỗi
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
        'Đơn hàng không bị kẹt ở trạng thái PROCESSING',
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

  async checkReturnEligibility(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    if (order.userId !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền thao tác trên đơn hàng này',
      );
    }
    if (order.status !== OrderStatus.COMPLETED) {
      return {
        eligible: false,
        reason: 'Chỉ có thể yêu cầu trả hàng với đơn đã hoàn thành',
      };
    }
    if (!order.completedAt) {
      return {
        eligible: false,
        reason: 'Đơn hàng thiếu thông tin thời điểm hoàn thành',
      };
    }

    const now = new Date().getTime();
    const completed = new Date(order.completedAt).getTime();
    const daysSince = Math.floor((now - completed) / 86400000);
    const eligible = daysSince <= RETURN_ELIGIBLE_DAYS;

    if (!eligible) {
      return {
        eligible: false,
        reason: 'Đã quá thời hạn 14 ngày để yêu cầu trả hàng',
      };
    }

    const daysLeft = Math.max(0, RETURN_ELIGIBLE_DAYS - daysSince);
    return { eligible: true, daysLeft };
  }

  async requestReturn(
    userId: string,
    orderId: string,
    dto: RequestReturnDto,
    files?: Express.Multer.File[],
  ) {
    const eligibility = await this.checkReturnEligibility(userId, orderId);
    if (!eligibility.eligible) {
      throw new BadRequestException(eligibility.reason);
    }

    if (files && files.length > 0) {
      if (files.length > RETURN_MAX_EVIDENCE_FILES) {
        throw new BadRequestException(
          `Tối đa ${RETURN_MAX_EVIDENCE_FILES} file chứng minh`,
        );
      }
      for (const file of files) {
        if (file.size > RETURN_MAX_FILE_SIZE) {
          throw new BadRequestException(
            'File chứng minh vượt quá dung lượng cho phép (10MB)',
          );
        }
        if (!RETURN_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          throw new BadRequestException('Định dạng file không hợp lệ');
        }
      }
    }

    const updated = await this.prisma.order.updateMany({
      where: { id: orderId, status: OrderStatus.COMPLETED, userId },
      data: {
        status: OrderStatus.RETURN_REQUESTED,
        returnReason: dto.returnReason,
        returnNote: dto.note,
        returnRequestedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException(
        'Không thể yêu cầu trả hàng, có thể trạng thái đơn hàng đã thay đổi',
      );
    }

    let uploadedCount = 0;
    let failedCount = 0;
    const urls: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const url = await this.storage.uploadFile(
            `returns/${orderId}`,
            uuidv4(),
            file.buffer,
          );
          urls.push(url);
          uploadedCount++;
        } catch {
          failedCount++;
        }
      }

      if (urls.length > 0) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { returnEvidenceUrls: urls },
        });
      }
    }

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    this.eventEmitter.emit('order.return.requested', updatedOrder);

    return { order: updatedOrder, uploadedCount, failedCount };
  }

  async supplementEvidence(
    userId: string,
    orderId: string,
    files: Express.Multer.File[],
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.userId !== userId) {
      throw new BadRequestException(
        'Không tìm thấy đơn hàng hoặc không có quyền thao tác',
      );
    }
    if (order.status !== OrderStatus.RETURN_REQUESTED) {
      throw new BadRequestException(
        'Đơn hàng không ở trạng thái yêu cầu trả hàng',
      );
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng cung cấp file chứng minh');
    }

    const existingUrls = (order.returnEvidenceUrls as string[]) || [];
    if (existingUrls.length + files.length > RETURN_MAX_EVIDENCE_FILES) {
      throw new BadRequestException(
        `Tổng số file chứng minh không được vượt quá ${RETURN_MAX_EVIDENCE_FILES}`,
      );
    }

    for (const file of files) {
      if (file.size > RETURN_MAX_FILE_SIZE) {
        throw new BadRequestException(
          'File chứng minh vượt quá dung lượng cho phép (10MB)',
        );
      }
      if (!RETURN_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException('Định dạng file không hợp lệ');
      }
    }

    let uploadedCount = 0;
    const urls: string[] = [];

    for (const file of files) {
      try {
        const url = await this.storage.uploadFile(
          `returns/${orderId}`,
          uuidv4(),
          file.buffer,
        );
        urls.push(url);
        uploadedCount++;
      } catch {
        // Skip
      }
    }

    let newOrder = order;
    if (urls.length > 0) {
      const newUrls = [...existingUrls, ...urls];
      newOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { returnEvidenceUrls: newUrls },
      });
    }

    return {
      order: newOrder,
      uploadedCount,
      totalCount: ((newOrder.returnEvidenceUrls as string[]) || []).length,
    };
  }

  async approveReturn(orderId: string, adminId: string) {
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: OrderStatus.RETURN_REQUESTED },
        data: {
          status: OrderStatus.RETURNED,
          returnResolvedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException(
          'Không thể duyệt trả hàng, đơn không ở trạng thái yêu cầu trả hàng',
        );
      }

      await appendAuditTrail(tx, orderId, {
        action: 'RETURN_APPROVED',
        adminId,
      });
    });

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    this.eventEmitter.emit('order.return.approved', updatedOrder);

    return { success: true };
  }

  async rejectReturn(orderId: string, adminId: string, dto: RejectReturnDto) {
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: OrderStatus.RETURN_REQUESTED },
        data: {
          status: OrderStatus.RETURN_REJECTED,
          returnRejectReason: dto.rejectReason,
          returnResolvedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException(
          'Không thể từ chối trả hàng, đơn không ở trạng thái yêu cầu trả hàng',
        );
      }

      await appendAuditTrail(tx, orderId, {
        action: 'RETURN_REJECTED',
        adminId,
        reason: dto.rejectReason,
      });
    });

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    this.eventEmitter.emit('order.return.rejected', updatedOrder);

    return { success: true };
  }
}
