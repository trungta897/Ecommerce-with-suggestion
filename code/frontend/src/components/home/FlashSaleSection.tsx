'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Product } from '@/types/product';
import { ProductDiscount } from '@/types/promotion';
import ProductCard from '@/components/features/product/ProductCard';
import { Zap, Timer, Clock, ChevronLeft, ChevronRight } from '@/components/base/icons';
import { promotionService } from '@/services/promotion-service';
import { FLASH_SALE_DEFAULT_HOURS, FLASH_SALE_SCROLL_STEP_PX } from '@/constants';

export default function FlashSaleSection() {
  const t = useTranslations('home.flash_sale');
  const locale = useLocale();
  const [activeDiscounts, setActiveDiscounts] = useState<ProductDiscount[]>([]);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, isEnded: false });

  useEffect(() => {
    let isMounted = true;
    promotionService
      .getActiveFlashSales()
      .then((data) => {
        if (isMounted && data) setActiveDiscounts(data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const targetEndTime = React.useMemo(() => {
    if (activeDiscounts.length > 0) {
      const endDates = activeDiscounts
        .map((d) => new Date(d.endDate).getTime())
        .filter((time) => time > Date.now());
      if (endDates.length > 0) return Math.min(...endDates);
    }
    return Date.now() + FLASH_SALE_DEFAULT_HOURS * 60 * 60 * 1000;
  }, [activeDiscounts]);

  const timeSlotText = React.useMemo(() => {
    if (activeDiscounts.length > 0) {
      const first = activeDiscounts[0];
      const formatter = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${formatter.format(new Date(first.startDate))} - ${formatter.format(new Date(first.endDate))}`;
    }
    return t('default_time_range');
  }, [activeDiscounts, locale, t]);

  useEffect(() => {
    const updateCountdown = () => {
      const diff = targetEndTime - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isEnded: true });
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isEnded: false,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetEndTime]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft: sLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(sLeft > 0);
      setCanScrollRight(Math.ceil(sLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [activeDiscounts]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft - (x - startX);
    checkScroll();
  };

  const scrollBy = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  const itemsToDisplay = activeDiscounts
    .filter((d): d is ProductDiscount & { product: Product } => !!d.product)
    .map((d) => ({
      product: { ...d.product, discountPrice: Number(d.discountPrice) },
      flashSaleData: { total: d.flashSaleQty, sold: d.flashSaleSold },
    }));

  if (itemsToDisplay.length === 0) return null;

  const countdownUnits = [
    { value: timeLeft.hours, label: t('hours_short') },
    { value: timeLeft.minutes, label: t('minutes_short') },
    { value: timeLeft.seconds, label: t('seconds_short') },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 lg:px-8">
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-3xl p-1.5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Header Area: Title, Subtitle, Time Window & Live Countdown */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between px-5 py-4 gap-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shadow-xs">
                <Zap className="text-yellow-300 w-6 h-6 fill-yellow-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider">
                    {t('title')}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-300 text-red-900 uppercase">
                    {t('ongoing')}
                  </span>
                </div>
                <p className="text-red-100 text-xs md:text-sm mt-0.5">{t('subtitle')}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-black/25 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-xs w-fit">
              <Clock className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
              <span className="text-white/80">{t('time_slot_label')}</span>
              <span className="font-bold text-yellow-200">{timeSlotText}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-2xl w-fit">
            <div className="flex items-center gap-1.5 text-white text-sm font-medium">
              <Timer className="w-4 h-4 text-yellow-300" />
              <span>{t('ends_in')}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold">
              {countdownUnits.map((unit, idx) => (
                <React.Fragment key={unit.label}>
                  {idx > 0 && <span className="text-white font-bold">:</span>}
                  <div className="bg-white text-red-600 px-2.5 py-1 rounded-lg shadow-sm min-w-[42px] text-center leading-tight">
                    <span className="text-base block">{String(unit.value).padStart(2, '0')}</span>
                    <span className="text-[10px] text-ink-2 font-medium block">{unit.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area - White Box with Product Cards */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 relative z-10">
          <div className="relative group/slider">
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollBy(-FLASH_SALE_SCROLL_STEP_PX)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 text-gray-500 hover:text-primary hover:scale-110 transition-all items-center justify-center opacity-0 group-hover/slider:opacity-100 hidden md:flex"
                aria-label={t('scroll_left')}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollBy(FLASH_SALE_SCROLL_STEP_PX)}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 text-gray-500 hover:text-primary hover:scale-110 transition-all items-center justify-center opacity-0 group-hover/slider:opacity-100 hidden md:flex"
                aria-label={t('scroll_right')}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div
              ref={scrollRef}
              onScroll={checkScroll}
              onMouseDown={handleMouseDown}
              onMouseLeave={() => setIsDragging(false)}
              onMouseUp={() => setIsDragging(false)}
              onMouseMove={handleMouseMove}
              className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 cursor-grab active:cursor-grabbing px-1"
            >
              {itemsToDisplay.map(({ product, flashSaleData }, idx) => (
                <div
                  key={product.id || idx}
                  className="w-[240px] md:w-[270px] flex-shrink-0 select-none"
                  draggable={false}
                >
                  <ProductCard product={product} isFlashSale={true} flashSaleData={flashSaleData} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
