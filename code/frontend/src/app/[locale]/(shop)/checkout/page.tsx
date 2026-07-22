'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { BaseButton, BaseInput } from '@/components/base';
import { CreditCard, Truck, CheckCircle2, ChevronRight, Package } from '@/components/base/icons';
import { useCartStore } from '@/store';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import Link from 'next/link';

const STEPS = ['step1', 'step2', 'step3'] as const;

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const { items, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'cod'>('cod');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [orderPlaced, setOrderPlaced] = useState(false);

  const cartProducts = items
    .map((item) => {
      const product = MOCK_PRODUCTS.find((p) => Number(p.id) === item.product_id);
      return { ...item, product };
    })
    .filter((item) => item.product);

  const subtotal = cartProducts.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );
  const shippingFee = deliveryMethod === 'express' ? 50000 : 30000;
  const total = subtotal + shippingFee;

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + '₫';

  const stepIcons = [Truck, CreditCard, CheckCircle2];

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
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

  if (cartProducts.length === 0) {
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
                  idx <= currentStep ? 'bg-primary text-white' : 'bg-paper-2 text-ink-2'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t(step)}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-0.5 mx-1 ${idx < currentStep ? 'bg-primary' : 'bg-rule'}`}
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
            <div className="bg-white border border-rule rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-ink mb-4">{t('shippingInfo')}</h2>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('fullName')}</label>
                <BaseInput placeholder={t('fullName')} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('phone')}</label>
                <BaseInput type="tel" placeholder="0900 000 000" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('address')}</label>
                <BaseInput placeholder={t('address')} />
              </div>
              <div className="space-y-2 pt-4">
                <label className="text-sm font-medium">{t('deliveryMethod')}</label>
                {['standard', 'express'].map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      deliveryMethod === method
                        ? 'border-primary bg-primary/5'
                        : 'border-rule hover:border-ink-2'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={method}
                      checked={deliveryMethod === method}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="accent-primary"
                    />
                    <span className="text-sm">{t(method as 'standard' | 'express')}</span>
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
            <div className="bg-white border border-rule rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-ink mb-4">{t('paymentMethod')}</h2>
              {(['vnpay', 'cod'] as const).map((method) => (
                <label
                  key={method}
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === method
                      ? 'border-primary bg-primary/5'
                      : 'border-rule hover:border-ink-2'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value as 'vnpay' | 'cod')}
                    className="accent-primary"
                  />
                  <CreditCard className="w-5 h-5 text-ink-2" />
                  <span className="text-sm font-medium">{t(method)}</span>
                </label>
              ))}

              {/* Voucher */}
              <div className="pt-4 space-y-2">
                <label className="text-sm font-medium">{t('voucher')}</label>
                <div className="flex gap-2">
                  <BaseInput placeholder={t('voucherPlaceholder')} className="flex-1" />
                  <BaseButton variant="outline">{t('applyVoucher')}</BaseButton>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {currentStep === 2 && (
            <div className="bg-white border border-rule rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-ink mb-4">{t('step3')}</h2>
              <div className="space-y-3">
                {cartProducts.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center gap-3 py-2 border-b border-rule last:border-0"
                  >
                    <div className="w-12 h-12 bg-paper-2 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{item.product?.name}</p>
                      <p className="text-xs text-ink-2">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-ink">
                      {formatPrice((item.product?.price || 0) * item.quantity)}
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
              <BaseButton onClick={() => setCurrentStep(currentStep + 1)}>{t('next')}</BaseButton>
            ) : (
              <BaseButton onClick={handlePlaceOrder}>{t('placeOrder')}</BaseButton>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:w-80">
          <div className="bg-white border border-rule rounded-xl p-6 sticky top-4">
            <h3 className="text-lg font-bold text-ink mb-4">{t('orderSummary')}</h3>
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
                <span className="font-semibold text-green-600">-{formatPrice(0)}</span>
              </div>
              <div className="border-t border-rule pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold">{t('total')}</span>
                  <span className="text-base font-bold text-primary">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
