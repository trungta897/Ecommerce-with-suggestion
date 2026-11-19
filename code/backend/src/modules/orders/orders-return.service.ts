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
  PAYMENT_AUDIT_ACTIONS,
  RETURN_ELIGIBLE_DAYS,
  RETURN_MAX_EVIDENCE_FILES,
  RETURN_MAX_FILE_SIZE,
  RETURN_ALLOWED_MIME_TYPES,
} from '../../common/constants/order.constant';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import { I18nService } from 'nestjs-i18n';

const BYTES_PER_MB = 1024 * 1024;
const MS_PER_DAY = 86_400_000;

@Injectable()
export class OrdersReturnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService,
  ) {}

  private validateEvidenceFiles(
    files: Express.Multer.File[],
    existingCount: number,
    lang?: string,
  ): void {
    if (existingCount + files.length > RETURN_MAX_EVIDENCE_FILES) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.MAX_EVIDENCE_FILES, {
          lang,
          args: { max: RETURN_MAX_EVIDENCE_FILES },
        }),
      );
    }

    const maxMb = Math.round(RETURN_MAX_FILE_SIZE / BYTES_PER_MB);
    for (const file of files) {
      if (file.size > RETURN_MAX_FILE_SIZE) {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.MAX_EVIDENCE_FILE_SIZE, {
            lang,
            args: { maxMb },
          }),
        );
      }
      if (!RETURN_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.INVALID_FILE_FORMAT, { lang }),
        );
      }
    }
  }

  private async uploadEvidenceBuffers(
    orderId: string,
    files?: Express.Multer.File[],
  ): Promise<{ urls: string[]; uploadedCount: number; failedCount: number }> {
    const urls: string[] = [];
    let uploadedCount = 0;
    let failedCount = 0;

    if (!files || files.length === 0) {
      return { urls, uploadedCount, failedCount };
    }

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

    return { urls, uploadedCount, failedCount };
  }

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
        reason: this.i18n.t(ORDER_MESSAGES.MISSING_COMPLETED_AT, { lang }),
      };
    }

    const daysSince = Math.floor(
      (Date.now() - new Date(order.completedAt).getTime()) / MS_PER_DAY,
    );
    if (daysSince > RETURN_ELIGIBLE_DAYS) {
      return {
        eligible: false,
        reason: this.i18n.t(ORDER_MESSAGES.RETURN_WINDOW_EXPIRED, {
          lang,
          args: { days: RETURN_ELIGIBLE_DAYS },
        }),
      };
    }

    return {
      eligible: true,
      daysLeft: Math.max(0, RETURN_ELIGIBLE_DAYS - daysSince),
    };
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
      this.validateEvidenceFiles(files, 0, lang);
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

    const { urls, uploadedCount, failedCount } =
      await this.uploadEvidenceBuffers(orderId, files);

    if (urls.length > 0) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { returnEvidenceUrls: urls },
      });
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
    this.validateEvidenceFiles(files, existingUrls.length, lang);
    const { urls, uploadedCount } = await this.uploadEvidenceBuffers(
      orderId,
      files,
    );
    const newOrder =
      urls.length > 0
        ? await this.prisma.order.update({
            where: { id: orderId },
            data: { returnEvidenceUrls: [...existingUrls, ...urls] },
          })
        : order;

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
        data: { status: OrderStatus.RETURNED, returnResolvedAt: new Date() },
      });
      if (updated.count === 0) {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.INVALID_STATUS, { lang }),
        );
      }
      await appendAuditTrail(tx, orderId, {
        action: PAYMENT_AUDIT_ACTIONS.RETURN_APPROVED,
        adminId,
      });
    });
    this.eventEmitter.emit(
      'order.return.approved',
      await this.prisma.order.findUnique({ where: { id: orderId } }),
    );
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
        action: PAYMENT_AUDIT_ACTIONS.RETURN_REJECTED,
        adminId,
        reason: dto.rejectReason,
      });
    });
    this.eventEmitter.emit(
      'order.return.rejected',
      await this.prisma.order.findUnique({ where: { id: orderId } }),
    );
    return { success: true };
  }
}
