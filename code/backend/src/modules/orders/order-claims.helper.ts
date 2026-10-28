import { BadRequestException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import { PROMOTION_MESSAGES } from '../../common/constants/promotion-message.constant';
import { VOUCHER_MESSAGES } from '../../common/constants/voucher-message.constant';
import type { ItemWithDiscount } from './orders-checkout.service';

export async function claimInventoryTx(
  tx: Prisma.TransactionClient,
  i18n: I18nService,
  items: ItemWithDiscount[],
  lang?: string,
): Promise<void> {
  for (const item of items) {
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
        i18n.t(ORDER_MESSAGES.FLASH_SALE_STOCK_RACE, {
          lang,
          args: { name: item.product.name },
        }),
      );
    }
  }
}

export async function claimFlashSaleQuotaTx(
  tx: Prisma.TransactionClient,
  i18n: I18nService,
  items: ItemWithDiscount[],
  now: Date,
  lang?: string,
): Promise<void> {
  for (const item of items) {
    if (item.productDiscountId) {
      const claimedDiscount = await tx.$executeRaw`
        UPDATE product_discounts
        SET flashSaleSold = flashSaleSold + ${item.quantity}
        WHERE id = ${item.productDiscountId}
          AND isActive = true
          AND startDate <= ${now}
          AND endDate >= ${now}
          AND flashSaleSold + ${item.quantity} <= flashSaleQty
      `;

      if (claimedDiscount === 0) {
        throw new BadRequestException(
          i18n.t(PROMOTION_MESSAGES.FLASH_SALE_INSUFFICIENT, { lang }),
        );
      }
    }
  }
}

export async function claimVipPointsTx(
  tx: Prisma.TransactionClient,
  i18n: I18nService,
  userId: string,
  usedVipPoints: number,
  lang?: string,
): Promise<void> {
  const updatedUser = await tx.user.updateMany({
    where: {
      id: userId,
      vipPoints: { gte: usedVipPoints },
    },
    data: {
      vipPoints: { decrement: usedVipPoints },
    },
  });
  if (updatedUser.count === 0) {
    throw new BadRequestException(
      i18n.t(ORDER_MESSAGES.INSUFFICIENT_VIP_POINTS, { lang }),
    );
  }
}

export async function claimVoucherTx(
  tx: Prisma.TransactionClient,
  i18n: I18nService,
  voucherId: string,
  userId: string | null,
  shippingPhone?: string,
  perUserLimit: number = 1,
  lang?: string,
): Promise<void> {
  const claimed = await tx.$executeRaw`
    UPDATE vouchers
    SET usedCount = usedCount + 1
    WHERE id = ${voucherId}
      AND isActive = true
      AND startDate <= NOW()
      AND endDate >= NOW()
      AND (usageLimit IS NULL OR usedCount + 1 <= usageLimit)
  `;

  if (claimed === 0) {
    throw new BadRequestException(
      i18n.t(VOUCHER_MESSAGES.SYSTEM_LIMIT_REACHED, { lang }),
    );
  }

  const nonCancelledStatuses = {
    notIn: [
      OrderStatus.CANCELLED,
      OrderStatus.RETURN_REJECTED,
      OrderStatus.RETURNED,
      OrderStatus.REFUNDED,
    ],
  };

  let usedCountForUser = 0;
  if (userId) {
    usedCountForUser = await tx.userVoucherUsage.count({
      where: {
        voucherId,
        userId,
        order: { status: nonCancelledStatuses },
      },
    });
  } else if (shippingPhone) {
    usedCountForUser = await tx.userVoucherUsage.count({
      where: {
        voucherId,
        order: {
          shippingPhone,
          status: nonCancelledStatuses,
        },
      },
    });
  }

  if (usedCountForUser >= perUserLimit) {
    throw new BadRequestException(
      i18n.t(VOUCHER_MESSAGES.USER_LIMIT_REACHED, { lang }),
    );
  }
}
