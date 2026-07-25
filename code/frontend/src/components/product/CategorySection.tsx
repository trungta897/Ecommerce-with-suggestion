import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Product } from '@/lib/mockData';
import ProductCardVN from './ProductCardVN';

interface CategorySectionProps {
  title: string;
  categorySlug: string;
  products: Product[];
}

export default function CategorySection({ title, categorySlug, products }: CategorySectionProps) {
  const t = useTranslations('home.product');

  return (
    <section className="mb-12 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-rule">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-display text-ink uppercase">{title}</h2>
        <Link
          href={`/category/${categorySlug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t('view_all')} &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {products.map((product) => (
          <ProductCardVN key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
