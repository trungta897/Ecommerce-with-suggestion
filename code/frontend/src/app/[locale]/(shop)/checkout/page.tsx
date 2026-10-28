'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BaseButton } from '@/components/base';
import { ChevronRight, Package } from '@/components/base/icons';
import { useAuthStore } from '@/store';
import { useCart } from '@/hooks/use-cart';
import { useProducts } from '@/hooks/use-products';
import Link from 'next/link';
import { useToast } from '@/providers/toast-provider';
import { orderService } from '@/services/order-service';
import { paymentService } from '@/services/payment-service';
import { DEPOSIT_THRESHOLD_VND } from '@/constants/order';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import {
  AddressDetailsState,
  buildCheckoutOrderPayload,
  getProductEffectivePrice,
  requiresOnlinePayment,
  ShippingStepErrors,
  validateCheckoutShippingStep,
} from '@/utils/order-payment';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation';
import { OrderSummarySidebar } from '@/components/checkout/OrderSummarySidebar';
import { CheckoutSuccess } from '@/components/checkout/CheckoutSuccess';

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const { items, clearCart, isLoading: isCartLoading } = useCart();
  const { data: productsResponse, isLoading } = useProducts({ all: true });
  const products = productsResponse?.data || [];
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'cod'>('cod');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shippingData, setShippingData] = useState({
    fullName: '',
    phone: '',
    address: '',
    pickupTime: '',
  });
  const [addressDetails, setAddressDetails] = useState<AddressDetailsState>({
    provinceName: '',
    districtName: '',
    wardName: '',
    street: '',
  });
  const [errors, setErrors] = useState<ShippingStepErrors>({});

  useEffect(() => {
    if (isAuthenticated && user) {
      setShippingData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || user.address || '',
      }));
      if (user.address && !addressDetails.street) {
        setAddressDetails((prev) => ({ ...prev, street: user.address || '' }));
      }
    }
  }, [isAuthenticated, user, addressDetails.street]);

  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    id: string;
    code: string;
    type: string;
  } | null>(null);
  const [useVipPoints, setUseVipPoints] = useState(false);

  const cartProducts = items
    .map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.productId) || item.product,
    }))
    .filter((item) => item.product);

  const subtotal = cartProducts.reduce(
    (sum, item) => sum + getProductEffectivePrice(item.product) * item.quantity,
    0
  );
  const shippingFee = deliveryMethod === 'express' ? 40000 : 0;
  const vipDiscount = useVipPoints && user?.vipPoints ? Math.min(subtotal, user.vipPoints * 10) : 0;
  const total = Math.max(0, subtotal + shippingFee - discount - vipDiscount);

  const handleNextStep = () => {
    if (currentStep === 0) {
      const { errors: stepErrors, firstErrorMessage } = validateCheckoutShippingStep(
        { ...shippingData, deliveryMethod, ...addressDetails },
        (key) => t(key as Parameters<typeof t>[0])
      );
      if (firstErrorMessage) {
        setErrors(stepErrors);
        toast.error(firstErrorMessage, t('toast.orderErrorTitle'));
        return;
      }
      setErrors({});
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const body = buildCheckoutOrderPayload({
        shippingName: shippingData.fullName,
        shippingPhone: shippingData.phone,
        deliveryMethod,
        paymentMethod,
        pickupTime: shippingData.pickupTime,
        pickupAtStoreLabel: t('pickupAtStoreAddress'),
        ...addressDetails,
        voucherId: appliedVoucher?.id,
        useVipPoints,
        isAuthenticated,
        guestItems: cartProducts.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      const order = isAuthenticated
        ? await orderService.createOrder(body)
        : await orderService.createGuestOrder(body);

      if (!order) {
        throw new Error(t('createOrderFailed'));
      }

      if (requiresOnlinePayment(order)) {
        try {
          const { orderUrl } = isAuthenticated
            ? await paymentService.createVnPayOrder(order.id)
            : await paymentService.createGuestVnPayOrder(order.id, order.shippingPhone);
          window.location.href = orderUrl;
          return;
        } catch {
          clearCart();
          toast.error(t('orderCreatedPaymentLinkFailed'), t('toast.orderErrorTitle'));
          const detailPath = isAuthenticated
            ? `/orders/${order.id}`
            : `/orders/guest/${order.id}?phone=${encodeURIComponent(order.shippingPhone)}`;
          router.push(detailPath);
          return;
        }
      }

      toast.success(t('toast.orderSuccessMessage'), t('toast.orderSuccessTitle'));
      setOrderPlaced(true);
      clearCart();
    } catch (error: unknown) {
      console.error('Checkout failed:', error);
      toast.error(getApiErrorMessage(error) ?? tCommon('error'), t('toast.orderErrorTitle'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) return <CheckoutSuccess />;

  if (isCartLoading || (items.length > 0 && isLoading)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-8 bg-paper-2 rounded w-1/3 mb-8" />
        <div className="h-96 bg-paper-2 rounded-xl w-full" />
      </div>
    );
  }

  if (!isCartLoading && (items.length === 0 || cartProducts.length === 0)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Package className="w-12 h-12 mx-auto mb-4 text-muted" />
        <p className="text-ink-2 mb-4">{t('emptyCart')}</p>
        <Link href="/cart">
          <BaseButton>{t('backToCart')}</BaseButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-ink-2 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          {tCommon('home')}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/cart" className="hover:text-primary transition-colors">
          {t('backToCart')}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-ink font-medium">{t('title')}</span>
      </nav>

      <h1 className="text-2xl font-bold text-ink mb-8">{t('title')}</h1>
      <CheckoutSteps currentStep={currentStep} />

      <div className="w-full">
        <OrderSummarySidebar
          subtotal={subtotal}
          shippingFee={shippingFee}
          discount={discount}
          total={total}
          isDepositRequired={subtotal < DEPOSIT_THRESHOLD_VND}
        />

        {currentStep === 0 && !isAuthenticated && (
          <div className="bg-primary/5 border border-primary/20 text-primary p-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
            <span className="text-sm font-medium">{t('loginPromptBanner')}</span>
            <Link
              href="/login?redirect=/checkout"
              className="text-sm font-bold underline hover:text-primary-dark transition-colors"
            >
              {t('loginNow')}
            </Link>
          </div>
        )}

        {currentStep === 0 && (
          <ShippingForm
            shippingData={shippingData}
            deliveryMethod={deliveryMethod}
            errors={errors}
            onShippingDataChange={setShippingData}
            onAddressDetailsChange={setAddressDetails}
            onDeliveryMethodChange={setDeliveryMethod}
            onErrorsChange={setErrors}
          />
        )}

        {currentStep === 1 && (
          <PaymentForm
            paymentMethod={paymentMethod}
            voucherCode={voucherCode}
            discount={discount}
            appliedVoucher={appliedVoucher}
            subtotal={subtotal}
            phone={shippingData.phone || ''}
            cartItems={cartProducts.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              price: getProductEffectivePrice(i.product),
              categoryId: i.product?.categoryId,
            }))}
            onPaymentMethodChange={setPaymentMethod}
            onVoucherCodeChange={setVoucherCode}
            onDiscountChange={setDiscount}
            onAppliedVoucherChange={setAppliedVoucher}
            useVipPoints={useVipPoints}
            onUseVipPointsChange={setUseVipPoints}
          />
        )}

        {currentStep === 2 && (
          <OrderConfirmation
            shippingData={shippingData}
            cartProducts={cartProducts}
            getProductPrice={getProductEffectivePrice}
          />
        )}

        <div className="flex justify-between mt-6">
          <BaseButton
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            {t('previous')}
          </BaseButton>
          {currentStep < 2 ? (
            <BaseButton onClick={handleNextStep}>{t('next')}</BaseButton>
          ) : (
            <BaseButton onClick={handlePlaceOrder} disabled={isSubmitting}>
              {isSubmitting ? tCommon('loading') : t('placeOrder')}
            </BaseButton>
          )}
        </div>
      </div>
    </div>
  );
}
