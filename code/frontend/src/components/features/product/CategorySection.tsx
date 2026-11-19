'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Product } from '@/types';
import ProductCard from './ProductCard';
import { ArrowRight } from '@/components/base/icons';

interface CategorySectionProps {
  title: string;
  categorySlug: string;
  products: Product[];
  icon?: React.ReactNode;
}

export default function CategorySection({
  title,
  categorySlug,
  products,
  icon,
}: CategorySectionProps) {
  const t = useTranslations('home.product');

  if (!products || products.length === 0) return null;

  return (
    <section className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-rule/80 transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-rule/80">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-xs">
              {icon}
            </div>
          )}
          <h2 className="text-xl sm:text-2xl font-bold font-display text-ink uppercase tracking-wide">
            {title}
          </h2>
        </div>

        {categorySlug && (
          <Link
            href={`/category/${categorySlug}`}
            className="text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/20"
          >
            <span>{t('view_all')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
