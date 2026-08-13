import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../mail/mail.service';
import { Order } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrdersEventsSubscriber {
  private readonly logger = new Logger(OrdersEventsSubscriber.name);

  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('order.return.approved')
  async handleReturnApprovedEvent(order: Order) {
    this.logger.log(`Handling order.return.approved for order ${order.id}`);
    try {
      const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
      if (user && user.email) {
        await this.mailService.sendReturnApprovedEmail(user.email, order.id);
      }
    } catch (error) {
      this.logger.error(`Error sending return approved email for order ${order.id}`, error);
    }
  }

  @OnEvent('order.return.rejected')
  async handleReturnRejectedEvent(order: Order) {
    this.logger.log(`Handling order.return.rejected for order ${order.id}`);
    try {
      const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
      if (user && user.email) {
        await this.mailService.sendReturnRejectedEmail(user.email, order.id, order.returnRejectReason);
      }
    } catch (error) {
      this.logger.error(`Error sending return rejected email for order ${order.id}`, error);
    }
  }
}
