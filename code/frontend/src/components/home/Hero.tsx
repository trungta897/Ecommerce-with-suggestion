'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
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
  Clock,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from '@/components/base/icons';
import {
  HERO_CATEGORY_ITEMS,
  HERO_SLIDES,
  HERO_SMALL_BANNERS,
  HERO_AUTOPLAY_INTERVAL_MS,
  HeroCategoryIconKey,
} from '@/constants';

const CATEGORY_ICON_MAP: Record<HeroCategoryIconKey, React.ReactNode> = {
  smartphone: <Smartphone className="w-5 h-5" />,
  tablet: <Tablet className="w-5 h-5" />,
  laptop: <Laptop className="w-5 h-5" />,
  desktop: <Monitor className="w-5 h-5" />,
  mainboard: <CircuitBoard className="w-5 h-5" />,
  cpu: <CircuitBoard className="w-5 h-5" />,
  vga: <CircuitBoard className="w-5 h-5" />,
  ram: <Layers className="w-5 h-5" />,
  storage: <HardDrive className="w-5 h-5" />,
  cooling: <Fan className="w-5 h-5" />,
  monitor: <Monitor className="w-5 h-5" />,
  usb: <Usb className="w-5 h-5" />,
  cable: <Keyboard className="w-5 h-5" />,
  audio: <Headphones className="w-5 h-5" />,
  camera: <Camera className="w-5 h-5" />,
};

export default function Hero() {
  const t = useTranslations('home.hero');
  const tCat = useTranslations('home.categories');
  const [activeSlide, setActiveSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, HERO_AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const currentSlide = HERO_SLIDES[activeSlide];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 flex gap-4">
      {/* Left Sidebar (Categories) - Hidden on smaller screens */}
      <div className="hidden lg:flex w-64 bg-white border border-rule rounded-2xl flex-col py-3 shadow-sm shrink-0 justify-between">
        {HERO_CATEGORY_ITEMS.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="flex items-center gap-3 px-4 py-1.5 hover:bg-paper-2 hover:text-primary transition-colors text-sm font-medium text-ink-2 group"
          >
            <div className="text-ink-2 group-hover:text-primary transition-colors">
              {CATEGORY_ICON_MAP[cat.iconKey]}
            </div>
            <span>{tCat(cat.slug as Parameters<typeof tCat>[0])}</span>
          </Link>
        ))}
      </div>

      {/* Right Side (Main Intro Slider + 4 Intro Promo Cards) */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Main Banner Slider */}
        <div
          className={`w-full min-h-[300px] md:h-80 relative rounded-2xl overflow-hidden bg-gradient-to-r ${currentSlide.gradientClass} group shadow-md transition-colors duration-500`}
        >
          <div className="relative z-10 h-full grid grid-cols-1 md:grid-cols-12 items-center p-6 md:p-8 gap-6">
            {/* Left Info Column */}
            <div className="md:col-span-7 flex flex-col justify-center gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${currentSlide.badgeClass}`}
                >
                  {t(currentSlide.badgeKey as Parameters<typeof t>[0])}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/30 text-white/90 backdrop-blur-sm">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  {t(currentSlide.timeKey as Parameters<typeof t>[0])}
                </span>
              </div>

              <h2 className="display-font text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                {t(currentSlide.titleKey as Parameters<typeof t>[0])}
              </h2>

              <p className="text-blue-100 font-semibold text-sm md:text-base">
                {t(currentSlide.subtitleKey as Parameters<typeof t>[0])}
              </p>

              <p className="text-white/80 text-xs md:text-sm line-clamp-2 max-w-xl">
                {t(currentSlide.descKey as Parameters<typeof t>[0])}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={currentSlide.href}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg ${currentSlide.ctaClass}`}
                >
                  <span>{t(currentSlide.ctaKey as Parameters<typeof t>[0])}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  {t(currentSlide.highlightKey as Parameters<typeof t>[0])}
                </span>
              </div>
            </div>

            {/* Right Visual Image Column */}
            <div className="hidden md:flex md:col-span-5 h-full items-center justify-center relative">
              <Link
                href={currentSlide.href}
                className="relative w-full h-56 lg:h-64 rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-white/5 backdrop-blur-xs block"
              >
                <Image
                  src={currentSlide.imageUrl}
                  alt={t(currentSlide.titleKey as Parameters<typeof t>[0])}
                  fill
                  priority
                  sizes="(max-width: 1024px) 40vw, 380px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </Link>
            </div>
          </div>

          {/* Slider Navigation Controls */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label={t('prev_slide')}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label={t('next_slide')}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={t('go_to_slide', { index: idx + 1 })}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeSlide ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom 4 Small Intro Banners with Image, Time & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {HERO_SMALL_BANNERS.map((banner) => (
            <Link
              key={banner.id}
              href={banner.href}
              className={`min-h-[136px] relative rounded-2xl overflow-hidden bg-gradient-to-br ${banner.gradientClass} p-4 flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-md transition-all`}
            >
              {/* Background Product Thumbnail on Right */}
              <div className="absolute right-0 bottom-0 w-28 h-28 opacity-35 group-hover:opacity-50 group-hover:scale-110 transition-all duration-300 pointer-events-none">
                <Image
                  src={banner.imageUrl}
                  alt={t(banner.titleKey as Parameters<typeof t>[0])}
                  fill
                  sizes="120px"
                  className="object-cover rounded-tl-2xl"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/15 to-transparent pointer-events-none" />

              {/* Top Badges: Offer Badge + Time */}
              <div className="relative z-10 flex items-center justify-between gap-1.5 mb-2">
                <span className="px-2 py-0.5 rounded-md bg-white/95 text-ink text-[11px] font-bold shadow-xs">
                  {t(banner.badgeKey as Parameters<typeof t>[0])}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/30 text-white text-[10px] font-medium backdrop-blur-xs">
                  <Clock className="w-3 h-3 text-amber-300" />
                  {t(banner.timeKey as Parameters<typeof t>[0])}
                </span>
              </div>

              {/* Bottom Content: Title, Highlight Sub & Description */}
              <div className="relative z-10">
                <h3 className="text-white font-bold text-sm md:text-base leading-snug">
                  {t(banner.titleKey as Parameters<typeof t>[0])} •{' '}
                  <span className="text-yellow-200">
                    {t(banner.subKey as Parameters<typeof t>[0])}
                  </span>
                </h3>
                <p className="text-white/90 text-xs mt-1 line-clamp-2 leading-relaxed">
                  {t(banner.descKey as Parameters<typeof t>[0])}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
