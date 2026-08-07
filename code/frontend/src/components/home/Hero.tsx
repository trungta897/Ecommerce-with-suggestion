import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Smartphone,
  Laptop,
  Monitor,
  CircuitBoard,
  Headphones,
  Camera,
  Tablet,
  Fan,
  Usb,
  Layers,
  HardDrive,
  Keyboard,
} from '@/components/base/icons';

export default function Hero() {
  const t = useTranslations('home.hero');
  const tCat = useTranslations('home.categories');

  const categories = [
    { label: tCat('dien-thoai'), icon: <Smartphone className="w-5 h-5" />, slug: 'dien-thoai' },
    { label: tCat('may-tinh-bang'), icon: <Tablet className="w-5 h-5" />, slug: 'may-tinh-bang' },
    { label: tCat('laptop'), icon: <Laptop className="w-5 h-5" />, slug: 'laptop' },
    {
      label: tCat('may-tinh-de-ban'),
      icon: <Monitor className="w-5 h-5" />,
      slug: 'may-tinh-de-ban',
    },
    { label: tCat('mainboard'), icon: <CircuitBoard className="w-5 h-5" />, slug: 'mainboard' },
    { label: tCat('cpu'), icon: <CircuitBoard className="w-5 h-5" />, slug: 'cpu' },
    { label: tCat('vga'), icon: <CircuitBoard className="w-5 h-5" />, slug: 'vga' },
    { label: tCat('ram'), icon: <Layers className="w-5 h-5" />, slug: 'ram' },
    { label: tCat('o-cung'), icon: <HardDrive className="w-5 h-5" />, slug: 'o-cung' },
    { label: tCat('tan-nhiet'), icon: <Fan className="w-5 h-5" />, slug: 'tan-nhiet' },
    { label: tCat('man-hinh'), icon: <Monitor className="w-5 h-5" />, slug: 'man-hinh' },
    { label: tCat('usb'), icon: <Usb className="w-5 h-5" />, slug: 'usb' },
    { label: tCat('cap-hub'), icon: <Keyboard className="w-5 h-5" />, slug: 'cap-hub' },
    {
      label: tCat('tai-nghe-am-thanh'),
      icon: <Headphones className="w-5 h-5" />,
      slug: 'tai-nghe-am-thanh',
    },
    { label: tCat('may-anh'), icon: <Camera className="w-5 h-5" />, slug: 'may-anh' },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 flex gap-4">
      {/* Left Sidebar (Categories) - Hidden on smaller screens */}
      <div className="hidden lg:flex w-64 bg-white border border-rule rounded-2xl flex-col py-3 shadow-sm shrink-0 justify-between">
        {categories.map((cat, idx) => (
          <Link
            key={idx}
            href={`/category/${cat.slug}`}
            className="flex items-center gap-3 px-4 py-1.5 hover:bg-paper-2 hover:text-primary transition-colors text-sm font-medium text-ink-2 group"
          >
            <div className="text-ink-2 group-hover:text-primary transition-colors">{cat.icon}</div>
            <span>{cat.label}</span>
          </Link>
        ))}
      </div>

      {/* Right Side (Banners) */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Main Banner Slider */}
        <div className="w-full h-64 md:h-80 relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-700 group cursor-pointer">
          <div className="absolute inset-0 z-10 p-8 flex flex-col justify-center">
            <h2 className="display-font text-4xl font-bold text-white mb-2 text-balance leading-tight max-w-md">
              {t('main_banner_title')}
            </h2>
            <p className="text-blue-200 text-base mb-6 max-w-sm">{t('main_banner_subtitle')}</p>
            <div>
              <span className="bg-white text-indigo-900 px-6 py-2.5 rounded-full font-bold hover:bg-blue-50 transition-colors shadow-lg">
                {t('main_banner_cta')}
              </span>
            </div>
          </div>
          {/* Decorative shapes */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute right-10 top-10 w-32 h-32 bg-blue-400 opacity-20 rounded-full blur-2xl"></div>
        </div>

        {/* Bottom Small Banners */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-24 md:h-32 relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 p-4 flex flex-col justify-end group cursor-pointer shadow-sm">
            <h3 className="text-white font-bold text-sm md:text-base leading-tight relative z-10">
              Mùa Tựu Trường
              <br />
              Giảm 10%
            </h3>
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </div>
          <div className="h-24 md:h-32 relative rounded-2xl overflow-hidden bg-gradient-to-br from-green-500 to-emerald-700 p-4 flex flex-col justify-end group cursor-pointer shadow-sm">
            <h3 className="text-white font-bold text-sm md:text-base leading-tight relative z-10">
              Xả Kho Linh Kiện
              <br />
              Lên đến 50%
            </h3>
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </div>
          <div className="h-24 md:h-32 relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-fuchsia-600 p-4 flex flex-col justify-end group cursor-pointer shadow-sm">
            <h3 className="text-white font-bold text-sm md:text-base leading-tight relative z-10">
              Tuần Lễ Apple
              <br />
              Giá Sốc
            </h3>
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </div>
          <div className="h-24 md:h-32 relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 p-4 flex flex-col justify-end group cursor-pointer shadow-sm">
            <h3 className="text-white font-bold text-sm md:text-base leading-tight relative z-10">
              Build PC
              <br />
              Tặng Màn Hình
            </h3>
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
