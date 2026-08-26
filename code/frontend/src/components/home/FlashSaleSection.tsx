'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Product } from '@/types/product';
import { ProductDiscount } from '@/types/promotion';
import ProductCard from '@/components/features/product/ProductCard';
import { Zap, Timer, ChevronLeft, ChevronRight } from '@/components/base/icons';
import { promotionService } from '@/services/promotion-service';

interface FlashSaleSectionProps {
  products?: Product[];
}

export default function FlashSaleSection({
  products: fallbackProducts = [],
}: FlashSaleSectionProps) {
  const t = useTranslations('home.flash_sale');
  const [activeDiscounts, setActiveDiscounts] = useState<ProductDiscount[]>([]);

  // Real countdown timer
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isEnded: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isEnded: false });

  useEffect(() => {
    let isMounted = true;
    const fetchActiveSales = async () => {
      try {
        const data = await promotionService.getActiveFlashSales();
        if (isMounted && data && data.length > 0) {
          setActiveDiscounts(data);
        }
      } catch (err) {
        console.error('Failed to fetch active flash sales', err);
      }
    };

    fetchActiveSales();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate target end time
  const targetEndTime = React.useMemo(() => {
    if (activeDiscounts.length > 0) {
      // Pick earliest end date
      const endDates = activeDiscounts
        .map((d) => new Date(d.endDate).getTime())
        .filter((t) => t > Date.now());
      if (endDates.length > 0) {
        return Math.min(...endDates);
      }
    }
    // Fallback: 8 hours from now
    return Date.now() + 8 * 60 * 60 * 1000;
  }, [activeDiscounts]);

  useEffect(() => {
    const updateCountdown = () => {
      const diff = targetEndTime - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isEnded: true });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, isEnded: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetEndTime]);

  // Drag to scroll logic
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
  }, [activeDiscounts, fallbackProducts]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1;
    scrollRef.current.scrollLeft = scrollLeft - walk;
    checkScroll();
  };

  const scrollBy = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  // Determine items to display
  const itemsToDisplay: Array<{
    product: Product;
    flashSaleData: { total: number; sold: number };
  }> =
    activeDiscounts.length > 0
      ? activeDiscounts
          .filter((d): d is ProductDiscount & { product: Product } => !!d.product)
          .map((d) => ({
            product: {
              ...d.product,
              discountPrice: Number(d.discountPrice),
            },
            flashSaleData: {
              total: d.flashSaleQty,
              sold: d.flashSaleSold,
            },
          }))
      : fallbackProducts.map((p, idx) => {
          const total = 20 + (idx % 5) * 5;
          const sold = Math.floor(total * 0.4);
          return {
            product: p,
            flashSaleData: { total, sold },
          };
        });

  if (itemsToDisplay.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 lg:px-8">
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-3xl p-1 shadow-lg relative overflow-hidden">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 relative z-10">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <Zap className="text-yellow-300 w-8 h-8 fill-yellow-300 animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-bold text-white uppercase italic tracking-wider">
              {t('title')}
            </h2>
          </div>

          <div className="flex items-center gap-4 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
            <div className="flex items-center gap-2 text-white font-medium">
              <Timer className="w-5 h-5" />
              <span>{t('ends_in')}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-lg">
              <span className="bg-white text-red-600 px-2 py-1 rounded shadow-sm min-w-[36px] text-center">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-white">:</span>
              <span className="bg-white text-red-600 px-2 py-1 rounded shadow-sm min-w-[36px] text-center">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-white">:</span>
              <span className="bg-white text-red-600 px-2 py-1 rounded shadow-sm min-w-[36px] text-center">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area - White Box */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 relative z-10">
          {/* Products Horizontal Scroll */}
          <div className="relative group/slider">
            {/* Scroll Buttons */}
            {canScrollLeft && (
              <button
                onClick={() => scrollBy(-300)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 text-gray-500 hover:text-primary hover:scale-110 transition-all flex items-center justify-center opacity-0 group-hover/slider:opacity-100 hidden md:flex"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scrollBy(300)}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 text-gray-500 hover:text-primary hover:scale-110 transition-all flex items-center justify-center opacity-0 group-hover/slider:opacity-100 hidden md:flex"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div
              ref={scrollRef}
              onScroll={checkScroll}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 cursor-grab active:cursor-grabbing px-1"
            >
              {itemsToDisplay.map(({ product, flashSaleData }, idx) => (
                <div
                  key={product.id || idx}
                  className="w-[240px] md:w-[280px] flex-shrink-0 select-none"
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
