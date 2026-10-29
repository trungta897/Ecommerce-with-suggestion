'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useProductsByCategory } from '@/hooks/use-products';
import ProductCard from '@/components/features/product/ProductCard';
import { ChevronRight, Package } from '@/components/base/icons';

interface RelatedCategoryProductsProps {
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  currentProductId: string;
  limit?: number;
  className?: string;
}

export const RelatedCategoryProducts: React.FC<RelatedCategoryProductsProps> = ({
  categorySlug,
  categoryName,
  currentProductId,
  limit = 8,
  className = '',
}) => {
  const t = useTranslations('product');
  const { data: response, isLoading } = useProductsByCategory(categorySlug || '', {
    limit: limit + 1,
  });

  if (!categorySlug) {
    return null;
  }

  const relatedProducts = (response?.data || [])
    .filter((item) => item.id !== currentProductId)
    .slice(0, limit);

  if (!isLoading && relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              {t('relatedCategoryTitle')}
            </h2>
            {categoryName && (
              <p className="text-xs sm:text-sm text-ink-2">
                {t('relatedCategorySubtitle', { category: categoryName })}
              </p>
            )}
          </div>
        </div>

        {categorySlug && (
          <Link
            href={`/category/${categorySlug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {t('viewMoreCategory')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 bg-paper-2 rounded-2xl w-full border border-rule/60" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {relatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};
