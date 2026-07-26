'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BaseButton, BaseInput } from '@/components/base';
import {
  CreditCard,
  Truck,
  CheckCircle2,
  ChevronRight,
  Package,
  MapPin,
  User,
  Phone,
} from '@/components/base/icons';
import { useCartStore } from '@/store';
import { useProducts } from '@/hooks/use-products';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/providers/toast-provider';
import { AddressSelector } from '@/components/features/address/AddressSelector';

const STEPS = ['step1', 'step2', 'step3'] as const;

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const toast = useToast();
  const { items, clearCart } = useCartStore();
  const { data: products = [], isLoading } = useProducts();
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'cod'>('cod');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [orderPlaced, setOrderPlaced] = useState(false);

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
  const [appliedVoucher, setAppliedVoucher] = useState(false);

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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const stepIcons = [Truck, CreditCard, CheckCircle2];

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) {
      toast.error(t('toast.voucherErrorMessage'), t('toast.voucherErrorTitle'));
      return;
    }
    const code = voucherCode.trim().toUpperCase();
    if (['DATN50', 'WELCOME', 'VIP100', 'FREE50K'].includes(code)) {
      const discountVal = code === 'VIP100' ? 100000 : 50000;
      setDiscount(discountVal);
      setAppliedVoucher(true);
      toast.success(t('toast.voucherSuccessMessage'), t('toast.voucherSuccessTitle'));
    } else {
      setDiscount(0);
      setAppliedVoucher(false);
      toast.error(t('toast.voucherErrorMessage'), t('toast.voucherErrorTitle'));
    }
  };

  const handleNextStep = () => {
    if (currentStep === 0) {
      const newErrors: {
        fullName?: string;
        phone?: string;
        address?: string;
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

  const handlePlaceOrder = () => {
    toast.success(t('toast.orderSuccessMessage'), t('toast.orderSuccessTitle'));
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center animate-in zoom-in duration-300">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-ink mb-2">{t('orderSuccess')}</h2>
        <p className="text-ink-2 mb-2">{t('orderSuccessDesc')}</p>
        <p className="text-lg font-bold text-primary mb-8">
          #ORD-{Date.now().toString().slice(-6)}
        </p>
        <Link href="/">
          <BaseButton size="lg">{tCommon('home')}</BaseButton>
        </Link>
      </div>
    );
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

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map((step, idx) => {
          const Icon = stepIcons[idx];
          return (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  idx <= currentStep ? 'bg-primary text-white shadow-md' : 'bg-paper-2 text-ink-2'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t(step)}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-0.5 mx-1 transition-colors ${
                    idx < currentStep ? 'bg-primary' : 'bg-rule'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form Area */}
        <div className="flex-1">
          {/* Step 1: Shipping Info */}
          {currentStep === 0 && (
            <div className="bg-white dark:bg-gray-800 border border-rule rounded-xl p-6 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-ink mb-4 border-b border-rule pb-3">
                {t('shippingInfo')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-ink">{t('fullName')} *</label>
                  <BaseInput
                    placeholder={t('fullName')}
                    value={shippingData.fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setShippingData((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }));
                      setErrors((prev) => ({ ...prev, fullName: undefined }));
                    }}
                    className={errors.fullName ? 'border-red-500' : ''}
                  />
                  {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-ink">{t('phone')} *</label>
                  <BaseInput
                    type="tel"
                    placeholder="0900 000 000"
                    value={shippingData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setShippingData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }));
                      setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>

                <div className="space-y-2 md:col-span-2 pt-2 border-t border-rule">
                  <label className="text-sm font-bold text-ink">{t('address')} *</label>
                  <AddressSelector
                    initialAddress={shippingData.address}
                    onAddressChange={(fullAddr, details) => {
                      setShippingData((prev) => ({
                        ...prev,
                        address: fullAddr,
                      }));
                      setAddressDetails(details);
                      setErrors((prev) => ({ ...prev, address: undefined }));
                    }}
                    error={errors.address}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-rule">
                <label className="text-sm font-bold text-ink">{t('deliveryMethod')}</label>
                {['standard', 'express'].map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      deliveryMethod === method
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 font-medium'
                        : 'border-rule hover:border-ink-2'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={method}
                      checked={deliveryMethod === method}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="accent-primary w-4 h-4"
                    />
                    <span className="text-sm text-ink">{t(method as 'standard' | 'express')}</span>
                    <span className="text-sm font-semibold text-primary ml-auto">
                      {formatPrice(method === 'express' ? 50000 : 30000)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-gray-800 border border-rule rounded-xl p-6 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-ink mb-4 border-b border-rule pb-3">
                {t('paymentMethod')}
              </h2>
              <div className="space-y-3">
                {(['vnpay', 'cod'] as const).map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === method
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 font-semibold text-primary'
                        : 'border-rule hover:border-ink-2 text-ink'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value as 'vnpay' | 'cod')}
                      className="accent-primary w-4 h-4"
                    />
                    <CreditCard className="w-5 h-5 text-ink-2 flex-shrink-0" />
                    <span className="text-sm">{t(method)}</span>
                  </label>
                ))}
              </div>

              {/* Voucher */}
              <div className="pt-4 border-t border-rule space-y-3">
                <label className="text-sm font-bold text-ink block">{t('voucher')}</label>
                <div className="flex gap-2.5">
                  <BaseInput
                    placeholder={t('voucherPlaceholder')}
                    value={voucherCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setVoucherCode(e.target.value)
                    }
                    className="flex-1 uppercase font-mono"
                  />
                  <BaseButton type="button" variant="outline" onClick={handleApplyVoucher}>
                    {t('applyVoucher')}
                  </BaseButton>
                </div>
                {appliedVoucher && (
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">
                    ✓ Đã áp dụng giảm {formatPrice(discount)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {currentStep === 2 && (
            <div className="bg-white dark:bg-gray-800 border border-rule rounded-xl p-6 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-ink mb-2 border-b border-rule pb-3">
                {t('step3')}
              </h2>

              {/* Summary Box of Recipient Info */}
              <div className="p-4 bg-indigo-50/60 dark:bg-gray-700/50 border border-indigo-100 dark:border-gray-600 rounded-xl space-y-2 text-xs text-ink-2">
                <h3 className="font-bold text-sm text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  {t('shippingInfo')}
                </h3>
                <div className="flex items-center gap-2 text-ink">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold">{shippingData.fullName}</span>
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{shippingData.phone}</span>
                </div>
                <div className="flex items-start gap-2 text-ink pt-1 border-t border-indigo-100 dark:border-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <span className="font-medium text-indigo-950 dark:text-indigo-200">
                    {shippingData.address}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-sm text-ink mb-2">{t('orderSummary')}</h3>
                {cartProducts.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center gap-3 py-2 border-b border-rule last:border-0"
                  >
                    <div className="w-12 h-12 bg-paper-2 rounded-lg flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                      <Image
                        src={item.product?.thumbnailUrl || ''}
                        alt={item.product?.name || ''}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{item.product?.name}</p>
                      <p className="text-xs text-ink-2">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-ink">
                      {formatPrice(getProductPrice(item.product) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
              <BaseButton onClick={handlePlaceOrder}>{t('placeOrder')}</BaseButton>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:w-80">
          <div className="bg-white dark:bg-gray-800 border border-rule rounded-xl p-6 sticky top-4 shadow-sm">
            <h3 className="text-lg font-bold text-ink mb-4 border-b border-rule pb-3">
              {t('orderSummary')}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-2">{t('subtotal')}</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-2">{t('shippingFee')}</span>
                <span className="font-semibold">{formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-2">{t('discount')}</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  -{formatPrice(discount)}
                </span>
              </div>
              <div className="border-t border-rule pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-ink">{t('total')}</span>
                  <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
