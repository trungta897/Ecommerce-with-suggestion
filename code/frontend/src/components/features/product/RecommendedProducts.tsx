'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Product } from '@/types';
import { getOrCreateSessionId } from '@/utils/session';
import ProductCard from '@/components/features/product/ProductCard';
import { Sparkles } from '@/components/base/icons';

import { activityService } from '@/services/activity-service';

interface RecommendedProductsProps {
  currentProductId?: string;
  limit?: number;
  className?: string;
}

export const RecommendedProducts: React.FC<RecommendedProductsProps> = ({
  currentProductId,
  limit = 8,
  className = '',
}) => {
  const t = useTranslations('home.sections');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchRecs() {
      if (typeof window === 'undefined') return;
      const sessionId = getOrCreateSessionId();

      setIsLoading(true);
      try {
        const data = await activityService.getRecommendations({
          sessionId: sessionId || undefined,
          productId: currentProductId,
          limit,
        });

        if (isMounted) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to fetch recommended products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchRecs();

    return () => {
      isMounted = false;
    };
  }, [currentProductId, limit]);

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className={`w-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
              {t('recommended_for_you_title')}
            </h2>
            <p className="text-xs sm:text-sm text-ink-2">{t('recommended_for_you_subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 bg-paper-2 rounded-2xl w-full border border-rule/60" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};
