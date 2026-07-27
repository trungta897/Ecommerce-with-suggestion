'use client';

import HeroVN from '@/components/home/HeroVN';
import { FeaturesVN } from '@/components/home/FeaturesVN';
import { NewsletterVN } from '@/components/home/NewsletterVN';
import CategorySection from '@/components/product/CategorySection';
import { useProducts } from '@/hooks/use-products';
import { useTranslations } from 'next-intl';
import { classifyAllProducts } from '@/utils/classify-product';
import {
  Laptop,
  Smartphone,
  Headphones,
  Keyboard,
  CircuitBoard,
  Layers,
  HardDrive,
  Power,
  Fan,
  Monitor,
  Wifi,
} from '@/components/base/icons';

export default function Home() {
  const t = useTranslations('home.categories');
  const { data: products = [], isLoading } = useProducts();

  // Pure Tag Matching: Phân loại 100% dựa trên Amazon tags (p.tags).
  // Logic tập trung tại src/utils/classify-product.ts — một nguồn sự thật duy nhất.
  const categoriesMap = classifyAllProducts(products);

  const techSections = [
    {
      id: 'laptops-section',
      title: t('laptops'),
      slug: 'laptops' as const,
      icon: <Laptop className="w-6 h-6" />,
      products: categoriesMap.laptops,
    },
    {
      id: 'peripherals-section',
      title: t('peripherals'),
      slug: 'peripherals' as const,
      icon: <Keyboard className="w-6 h-6" />,
      products: categoriesMap.peripherals,
    },
    {
      id: 'cpu-gpu-section',
      title: t('cpu-gpu-main'),
      slug: 'cpu-gpu-main' as const,
      icon: <CircuitBoard className="w-6 h-6" />,
      products: categoriesMap['cpu-gpu-main'],
    },
    {
      id: 'ram-section',
      title: t('ram-memory'),
      slug: 'ram-memory' as const,
      icon: <Layers className="w-6 h-6" />,
      products: categoriesMap['ram-memory'],
    },
    {
      id: 'storage-section',
      title: t('storage-drives'),
      slug: 'storage-drives' as const,
      icon: <HardDrive className="w-6 h-6" />,
      products: categoriesMap['storage-drives'],
    },
    {
      id: 'psu-section',
      title: t('power-supplies'),
      slug: 'power-supplies' as const,
      icon: <Power className="w-6 h-6" />,
      products: categoriesMap['power-supplies'],
    },
    {
      id: 'cooling-section',
      title: t('cooling-cases'),
      slug: 'cooling-cases' as const,
      icon: <Fan className="w-6 h-6" />,
      products: categoriesMap['cooling-cases'],
    },
    {
      id: 'desktop-pc-section',
      title: t('desktop-pc'),
      slug: 'desktop-pc' as const,
      icon: <Monitor className="w-6 h-6" />,
      products: categoriesMap['desktop-pc'],
    },
    {
      id: 'audio-section',
      title: t('audio'),
      slug: 'audio' as const,
      icon: <Headphones className="w-6 h-6" />,
      products: categoriesMap.audio,
    },
    {
      id: 'mobile-section',
      title: t('mobile-tablets'),
      slug: 'mobile-tablets' as const,
      icon: <Smartphone className="w-6 h-6" />,
      products: categoriesMap['mobile-tablets'],
    },
    {
      id: 'networking-section',
      title: t('networking-cables'),
      slug: 'networking-cables' as const,
      icon: <Wifi className="w-6 h-6" />,
      products: categoriesMap['networking-cables'],
    },
  ];

  return (
    <div className="flex flex-col gap-10 pb-20">
      <HeroVN />
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
          techSections.map((section) => {
            if (section.products.length === 0) return null;
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
