import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus } from '@prisma/client';
import { appendAuditTrail } from '../../common/utils/audit-trail.util';
import { RequestReturnDto } from './dto/request-return.dto';
import { RejectReturnDto } from './dto/reject-return.dto';
import { v4 as uuidv4 } from 'uuid';
import {
  RETURN_ELIGIBLE_DAYS,
  RETURN_MAX_EVIDENCE_FILES,
  RETURN_MAX_FILE_SIZE,
  RETURN_ALLOWED_MIME_TYPES,
} from '../../common/constants/order.constant';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class OrdersReturnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService,
  ) {}

  async checkReturnEligibility(userId: string, orderId: string, lang?: string) {
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
    if (order.status !== OrderStatus.COMPLETED) {
      return {
        eligible: false,
        reason: this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
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
    lang?: string,
  ) {
    const eligibility = await this.checkReturnEligibility(
      userId,
      orderId,
      lang,
    );
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
          throw new BadRequestException(
            this.i18n.t(ORDER_MESSAGES.INVALID_FILE_FORMAT, { lang }),
          );
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
        this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
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
    lang?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.userId !== userId) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.UNAUTHORIZED, { lang }),
      );
    }
    if (order.status !== OrderStatus.RETURN_REQUESTED) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
      );
    }

    if (!files || files.length === 0) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.MISSING_EVIDENCE, { lang }),
      );
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
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.INVALID_FILE_FORMAT, { lang }),
        );
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

  async approveReturn(orderId: string, adminId: string, lang?: string) {
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
          this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
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

  async rejectReturn(
    orderId: string,
    adminId: string,
    dto: RejectReturnDto,
    lang?: string,
  ) {
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
          this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
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
