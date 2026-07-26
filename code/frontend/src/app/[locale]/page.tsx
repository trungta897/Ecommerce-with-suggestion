'use client';

import HeroVN from '@/components/home/HeroVN';
import { FeaturesVN } from '@/components/home/FeaturesVN';
import { NewsletterVN } from '@/components/home/NewsletterVN';
import CategorySection from '@/components/product/CategorySection';
import { useProducts } from '@/hooks/use-products';
import { useTranslations } from 'next-intl';
import { Laptop, Cpu, Headphones, Monitor, Smartphone } from '@/components/base/icons';

export default function Home() {
  const t = useTranslations('home.categories');
  const { data: products = [], isLoading } = useProducts();

  // Sàng lọc sản phẩm 100% tự do theo từ khóa tech chuẩn xác từ CSDL thực
  const laptopProducts = products.filter((p) =>
    /laptop|macbook|chromebook|notebook|thinkpad|zenbook|ultrabook/i.test(
      p.name + ' ' + (p.description || '')
    )
  );

  const audioProducts = products.filter(
    (p) =>
      p.category?.slug === 'home-audio-theater' ||
      /headphone|headset|earbud|speaker|audio|mic|sound|airpods/i.test(
        p.name + ' ' + (p.description || '')
      )
  );

  const pcProducts = products.filter((p) =>
    /desktop|tower|workstation|monitor|display|raspberry pi|webcam|mini pc|optiplex|imac|server/i.test(
      p.name + ' ' + (p.description || '')
    )
  );

  const mobileProducts = products.filter(
    (p) =>
      ['cell-phones-accessories', 'apple-products'].includes(p.category?.slug || '') ||
      /phone|iphone|tablet|ipad|galaxy|android|smartphone/i.test(
        p.name + ' ' + (p.description || '')
      )
  );

  const componentProducts = products.filter((p) => {
    const isOtherGroup =
      laptopProducts.includes(p) ||
      audioProducts.includes(p) ||
      pcProducts.includes(p) ||
      mobileProducts.includes(p);
    if (!isOtherGroup) return true;
    return (
      ['all-electronics', 'electronics', 'industrial-scientific'].includes(
        p.category?.slug || ''
      ) ||
      /card|usb|ssd|hdd|drive|ram|motherboard|cpu|gpu|pcie|adapter|cable|hub|keyboard|mouse|router|cooler/i.test(
        p.name
      )
    );
  });

  const techSections = [
    {
      id: 'laptop-section',
      title: t('laptop'),
      slug: 'computers',
      icon: <Laptop className="w-6 h-6" />,
      products: laptopProducts,
    },
    {
      id: 'components-section',
      title: t('components'),
      slug: 'all-electronics',
      icon: <Cpu className="w-6 h-6" />,
      products: componentProducts,
    },
    {
      id: 'audio-section',
      title: t('audio'),
      slug: 'home-audio-theater',
      icon: <Headphones className="w-6 h-6" />,
      products: audioProducts,
    },
    {
      id: 'pc-section',
      title: t('desktop'),
      slug: 'computers',
      icon: <Monitor className="w-6 h-6" />,
      products: pcProducts,
    },
    {
      id: 'mobile-section',
      title: t('mobile'),
      slug: 'cell-phones-accessories',
      icon: <Smartphone className="w-6 h-6" />,
      products: mobileProducts,
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
