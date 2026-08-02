'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Product } from '@/types';
import ProductCardVN from './ProductCardVN';
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
  const displayedProducts = products.slice(0, 10);
  const totalProducts = products.length;

  return (
    <section className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-rule transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-rule">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
              {icon}
            </div>
          )}
          <h2 className="text-2xl font-bold font-display text-ink uppercase tracking-wide">
            {title}
          </h2>
        </div>
        <Link
          href={`/category/${categorySlug}`}
          className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-primary/5"
        >
          {t('view_all')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mb-6">
        {displayedProducts.map((product) => (
          <ProductCardVN key={product.id} product={product} />
        ))}
      </div>

      {totalProducts > 10 && (
        <div className="flex justify-center pt-4 border-t border-rule/50">
          <Link
            href={`/category/${categorySlug}`}
            className="group inline-flex items-center gap-2 px-8 py-3 bg-paper-2 hover:bg-primary hover:text-white text-ink font-semibold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md border border-rule hover:border-transparent"
          >
            <span>{t('show_all_products', { total: totalProducts })}</span>
            <ArrowRight className="w-4 h-4 text-ink-2 group-hover:text-white transition-transform group-hover:translate-x-1 duration-300" />
          </Link>
        </div>
      )}
    </section>
  );
}
