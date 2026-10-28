'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useProductBySlug } from '@/hooks/use-products';
import { Star, Sparkles, ChevronRight } from '@/components/base/icons';
import { ProductReviews } from '@/components/features/product/ProductReviews';
import { ProductPurchasePanel } from '@/components/features/product/ProductPurchasePanel';
import { useCart } from '@/hooks/use-cart';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ProductImageCarousel } from '@/components/features/product/ProductImageCarousel';
import { useToast } from '@/providers/toast-provider';
import { formatPrice } from '@/utils/format';
import { useRecentlyViewedStore } from '@/store/useRecentlyViewedStore';
import { getOrCreateSessionId } from '@/utils/session';
import { activityService } from '@/services/activity-service';
import { RecentlyViewedSlider } from '@/components/features/product/RecentlyViewedSlider';
import { RecommendedProducts } from '@/components/features/product/RecommendedProducts';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const locale = useLocale();
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const { addItem } = useCart();
  const { addItem: addRecentlyViewed } = useRecentlyViewedStore();
  const toast = useToast();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  const { data: product, isLoading } = useProductBySlug(params.id);

  useEffect(() => {
    if (product && product.id) {
      addRecentlyViewed(product);
      const sessionId = getOrCreateSessionId();
      activityService
        .logActivity({
          action: 'VIEW',
          productId: product.id,
          sessionId,
        })
        .catch(() => {});
    }
  }, [product, addRecentlyViewed]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-6 bg-paper-2 rounded w-1/3 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-square bg-paper-2 rounded-xl" />
          <div className="space-y-6">
            <div className="h-10 bg-paper-2 rounded w-3/4" />
            <div className="h-6 bg-paper-2 rounded w-1/4" />
            <div className="h-12 bg-paper-2 rounded w-1/2" />
            <div className="h-32 bg-paper-2 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <p className="text-muted text-lg">{t('notFound')}</p>
        <Link href="/" className="text-primary hover:underline mt-4 inline-block">
          {tCommon('home')}
        </Link>
      </div>
    );
  }

  const hasDiscount = !!(
    product.discountPrice && Number(product.discountPrice) < Number(product.price)
  );
  const isOutOfStock = !product.stock || product.stock <= 0 || product.isActive === false;
  const currentPrice = hasDiscount ? Number(product.discountPrice) : Number(product.price);
  const originalPrice = hasDiscount ? Number(product.price) : undefined;
  const discountPercentage =
    hasDiscount && originalPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : undefined;

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    try {
      await addItem({
        id: `${Date.now()}`,
        userId: '',
        productId: product.id,
        quantity,
        product,
      });
      toast.success(t('addedToCartSuccess'), t('addedToCartTitle'), undefined, {
        label: tCommon('viewCart'),
        onClick: () => router.push('/cart'),
      });
    } catch {
      toast.error(t('addedToCartFailed'));
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    try {
      await addItem({
        id: `${Date.now()}`,
        userId: '',
        productId: product.id,
        quantity,
        product,
      });
      toast.success(t('redirectingToCheckout'), t('addedToCartTitle'));
      router.push('/checkout');
    } catch {
      toast.error(t('addedToCartFailed'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-ink-2 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          {tCommon('home')}
        </Link>
        <ChevronRight className="w-4 h-4" />
        {product.category ? (
          <>
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-primary transition-colors capitalize"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="w-4 h-4" />
          </>
        ) : null}
        <span className="text-ink font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <ProductImageCarousel
          thumbnailUrl={product.thumbnailUrl}
          images={product.images}
          altText={product.name}
        />

        <div className="space-y-6">
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-2xl lg:text-3xl font-bold text-ink">{product.name}</h1>

          {product.brand && (
            <p className="text-ink-2">
              {t('brand')}: <span className="font-semibold text-ink">{product.brand}</span>
            </p>
          )}

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(product.avgRating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm text-ink-2">
              ({product.reviewCount || 0} {t('reviews')})
            </span>
          </div>

          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(currentPrice, locale)}
            </span>
            {originalPrice && (
              <>
                <span className="text-lg text-muted line-through">
                  {formatPrice(originalPrice, locale)}
                </span>
                {discountPercentage && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-semibold rounded">
                    -{discountPercentage}%
                  </span>
                )}
              </>
            )}
          </div>

          {product.aiScore && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl">
              <h3 className="font-semibold text-purple-700 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4" />
                {t('aiMatch')}: {product.aiScore}%
              </h3>
              <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${product.aiScore}%` }}
                />
              </div>
            </div>
          )}

          <ProductPurchasePanel
            stock={product.stock}
            isOutOfStock={isOutOfStock}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        </div>
      </div>

      <div className="mt-12">
        <div className="flex border-b border-rule">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'description'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {t('description')}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'reviews'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {t('reviews')} ({product.reviewCount || 0})
          </button>
        </div>

        <div className="py-8">
          {activeTab === 'description' ? (
            <div className="prose max-w-none text-ink-2 leading-relaxed space-y-4">
              <p className="whitespace-pre-line">{product.description || product.name}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <ProductReviews productId={product.id} />
            </div>
          )}
        </div>
      </div>

      <RecommendedProducts currentProductId={product.id} className="mt-14" />
      <RecentlyViewedSlider excludeProductId={product.id} className="mt-12" />
    </div>
  );
}
