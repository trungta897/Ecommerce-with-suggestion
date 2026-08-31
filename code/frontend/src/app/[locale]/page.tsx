'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Hero from '@/components/home/Hero';
import FlashSaleSection from '@/components/home/FlashSaleSection';
import { Features } from '@/components/home/Features';
import { Newsletter } from '@/components/home/Newsletter';
import CategorySection from '@/components/features/product/CategorySection';
import { RecentlyViewedSlider } from '@/components/features/product/RecentlyViewedSlider';
import { RecommendedProducts } from '@/components/features/product/RecommendedProducts';
import { useHomeSections, useProducts } from '@/hooks/use-products';
import { Laptop, CircuitBoard, Layers, HardDrive, Monitor } from '@/components/base/icons';

const ICON_MAP: Record<string, React.ReactNode> = {
  laptop: <Laptop className="w-6 h-6" />,
  'man-hinh': <Monitor className="w-6 h-6" />,
  'may-tinh-de-ban': <Monitor className="w-6 h-6" />,
  'o-cung': <HardDrive className="w-6 h-6" />,
  vga: <CircuitBoard className="w-6 h-6" />,
  ram: <Layers className="w-6 h-6" />,
};

const HOME_CATEGORY_SLUGS = ['laptop', 'man-hinh', 'may-tinh-de-ban', 'o-cung', 'vga', 'ram'];

export default function Home() {
  const tHome = useTranslations('home');
  const tCat = useTranslations('home.categories');

  // Dedicated query to fetch 8 products for each category in parallel with caching
  const { data: homeSections, isLoading: isSectionsLoading } = useHomeSections(
    HOME_CATEGORY_SLUGS,
    8
  );

  // Flash sale products (optional)
  const { data: productsResponse } = useProducts({ limit: 12 });
  const onSale = (productsResponse?.data || [])
    .filter((p) => p.price > 50 && p.price < 300)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-8 pb-0 pt-6 bg-[#f4f6f8] min-h-screen">
      <Hero />

      {/* FLASH SALE SECTION */}
      {onSale.length > 0 && <FlashSaleSection products={onSale} />}

      {/* PROMO BANNERS */}
      <section className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/category/laptop"
            className="relative h-48 md:h-64 rounded-3xl overflow-hidden group cursor-pointer block shadow-sm hover:shadow-md transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-900 opacity-90 group-hover:scale-105 transition-transform duration-500"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-center">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 font-display">
                {tHome('promo_banners.laptop_title')}
              </h3>
              <p className="text-blue-100 mb-4 max-w-xs text-sm">
                {tHome('promo_banners.laptop_desc')}
              </p>
              <span className="px-4 py-2 bg-white text-blue-900 rounded-full text-sm font-bold w-fit shadow-sm">
                {tHome('promo_banners.laptop_cta')}
              </span>
            </div>
          </Link>
          <Link
            href="/category/vga"
            className="relative h-48 md:h-64 rounded-3xl overflow-hidden group cursor-pointer block shadow-sm hover:shadow-md transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-500 opacity-90 group-hover:scale-105 transition-transform duration-500"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-center">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 font-display">
                {tHome('promo_banners.vga_title')}
              </h3>
              <p className="text-red-100 mb-4 max-w-xs text-sm">
                {tHome('promo_banners.vga_desc')}
              </p>
              <span className="px-4 py-2 bg-white text-red-900 rounded-full text-sm font-bold w-fit shadow-sm">
                {tHome('promo_banners.vga_cta')}
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* RECOMMENDED PRODUCTS SECTION */}
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <RecommendedProducts />
      </div>

      {/* RECENTLY VIEWED SECTION */}
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <RecentlyViewedSlider />
      </div>

      <Features />

      {/* DYNAMIC PARALLEL-FETCHED HOME SECTIONS */}
      <section className="container mx-auto px-4 lg:px-8 max-w-7xl flex flex-col gap-8">
        {isSectionsLoading && (
          <div className="flex flex-col gap-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-white/70 rounded-3xl w-full border border-rule/50" />
            ))}
          </div>
        )}

        {!isSectionsLoading &&
          homeSections &&
          homeSections.map((section) => {
            if (!section.products || section.products.length === 0) return null;

            let localizedTitle = section.name;
            try {
              const tr = tCat(section.slug as Parameters<typeof tCat>[0]);
              if (tr && !tr.includes('.')) localizedTitle = tr;
            } catch {
              localizedTitle = section.name;
            }

            return (
              <CategorySection
                key={section.slug}
                title={localizedTitle}
                categorySlug={section.slug}
                products={section.products}
                icon={ICON_MAP[section.slug]}
              />
            );
          })}
      </section>

      <Newsletter />
    </div>
  );
}
