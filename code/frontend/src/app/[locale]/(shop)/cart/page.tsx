'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { ShoppingCart, Minus, Plus, Trash2, ChevronRight } from '@/components/base/icons';
import { BaseButton, SafeImage } from '@/components/base';
import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/providers/toast-provider';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/utils/format';

export default function CartPage() {
  const locale = useLocale();
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const { items, removeItem, updateQuantity, isLoading: isCartLoading } = useCart();
  const toast = useToast();
  const { data: productsResponse, isLoading: isProductsLoading } = useProducts({ all: true });
  const products = productsResponse?.data || [];
  const isLoading = isCartLoading || isProductsLoading;

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
    toast.success(t('itemRemoved'));
  };

  const getProductPrice = (product?: { price: number; discountPrice?: number }) => {
    if (!product) return 0;
    if (product.discountPrice && Number(product.discountPrice) < Number(product.price)) {
      return Number(product.discountPrice);
    }
    return Number(product.price);
  };

  // Map cart items to product data
  const cartProducts = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId) || item.product;
      return { ...item, product };
    })
    .filter((item) => item.product);

  const subtotal = cartProducts.reduce((sum, item) => {
    return sum + getProductPrice(item.product) * item.quantity;
  }, 0);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-6 bg-paper-2 rounded w-1/4 mb-6" />
        <div className="h-8 bg-paper-2 rounded w-1/3 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-8 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-paper-2 rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-4 h-64 bg-paper-2 rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0 || cartProducts.length === 0) {
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Cart Items */}
        <div className="lg:col-span-8 space-y-4">
          {cartProducts.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 p-4 bg-white border border-rule rounded-xl"
            >
              <div className="w-24 h-24 rounded-lg bg-paper-2 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                <SafeImage
                  src={item.product?.thumbnailUrl || item.product?.images?.[0]?.url}
                  alt={item.product?.name || ''}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-ink truncate">{item.product?.name}</h3>
                <p className="text-sm text-ink-2 capitalize">{item.product?.brand}</p>
                <div className="hidden sm:block text-right mt-1">
                  <span className="font-semibold text-primary">
                    {formatPrice(getProductPrice(item.product), locale)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => handleRemoveItem(item.productId)}
                  className="p-1 text-muted hover:text-red-500 transition-colors"
                  aria-label={t('remove')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center border border-rule rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                    className="p-1.5 hover:bg-paper-2 transition-colors rounded-l-lg"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.productId,
                        Math.min(item.quantity + 1, item.product?.stock || Number.MAX_SAFE_INTEGER)
                      )
                    }
                    className="p-1.5 hover:bg-paper-2 transition-colors rounded-r-lg"
                    disabled={item.quantity >= (item.product?.stock || 0)}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-rule rounded-xl p-6 sticky top-4">
            <h3 className="text-lg font-bold text-ink mb-4">{t('orderSummary')}</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-ink-2">{t('subtotal')}</span>
                <span className="font-semibold text-ink">{formatPrice(subtotal, locale)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-2">{t('shipping')}</span>
                <span className="text-ink-2 text-xs">{t('shippingNote')}</span>
              </div>
              <div className="border-t border-rule pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-ink">{t('total')}</span>
                  <span className="text-base font-bold text-primary">
                    {formatPrice(subtotal, locale)}
                  </span>
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
