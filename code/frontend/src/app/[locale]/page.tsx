'use client';

import HeroVN from '@/components/home/HeroVN';
import FlashSaleSection from '@/components/home/FlashSaleSection';
import { FeaturesVN } from '@/components/home/FeaturesVN';
import { NewsletterVN } from '@/components/home/NewsletterVN';
import CategorySection from '@/components/features/product/CategorySection';
import { useProducts } from '@/hooks/use-products';
import { useTranslations } from 'next-intl';
import { classifyAllProducts } from '@/utils/classify-product';
import {
  Laptop,
  CircuitBoard,
  Layers,
  HardDrive,
  Monitor,
  TrendingUp,
} from '@/components/base/icons';

import Link from 'next/link';

export default function Home() {
  const tCat = useTranslations('home.categories');
  const tSec = useTranslations('home.sections');
  const { data: productsResponse, isLoading } = useProducts();
  const products = productsResponse?.data || [];

  const categoriesMap = classifyAllProducts(products);

  const bestSellers = [...products]
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, 10);

  const onSale = [...products].filter((p) => p.price > 50 && p.price < 300).slice(0, 10);

  const topSections = [
    {
      id: 'best-sellers-section',
      title: tSec('best_sellers_title'),
      slug: '',
      icon: <TrendingUp className="w-6 h-6 text-primary-500" />,
      products: bestSellers,
    },
  ];

  const prominentCategories = [
    {
      id: 'laptops-section',
      title: tCat('laptop'),
      slug: 'laptop',
      icon: <Laptop className="w-6 h-6" />,
      products: categoriesMap['laptop'] || [],
    },
    {
      id: 'monitors-section',
      title: tCat('man-hinh'),
      slug: 'man-hinh',
      icon: <Monitor className="w-6 h-6" />,
      products: categoriesMap['man-hinh'] || [],
    },
    {
      id: 'desktop-section',
      title: tCat('may-tinh-de-ban'),
      slug: 'may-tinh-de-ban',
      icon: <Monitor className="w-6 h-6" />,
      products: categoriesMap['may-tinh-de-ban'] || [],
    },
    {
      id: 'storage-section',
      title: tCat('o-cung'),
      slug: 'o-cung',
      icon: <HardDrive className="w-6 h-6" />,
      products: categoriesMap['o-cung'] || [],
    },
    {
      id: 'cpu-gpu-section',
      title: tCat('vga'),
      slug: 'vga',
      icon: <CircuitBoard className="w-6 h-6" />,
      products: categoriesMap['vga'] || [],
    },
    {
      id: 'ram-section',
      title: tCat('ram'),
      slug: 'ram',
      icon: <Layers className="w-6 h-6" />,
      products: categoriesMap['ram'] || [],
    },
  ];

  const allSections = [...topSections, ...prominentCategories];

  return (
    <div className="flex flex-col gap-6 pb-0 pt-6 bg-[#f4f6f8] min-h-screen">
      <HeroVN />

      {/* FLASH SALE SECTION */}
      {onSale.length > 0 && <FlashSaleSection products={onSale} />}

      {/* PROMO BANNERS */}
      <section className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/category/laptop"
            className="relative h-48 md:h-64 rounded-3xl overflow-hidden group cursor-pointer block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-900 opacity-90 group-hover:scale-105 transition-transform duration-500"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-center">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Tuần Lễ Laptop</h3>
              <p className="text-blue-100 mb-4 max-w-xs">
                Giảm thêm 5% cho Học sinh - Sinh viên. Săn ngay deal hot!
              </p>
              <span className="px-4 py-2 bg-white text-blue-900 rounded-full text-sm font-bold w-fit">
                Mua ngay
              </span>
            </div>
          </Link>
          <Link
            href="/category/vga"
            className="relative h-48 md:h-64 rounded-3xl overflow-hidden group cursor-pointer block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-500 opacity-90 group-hover:scale-105 transition-transform duration-500"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-center">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Xả Kho Linh Kiện</h3>
              <p className="text-red-100 mb-4 max-w-xs">
                Build PC giá sốc, tặng ngay màn hình Gaming 144Hz.
              </p>
              <span className="px-4 py-2 bg-white text-red-900 rounded-full text-sm font-bold w-fit">
                Khám phá
              </span>
            </div>
          </Link>
        </div>
      </section>

      <FeaturesVN />

      <section className="container mx-auto px-4 lg:px-8 max-w-7xl">
        {isLoading && (
          <div className="flex flex-col gap-8 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-paper-2 rounded-2xl w-full" />
            ))}
          </div>
        )}
        {!isLoading &&
          allSections.map((section) => {
            if (!section.products || section.products.length === 0) return null;
            return (
              <CategorySection
                key={section.id}
                title={section.title}
                categorySlug={section.slug}
                products={section.products}
                icon={section.icon}
              />
            );
          })}
      </section>

      <NewsletterVN />
    </div>
  );
}
