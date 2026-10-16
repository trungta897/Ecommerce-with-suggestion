'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { BaseButton } from '@/components/base';
import { ChevronRight, Package } from '@/components/base/icons';
import { useAuthStore } from '@/store';
import { useCart } from '@/hooks/use-cart';
import { useProducts } from '@/hooks/use-products';
import Link from 'next/link';
import { useToast } from '@/providers/toast-provider';
import { orderService } from '@/services/order-service';
import { paymentService } from '@/services/payment-service';

import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation';
import { OrderSummarySidebar } from '@/components/checkout/OrderSummarySidebar';
import { CheckoutSuccess } from '@/components/checkout/CheckoutSuccess';

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
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

  // Form State
  const [shippingData, setShippingData] = useState({
    fullName: '',
    phone: '',
    address: '',
    pickupTime: '',
  });
  const [addressDetails, setAddressDetails] = useState<{
    provinceName: string;
    districtName: string;
    wardName: string;
    street: string;
    provinceId?: string;
    wardId?: string;
  }>({
    provinceName: '',
    districtName: '',
    wardName: '',
    street: '',
  });
  const [errors, setErrors] = useState<{
    fullName?: string;
    phone?: string;
    address?: string;
    pickupTime?: string;
  }>({});

  // Autofill
  useEffect(() => {
    if (isAuthenticated && user) {
      setShippingData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || user.address || '',
      }));
      // [PARTIAL] Chỉ điền field street. Province/Ward cần chọn lại tay.
      // Known Limitation: Profile chưa lưu provinceId/wardId có cấu trúc.
      if (user.address && !addressDetails.street) {
        setAddressDetails((prev) => ({
          ...prev,
          street: user.address || '',
        }));
      }
    }
  }, [isAuthenticated, user, addressDetails.street]);

  // Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    id: string;
    code: string;
    type: string;
  } | null>(null);

  const [useVipPoints, setUseVipPoints] = useState(false);

  const getProductPrice = (product?: { price: number; discountPrice?: number }) => {
    if (!product) return 0;
    if (product.discountPrice && Number(product.discountPrice) < Number(product.price)) {
      return Number(product.discountPrice);
    }
    return Number(product.price);
  };

  const cartProducts = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId) || item.product;
      return { ...item, product };
    })
    .filter((item) => item.product);

  const subtotal = cartProducts.reduce(
    (sum, item) => sum + getProductPrice(item.product) * item.quantity,
    0
  );

  const shippingFee = deliveryMethod === 'express' ? 40000 : 0;

  let vipDiscount = 0;
  if (useVipPoints && user && user.vipPoints) {
    vipDiscount = user.vipPoints * 10;
    if (vipDiscount > subtotal) vipDiscount = subtotal;
  }

  const total = Math.max(0, subtotal + shippingFee - discount - vipDiscount);

  const handleNextStep = () => {
    if (currentStep === 0) {
      const newErrors: {
        fullName?: string;
        phone?: string;
        address?: string;
        pickupTime?: string;
      } = {};
      let hasError = false;

      if (!shippingData.fullName.trim()) {
        newErrors.fullName = t('validation.fullNameRequired');
        toast.error(t('validation.fullNameRequired'), t('toast.orderErrorTitle'));
        hasError = true;
      } else if (!shippingData.phone.trim() || !/^[0-9]{9,11}$/.test(shippingData.phone.trim())) {
        newErrors.phone = t('validation.phoneInvalid');
        toast.error(t('validation.phoneInvalid'), t('toast.orderErrorTitle'));
        hasError = true;
      } else if (deliveryMethod !== 'pickup') {
        if (!addressDetails.provinceName) {
          newErrors.address = t('validation.provinceRequired');
          toast.error(t('validation.provinceRequired'), t('toast.orderErrorTitle'));
          hasError = true;
        } else if (!addressDetails.districtName) {
          newErrors.address = t('validation.districtRequired');
          toast.error(t('validation.districtRequired'), t('toast.orderErrorTitle'));
          hasError = true;
        } else if (!addressDetails.wardName) {
          newErrors.address = t('validation.wardRequired');
          toast.error(t('validation.wardRequired'), t('toast.orderErrorTitle'));
          hasError = true;
        } else if (!addressDetails.street) {
          newErrors.address = t('validation.streetRequired');
          toast.error(t('validation.streetRequired'), t('toast.orderErrorTitle'));
          hasError = true;
        }
      } else if (deliveryMethod === 'pickup') {
        if (!shippingData.pickupTime) {
          newErrors.pickupTime = t('validation.pickupTimeRequired');
          toast.error(t('validation.pickupTimeRequired'), t('toast.orderErrorTitle'));
          hasError = true;
        }
      }

      if (hasError) {
        setErrors(newErrors);
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
      const fullAddress =
        deliveryMethod === 'pickup'
          ? 'Nhận tại cửa hàng'
          : `${addressDetails.street}, ${addressDetails.wardName}, ${addressDetails.districtName}, ${addressDetails.provinceName}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = {
        shippingName: shippingData.fullName,
        shippingPhone: shippingData.phone,
        shippingAddress: fullAddress,
        deliveryMethod: deliveryMethod.toUpperCase(),
        paymentMethod: paymentMethod.toUpperCase(),
        voucherId: appliedVoucher ? appliedVoucher.id : undefined,
        pickupTime:
          deliveryMethod === 'pickup' && shippingData.pickupTime
            ? new Date(shippingData.pickupTime).toISOString()
            : undefined,
        provinceId: deliveryMethod !== 'pickup' ? addressDetails.provinceId : undefined,
        wardId: deliveryMethod !== 'pickup' ? addressDetails.wardId : undefined,
        useVipPoints: useVipPoints,
      };

      let order;
      if (isAuthenticated) {
        order = await orderService.createOrder(body);
      } else {
        body.items = cartProducts.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));
        order = await orderService.createGuestOrder(body);
      }

      if (!order) {
        throw new Error('Không thể tạo đơn hàng');
      }

      if (order.paymentMethod === 'COD') {
        toast.success(t('toast.orderSuccessMessage'), t('toast.orderSuccessTitle'));
        setOrderPlaced(true);
        clearCart();
      } else if (order.paymentMethod === 'VNPAY') {
        const { orderUrl } = await paymentService.createVnPayOrder(order.id, order.shippingPhone);
        window.location.href = orderUrl;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error(tCommon('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render: Early Returns ---

  if (orderPlaced) {
    return <CheckoutSuccess />;
  }

  const isPageLoading = isCartLoading || (items.length > 0 && isLoading);
  if (isPageLoading) {
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

  // --- Render: Main Checkout ---

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
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
        {/* Order Summary on Top */}
        <OrderSummarySidebar
          subtotal={subtotal}
          shippingFee={shippingFee}
          discount={discount}
          total={total}
          isDepositRequired={deliveryMethod !== 'pickup' && subtotal < 8}
        />

        {/* Form Area */}
        <div>
          {currentStep === 0 && !isAuthenticated && (
            <div className="bg-primary/5 border border-primary/20 text-primary p-4 rounded-xl mb-6 flex justify-between items-center shadow-sm">
              <span className="text-sm font-medium">
                Đăng nhập để tự động điền thông tin và tích điểm!
              </span>
              <Link
                href="/login?redirect=/checkout"
                className="text-sm font-bold underline hover:text-primary-dark transition-colors"
              >
                Đăng nhập ngay
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
                price: getProductPrice(i.product),
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
              getProductPrice={getProductPrice}
            />
          )}

          {/* Navigation Buttons */}
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
    </div>
  );
}
