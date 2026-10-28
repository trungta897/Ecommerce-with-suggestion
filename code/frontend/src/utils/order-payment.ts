import {
  CreateOrderItemPayload,
  CreateOrderPayload,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/types/order';

export function getProductEffectivePrice(product?: {
  price: number;
  discountPrice?: number;
}): number {
  if (!product) return 0;
  if (product.discountPrice && Number(product.discountPrice) < Number(product.price)) {
    return Number(product.discountPrice);
  }
  return Number(product.price);
}

export function requiresOnlinePayment(
  order: Pick<Order, 'paymentMethod' | 'isDepositPayment'>
): boolean {
  const method = String(order.paymentMethod || '').toUpperCase();
  return method === PaymentMethod.VNPAY || Boolean(order.isDepositPayment);
}

export function canRepayOrder(order: Order): boolean {
  if (!requiresOnlinePayment(order)) {
    return false;
  }

  const statusUpper = String(order.status || '').toUpperCase();
  const paymentStatusUpper = String(order.paymentStatus || '').toUpperCase();

  if (statusUpper === OrderStatus.PENDING_PAYMENT) {
    return paymentStatusUpper === PaymentStatus.PENDING;
  }

  if (statusUpper === OrderStatus.CANCELLED) {
    const hasReturnedPromotions =
      Boolean(order.voucherId) ||
      Number(order.vipDiscountAmount || 0) > 0 ||
      Boolean(order.items?.some((item) => item.productDiscountId));

    return (
      Boolean(order.paymentExpiresAt) &&
      paymentStatusUpper === PaymentStatus.PENDING &&
      !hasReturnedPromotions
    );
  }

  return false;
}

export interface ShippingStepInput {
  fullName: string;
  phone: string;
  pickupTime: string;
  deliveryMethod: string;
  provinceName: string;
  districtName: string;
  wardName: string;
  street: string;
}

export interface ShippingStepErrors {
  fullName?: string;
  phone?: string;
  address?: string;
  pickupTime?: string;
}

export interface AddressDetailsState {
  provinceName: string;
  districtName: string;
  wardName: string;
  street: string;
  provinceId?: string;
  wardId?: string;
}

export function validateCheckoutShippingStep(
  input: ShippingStepInput,
  t: (key: string) => string
): { errors: ShippingStepErrors; firstErrorMessage?: string } {
  const errors: ShippingStepErrors = {};

  if (!input.fullName.trim()) {
    const msg = t('validation.fullNameRequired');
    errors.fullName = msg;
    return { errors, firstErrorMessage: msg };
  }

  if (!input.phone.trim() || !/^[0-9]{9,11}$/.test(input.phone.trim())) {
    const msg = t('validation.phoneInvalid');
    errors.phone = msg;
    return { errors, firstErrorMessage: msg };
  }

  if (input.deliveryMethod !== 'pickup') {
    if (!input.provinceName) {
      const msg = t('validation.provinceRequired');
      errors.address = msg;
      return { errors, firstErrorMessage: msg };
    }
    if (!input.districtName) {
      const msg = t('validation.districtRequired');
      errors.address = msg;
      return { errors, firstErrorMessage: msg };
    }
    if (!input.wardName) {
      const msg = t('validation.wardRequired');
      errors.address = msg;
      return { errors, firstErrorMessage: msg };
    }
    if (!input.street) {
      const msg = t('validation.streetRequired');
      errors.address = msg;
      return { errors, firstErrorMessage: msg };
    }
  } else if (!input.pickupTime) {
    const msg = t('validation.pickupTimeRequired');
    errors.pickupTime = msg;
    return { errors, firstErrorMessage: msg };
  }

  return { errors };
}

export function buildCheckoutOrderPayload(params: {
  shippingName: string;
  shippingPhone: string;
  deliveryMethod: string;
  paymentMethod: string;
  pickupTime: string;
  pickupAtStoreLabel: string;
  street: string;
  wardName: string;
  districtName: string;
  provinceName: string;
  provinceId?: string;
  wardId?: string;
  voucherId?: string;
  useVipPoints: boolean;
  isAuthenticated: boolean;
  guestItems: CreateOrderItemPayload[];
}): CreateOrderPayload {
  const isPickup = params.deliveryMethod === 'pickup';
  const fullAddress = isPickup
    ? params.pickupAtStoreLabel
    : `${params.street}, ${params.wardName}, ${params.districtName}, ${params.provinceName}`;

  return {
    shippingName: params.shippingName,
    shippingPhone: params.shippingPhone,
    shippingAddress: fullAddress,
    deliveryMethod: params.deliveryMethod.toUpperCase(),
    paymentMethod: params.paymentMethod.toUpperCase(),
    voucherId: params.voucherId,
    pickupTime:
      isPickup && params.pickupTime ? new Date(params.pickupTime).toISOString() : undefined,
    provinceId: !isPickup ? params.provinceId : undefined,
    wardId: !isPickup ? params.wardId : undefined,
    useVipPoints: params.useVipPoints,
    ...(params.isAuthenticated ? {} : { items: params.guestItems }),
  };
}
