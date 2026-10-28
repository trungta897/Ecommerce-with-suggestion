import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../mail/mail.service';
import { ActivityType, type Order } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../database/prisma.service';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import { DEFAULT_LANG } from '../../common/constants/order.constant';

export interface OrderCreatedEventPayload {
  orderId: string;
  userId?: string;
  sessionId?: string;
  productIds: string[];
}

@Injectable()
export class OrdersEventsSubscriber {
  private readonly logger = new Logger(OrdersEventsSubscriber.name);

  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreatedEvent(payload: OrderCreatedEventPayload) {
    if (!payload.productIds || payload.productIds.length === 0) return;
    try {
      await this.prisma.userActivityLog.createMany({
        data: payload.productIds.map((productId) => ({
          userId: payload.userId,
          sessionId: payload.sessionId,
          productId,
          action: ActivityType.PURCHASE,
        })),
      });
    } catch (error) {
      this.logger.error(
        `Failed to log purchase activity for order ${payload.orderId}`,
        error,
      );
    }
  }

  @OnEvent('order.return.approved')
  async handleReturnApprovedEvent(order: Order) {
    this.logger.log(`Handling order.return.approved for order ${order.id}`);
    try {
      if (order.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: order.userId },
        });
        if (user && user.email) {
          await this.mailService.sendReturnApprovedEmail(user.email, order.id);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error sending return approved email for order ${order.id}`,
        error,
      );
    }
  }

  @OnEvent('order.return.rejected')
  async handleReturnRejectedEvent(order: Order) {
    this.logger.log(`Handling order.return.rejected for order ${order.id}`);
    try {
      if (order.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: order.userId },
        });
        if (user && user.email) {
          const fallbackReason = String(
            this.i18n.t(ORDER_MESSAGES.NO_REASON_PROVIDED, {
              lang: DEFAULT_LANG,
            }),
          );
          await this.mailService.sendReturnRejectedEmail(
            user.email,
            order.id,
            order.returnRejectReason || fallbackReason,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error sending return rejected email for order ${order.id}`,
        error,
      );
    }
  }
}
