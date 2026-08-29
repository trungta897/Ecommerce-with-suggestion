import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';

@Injectable()
export class OrdersShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async calculateShipping(
    deliveryMethod?: string,
    provinceId?: string,
    lang?: string,
  ): Promise<number> {
    if (deliveryMethod === 'PICKUP') return 0;
    if (!provinceId) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.SELECT_PROVINCE_REQUIRED, { lang }),
      );
    }

    const province = await this.prisma.province.findUnique({
      where: { id: provinceId },
    });
    if (!province) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.PROVINCE_NOT_FOUND, { lang }),
      );
    }

    if (province.id === '01') {
      return deliveryMethod === 'EXPRESS' ? 40000 : 15000;
    }

    if (province.region === 'NORTH') return 30000;
    if (province.region === 'CENTRAL') return 40000;
    if (province.region === 'SOUTH') return 50000;

    return 30000;
  }
}
