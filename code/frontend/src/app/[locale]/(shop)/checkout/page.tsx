'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BaseButton } from '@/components/base';
import { ChevronRight, Package } from '@/components/base/icons';
import { useCartStore } from '@/store';
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
  const { items, clearCart } = useCartStore();
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
  });
  const [addressDetails, setAddressDetails] = useState({
    provinceName: '',
    districtName: '',
    wardName: '',
    street: '',
  });
  const [errors, setErrors] = useState<{
    fullName?: string;
    phone?: string;
    address?: string;
  }>({});

  // Voucher State
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    id: string;
    code: string;
    type: string;
  } | null>(null);

  const getProductPrice = (product?: { price: number; discountPrice?: number }) => {
    if (!product) return 0;
    if (product.discountPrice && Number(product.discountPrice) < Number(product.price)) {
      return Number(product.discountPrice);
    }
    return Number(product.price);
  };

  const cartProducts = items
    .map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return { ...item, product };
    })
    .filter((item) => item.product);

  const subtotal = cartProducts.reduce(
    (sum, item) => sum + getProductPrice(item.product) * item.quantity,
    0
  );
  const shippingFee = deliveryMethod === 'express' ? 50000 : 30000;
  const total = Math.max(0, subtotal + shippingFee - discount);

  const handleNextStep = () => {
    if (currentStep === 0) {
      const newErrors: { fullName?: string; phone?: string; address?: string } = {};
      let hasError = false;

      if (!shippingData.fullName.trim()) {
        newErrors.fullName = t('validation.fullNameRequired');
        toast.error(t('validation.fullNameRequired'), t('toast.orderErrorTitle'));
        hasError = true;
      } else if (!shippingData.phone.trim() || !/^[0-9]{9,11}$/.test(shippingData.phone.trim())) {
        newErrors.phone = t('validation.phoneInvalid');
        toast.error(t('validation.phoneInvalid'), t('toast.orderErrorTitle'));
        hasError = true;
      } else if (!addressDetails.provinceName) {
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
      const fullAddress = `${addressDetails.street}, ${addressDetails.wardName}, ${addressDetails.districtName}, ${addressDetails.provinceName}`;
      const body = {
        shippingName: shippingData.fullName,
        shippingPhone: shippingData.phone,
        shippingAddress: fullAddress,
        deliveryMethod,
        paymentMethod: paymentMethod.toUpperCase(),
        voucherId: appliedVoucher ? appliedVoucher.id : undefined,
      };

      const order = await orderService.createOrder(body);

      if (order.payment_method === 'COD') {
        toast.success(t('toast.orderSuccessMessage'), t('toast.orderSuccessTitle'));
        setOrderPlaced(true);
        clearCart();
      } else if (order.payment_method === 'ZALOPAY') {
        const { orderUrl } = await paymentService.createZaloPayOrder(order.id);
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

  if (items.length > 0 && isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-8 bg-paper-2 rounded w-1/3 mb-8" />
        <div className="h-96 bg-paper-2 rounded-xl w-full" />
      </div>
    );
  }

  if (items.length === 0 || cartProducts.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Package className="w-12 h-12 mx-auto mb-4 text-muted" />
        <p className="text-ink-2 mb-4">{t('backToCart')}</p>
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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form Area */}
        <div className="flex-1">
          {currentStep === 0 && (
            <ShippingForm
              shippingData={shippingData}
              addressDetails={addressDetails}
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
              onPaymentMethodChange={setPaymentMethod}
              onVoucherCodeChange={setVoucherCode}
              onDiscountChange={setDiscount}
              onAppliedVoucherChange={setAppliedVoucher}
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

        {/* Order Summary Sidebar */}
        <OrderSummarySidebar
          subtotal={subtotal}
          shippingFee={shippingFee}
          discount={discount}
          total={total}
        />
      </div>
    </div>
  );
}
