'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Minus, Plus, Trash2, ChevronRight } from '@/components/base/icons';
import { BaseButton } from '@/components/base';
import { useCartStore } from '@/store';
import { MOCK_PRODUCTS } from '@/lib/mockData';

export default function CartPage() {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const { items, removeItem, updateQuantity } = useCartStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  // Map cart items to product data
  const cartProducts = items
    .map((item) => {
      const product = MOCK_PRODUCTS.find((p) => Number(p.id) === item.product_id);
      return { ...item, product };
    })
    .filter((item) => item.product);

  const subtotal = cartProducts.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);

  if (cartProducts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-paper-2 flex items-center justify-center">
          <ShoppingCart className="w-12 h-12 text-muted" />
        </div>
        <h2 className="text-2xl font-bold text-ink mb-2">{t('empty')}</h2>
        <p className="text-ink-2 mb-8">{t('emptyDesc')}</p>
        <Link href="/">
          <BaseButton size="lg">{t('continueShopping')}</BaseButton>
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
        <span className="text-ink font-medium">{t('title')}</span>
      </nav>

      <h1 className="text-2xl font-bold text-ink mb-8">
        {t('title')} ({cartProducts.length})
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {cartProducts.map((item) => (
            <div
              key={item.product_id}
              className="flex gap-4 p-4 bg-white border border-rule rounded-xl"
            >
              <div className="w-24 h-24 rounded-lg bg-paper-2 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                <Image
                  src={item.product?.thumbnailUrl || ''}
                  alt={item.product?.name || ''}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-ink truncate">{item.product?.name}</h3>
                <p className="text-sm text-ink-2 capitalize">{item.product?.brand}</p>
                <p className="text-lg font-bold text-primary mt-1">
                  {formatPrice(item.product?.price || 0)}
                </p>
              </div>

              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="p-1 text-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center border border-rule rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                    className="p-1.5 hover:bg-paper-2 transition-colors rounded-l-lg"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="p-1.5 hover:bg-paper-2 transition-colors rounded-r-lg"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:w-80">
          <div className="bg-white border border-rule rounded-xl p-6 sticky top-4">
            <h3 className="text-lg font-bold text-ink mb-4">
              {t('orderSummary') || t('subtotal')}
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-2">{t('subtotal')}</span>
                <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-2">{t('shipping')}</span>
                <span className="text-ink-2 text-xs">{t('shippingNote')}</span>
              </div>
              <div className="border-t border-rule pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-ink">{t('orderTotal')}</span>
                  <span className="text-base font-bold text-primary">{formatPrice(subtotal)}</span>
                </div>
              </div>
            </div>

            <Link href="/checkout" className="block mt-6">
              <BaseButton className="w-full" size="lg">
                {t('checkout')}
              </BaseButton>
            </Link>

            <Link href="/" className="block mt-3 text-center text-sm text-primary hover:underline">
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
