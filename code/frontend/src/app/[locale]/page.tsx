'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Hero from '@/components/home/Hero';
import FlashSaleSection from '@/components/home/FlashSaleSection';
import { Features } from '@/components/home/Features';
import { Newsletter } from '@/components/home/Newsletter';
import CategorySection from '@/components/features/product/CategorySection';
import { RecentlyViewedSlider } from '@/components/features/product/RecentlyViewedSlider';
import { RecommendedProducts } from '@/components/features/product/RecommendedProducts';
import { useHomeSections } from '@/hooks/use-products';
import {
  Laptop,
  CircuitBoard,
  Layers,
  HardDrive,
  Monitor,
  Clock,
  ArrowRight,
} from '@/components/base/icons';
import { HOME_CATEGORY_SLUGS, HOME_SECTION_PRODUCT_LIMIT, MID_PROMO_BANNERS } from '@/constants';

const ICON_MAP: Record<string, React.ReactNode> = {
  laptop: <Laptop className="w-6 h-6" />,
  'man-hinh': <Monitor className="w-6 h-6" />,
  'may-tinh-de-ban': <Monitor className="w-6 h-6" />,
  'o-cung': <HardDrive className="w-6 h-6" />,
  vga: <CircuitBoard className="w-6 h-6" />,
  ram: <Layers className="w-6 h-6" />,
};

export default function Home() {
  const tHome = useTranslations('home');
  const tCat = useTranslations('home.categories');

  const { data: homeSections, isLoading: isSectionsLoading } = useHomeSections(
    [...HOME_CATEGORY_SLUGS],
    HOME_SECTION_PRODUCT_LIMIT
  );

  return (
    <div className="flex flex-col gap-8 pb-0 pt-6 bg-[#f4f6f8] min-h-screen">
      <Hero />

      {/* RECENTLY VIEWED SECTION (COMPACT STEAM STYLE) */}
      <RecentlyViewedSlider className="container mx-auto px-4 lg:px-8 max-w-7xl" />

      {/* FLASH SALE SECTION */}
      <FlashSaleSection />

      {/* PROMO BANNERS WITH IMAGE, TIME & BADGE */}
      <section className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MID_PROMO_BANNERS.map((banner) => (
            <Link
              key={banner.id}
              href={banner.href}
              className="relative h-56 md:h-64 rounded-3xl overflow-hidden group cursor-pointer block shadow-sm hover:shadow-lg transition-all"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${banner.gradientClass} transition-transform duration-500`}
              />

              {/* Right Side Product Image */}
              <div className="absolute right-0 inset-y-0 w-1/2 opacity-45 group-hover:opacity-65 group-hover:scale-105 transition-all duration-500 pointer-events-none">
                <Image
                  src={banner.imageUrl}
                  alt={tHome(banner.titleKey as Parameters<typeof tHome>[0])}
                  fill
                  sizes="(max-width: 768px) 50vw, 350px"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent pointer-events-none" />

              {/* Left Content */}
              <div className="relative z-10 h-full p-6 md:p-8 flex flex-col justify-between max-w-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-white/95 text-ink text-xs font-bold shadow-xs">
                    {tHome(banner.badgeKey as Parameters<typeof tHome>[0])}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/35 text-white text-xs font-medium backdrop-blur-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    {tHome(banner.timeKey as Parameters<typeof tHome>[0])}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-1.5 font-display">
                    {tHome(banner.titleKey as Parameters<typeof tHome>[0])}
                  </h3>
                  <p className="text-white/90 mb-4 text-xs md:text-sm line-clamp-2">
                    {tHome(banner.descKey as Parameters<typeof tHome>[0])}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold w-fit shadow-sm transition-colors ${banner.ctaClass}`}
                  >
                    <span>{tHome(banner.ctaKey as Parameters<typeof tHome>[0])}</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* RECOMMENDED PRODUCTS SECTION */}
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <RecommendedProducts />
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
