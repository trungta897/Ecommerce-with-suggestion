'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Heart } from '@/components/base/icons';
import { BaseButton } from '@/components/base';
import { useWishlist } from '@/hooks/use-wishlist';
import ProductCard from '@/components/features/product/ProductCard';

export function ProfileWishlistSection() {
  const t = useTranslations('profile');
  const { data: wishlistItems, isLoading: isWishlistLoading } = useWishlist();

  return (
    <div className="bg-white border border-rule rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-ink">{t('wishlist')}</h2>
        {wishlistItems && wishlistItems.length > 0 && (
          <span className="text-xs text-ink-2 bg-paper-2 px-2.5 py-1 rounded-full font-medium">
            {t('wishlistCount', { count: wishlistItems.length })}
          </span>
        )}
      </div>

      {isWishlistLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 bg-paper-2 rounded-2xl w-full border border-rule/60" />
          ))}
        </div>
      ) : !wishlistItems || wishlistItems.length === 0 ? (
        <div className="text-center py-12 text-ink-2">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-7 h-7" />
          </div>
          <p className="text-ink font-semibold text-base mb-1">{t('emptyWishlist')}</p>
          <p className="text-xs text-ink-2 max-w-sm mx-auto mb-5">{t('emptyWishlistDesc')}</p>
          <Link href="/">
            <BaseButton variant="outline" size="sm">
              {t('exploreProducts')}
            </BaseButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {wishlistItems.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
