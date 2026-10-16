import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Product,
  OrderStatus,
  VoucherScope,
  Voucher,
  Prisma,
} from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ORDER_MESSAGES } from '../../common/constants/order-message.constant';
import { VOUCHER_MESSAGES } from '../../common/constants/voucher-message.constant';
import { PROMOTION_MESSAGES } from '../../common/constants/promotion-message.constant';

export interface CartItemWithProduct {
  productId: string;
  quantity: number;
  product: Product;
}

export interface ItemWithDiscount extends CartItemWithProduct {
  effectivePrice: number;
  productDiscountId: string | null;
}

export interface VoucherCalculationResult {
  discountAmount: number;
  appliedVoucherId: string | null;
  voucher: Voucher | null;
}

@Injectable()
export class OrdersCheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  // ==================== PRE-TRANSACTION (Read-only / Validation) ====================

  async resolveCartItems(
    userId: string | null,
    createOrderDto: CreateOrderDto,
    lang?: string,
  ): Promise<CartItemWithProduct[]> {
    let cartItems: CartItemWithProduct[] = [];

    if (userId) {
      const dbCartItems = await this.prisma.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });
      cartItems = dbCartItems;
    } else {
      // Guest Checkout - items must be in DTO
      if (!createOrderDto.items || createOrderDto.items.length === 0) {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.CART_EMPTY, { lang }),
        );
      }
      // Fetch product details for guest items in a single batch query
      const productIds = createOrderDto.items.map((i) => i.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of createOrderDto.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new BadRequestException(
            this.i18n.t(ORDER_MESSAGES.PRODUCT_NOT_FOUND_WITH_ID, {
              lang,
              args: { id: item.productId },
            }),
          );
        }
        cartItems.push({
          productId: item.productId,
          quantity: item.quantity,
          product,
        });
      }
    }

    if (cartItems.length === 0) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.CART_EMPTY, { lang }),
      );
    }

    // Guard: Prevent purchasing inactive/discontinued products
    for (const item of cartItems) {
      if (!item.product.isActive) {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.PRODUCT_INACTIVE, {
            lang,
            args: { name: item.product.name },
          }),
        );
      }
    }

    return cartItems;
  }

  async resolveFlashSaleDiscounts(
    cartItems: CartItemWithProduct[],
    lang?: string,
  ): Promise<ItemWithDiscount[]> {
    const now = new Date();
    const productIds = cartItems.map((item) => item.productId);

    // Batch query all active discounts for the products in cart
    const activeDiscounts = await this.prisma.productDiscount.findMany({
      where: {
        productId: { in: productIds },
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { startDate: 'asc' },
    });

    // Map each productId to its earliest active discount
    const discountMap = new Map<string, (typeof activeDiscounts)[0]>();
    for (const discount of activeDiscounts) {
      if (!discountMap.has(discount.productId)) {
        discountMap.set(discount.productId, discount);
      }
    }

    return cartItems.map((item) => {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          this.i18n.t(ORDER_MESSAGES.INSUFFICIENT_STOCK, {
            lang,
            args: {
              name: item.product.name,
              stock: item.product.stock,
            },
          }),
        );
      }

      const activeDiscount = discountMap.get(item.productId);

      let effectivePrice = item.product.discountPrice
        ? Number(item.product.discountPrice)
        : Number(item.product.price);
      let productDiscountId: string | null = null;

      if (activeDiscount) {
        const discountPriceNum = Number(activeDiscount.discountPrice);
        if (discountPriceNum < effectivePrice) {
          effectivePrice = discountPriceNum;
          productDiscountId = activeDiscount.id;
        }
      }

      return {
        ...item,
        effectivePrice,
        productDiscountId,
      };
    });
  }

  async validateAndCalculateVoucher(
    voucherId: string | undefined,
    itemsWithDiscount: ItemWithDiscount[],
    subtotal: number,
    shippingFee: number,
    lang?: string,
  ): Promise<VoucherCalculationResult> {
    if (!voucherId) {
      return { discountAmount: 0, appliedVoucherId: null, voucher: null };
    }

    const now = new Date();
    const voucher = await this.prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher || !voucher.isActive) {
      throw new BadRequestException(
        this.i18n.t(VOUCHER_MESSAGES.NOT_FOUND, { lang }),
      );
    }

    if (voucher.startDate && now < voucher.startDate) {
      throw new BadRequestException(
        this.i18n.t(VOUCHER_MESSAGES.NOT_STARTED, { lang }),
      );
    }
    if (voucher.endDate && now > voucher.endDate) {
      throw new BadRequestException(
        this.i18n.t(VOUCHER_MESSAGES.EXPIRED, { lang }),
      );
    }

    if (voucher.minOrderValue && subtotal < Number(voucher.minOrderValue)) {
      throw new BadRequestException(
        this.i18n.t(VOUCHER_MESSAGES.MIN_ORDER_NOT_MET, {
          lang,
          args: {
            min: Number(voucher.minOrderValue).toLocaleString('vi-VN'),
          },
        }),
      );
    }

    let eligibleSubtotal = subtotal;
    if (voucher.scope === VoucherScope.CATEGORY && voucher.categoryId) {
      const eligibleItems = itemsWithDiscount.filter(
        (item) => item.product.categoryId === voucher.categoryId,
      );
      if (eligibleItems.length === 0) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.CATEGORY_NOT_MATCHED, { lang }),
        );
      }

      // Anti-Stacking Rule: Chặn voucher PERCENTAGE trên sản phẩm đang Flash Sale
      if (voucher.type === 'PERCENTAGE') {
        const hasFlashSale = eligibleItems.some(
          (item) => item.productDiscountId !== null,
        );
        if (hasFlashSale) {
          throw new BadRequestException(
            this.i18n.t(VOUCHER_MESSAGES.FLASH_SALE_CONFLICT, { lang }),
          );
        }
      }

      eligibleSubtotal = eligibleItems.reduce(
        (sum, item) => sum + item.effectivePrice * item.quantity,
        0,
      );
    } else if (voucher.scope === VoucherScope.PRODUCT && voucher.productId) {
      const eligibleItems = itemsWithDiscount.filter(
        (item) => item.productId === voucher.productId,
      );
      if (eligibleItems.length === 0) {
        throw new BadRequestException(
          this.i18n.t(VOUCHER_MESSAGES.PRODUCT_NOT_MATCHED, { lang }),
        );
      }

      // Anti-Stacking Rule: Chặn voucher PERCENTAGE trên sản phẩm đang Flash Sale
      if (voucher.type === 'PERCENTAGE') {
        const hasFlashSale = eligibleItems.some(
          (item) => item.productDiscountId !== null,
        );
        if (hasFlashSale) {
          throw new BadRequestException(
            this.i18n.t(VOUCHER_MESSAGES.FLASH_SALE_CONFLICT, { lang }),
          );
        }
      }

      eligibleSubtotal = eligibleItems.reduce(
        (sum, item) => sum + item.effectivePrice * item.quantity,
        0,
      );
    }

    let discountAmount = 0;
    if (voucher.type === 'FREE_SHIPPING') {
      discountAmount = shippingFee;
    } else if (voucher.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(Number(voucher.value), eligibleSubtotal);
    } else if (voucher.type === 'PERCENTAGE') {
      discountAmount = Math.floor(
        (eligibleSubtotal * Number(voucher.value)) / 100,
      );
      if (voucher.maxDiscount && discountAmount > Number(voucher.maxDiscount)) {
        discountAmount = Number(voucher.maxDiscount);
      }
    }

    return {
      discountAmount,
      appliedVoucherId: voucher.id,
      voucher,
    };
  }

  validatePickupTime(pickupTimeInput?: Date | string | null, lang?: string) {
    if (!pickupTimeInput) return;
    const now = new Date();
    const pickupTime = new Date(pickupTimeInput);

    if (pickupTime < now) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_PICKUP_TIME_PAST, { lang }),
      );
    }
    const maxTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    if (pickupTime > maxTime) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_PICKUP_TIME_MAX, { lang }),
      );
    }
    const hour = pickupTime.getHours();
    if (hour < 8 || hour >= 22) {
      throw new BadRequestException(
        this.i18n.t(ORDER_MESSAGES.INVALID_PICKUP_TIME_HOURS, { lang }),
      );
    }
  }

  // ==================== TRANSACTION ATOMIC CLAIMS ====================

  async claimInventory(
    tx: Prisma.TransactionClient,
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
          this.i18n.t(ORDER_MESSAGES.FLASH_SALE_STOCK_RACE, {
            lang,
            args: { name: item.product.name },
          }),
        );
      }
    }
  }

  async claimFlashSaleQuota(
    tx: Prisma.TransactionClient,
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
            this.i18n.t(PROMOTION_MESSAGES.FLASH_SALE_INSUFFICIENT, { lang }),
          );
        }
      }
    }
  }

  async claimVipPoints(
    tx: Prisma.TransactionClient,
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
        this.i18n.t(ORDER_MESSAGES.INSUFFICIENT_VIP_POINTS, { lang }),
      );
    }
  }

  async claimVoucher(
    tx: Prisma.TransactionClient,
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
        this.i18n.t(VOUCHER_MESSAGES.SYSTEM_LIMIT_REACHED, { lang }),
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
        this.i18n.t(VOUCHER_MESSAGES.USER_LIMIT_REACHED, { lang }),
      );
    }
  }
}
