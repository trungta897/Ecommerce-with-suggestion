'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product } from '@/types';
import ProductCard from '@/components/features/product/ProductCard';
import { Zap, Timer, ChevronLeft, ChevronRight } from '@/components/base/icons';

interface FlashSaleSectionProps {
  products: Product[];
}

export default function FlashSaleSection({ products }: FlashSaleSectionProps) {
  // Mock countdown timer
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 50, seconds: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else {
          seconds = 59;
          if (minutes > 0) minutes--;
          else {
            minutes = 59;
            if (hours > 0) hours--;
            else {
              hours = 23; // Loop for mock
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Drag to scroll logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      // Give 1px tolerance for rounding errors
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

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
      setTimeout(checkScroll, 350); // check after smooth scroll completes
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 lg:px-8">
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-3xl p-1 shadow-lg relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 relative z-10">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <Zap className="text-yellow-300 w-8 h-8 fill-yellow-300 animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-bold text-white uppercase italic tracking-wider">
              Giờ Vàng Giá Sốc
            </h2>
          </div>

          <div className="flex items-center gap-4 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
            <div className="flex items-center gap-2 text-white font-medium">
              <Timer className="w-5 h-5" />
              <span>Kết thúc sau:</span>
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
          {/* Tabs */}
          <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 border-b border-gray-100 pb-2">
            {[
              { time: '10:30', date: '03/08', status: 'Đang diễn ra', active: true },
              { time: '14:00', date: '04/08', status: 'Sắp diễn ra', active: false },
              { time: '09:00', date: '05/08', status: 'Sắp diễn ra', active: false },
              { time: '12:00', date: '06/08', status: 'Sắp diễn ra', active: false },
            ].map((tab, idx) => (
              <button
                key={idx}
                className={`flex-shrink-0 flex flex-col items-center justify-center px-6 py-2 rounded-lg transition-colors ${
                  tab.active
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="font-bold">
                  {tab.time}, {tab.date}
                </span>
                <span className="text-xs">{tab.status}</span>
              </button>
            ))}
          </div>

          {/* Products Horizontal Scroll */}
          <div className="relative group/slider mt-4">
            {/* Scroll Buttons */}
            {canScrollLeft && (
              <button
                onClick={() => scrollBy(-300)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 text-gray-500 hover:text-primary hover:scale-110 transition-all flex items-center justify-center opacity-0 group-hover/slider:opacity-100 hidden md:flex"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scrollBy(300)}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-20 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 text-gray-500 hover:text-primary hover:scale-110 transition-all flex items-center justify-center opacity-0 group-hover/slider:opacity-100 hidden md:flex"
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
              {products.map((product, idx) => {
                // Mock stock data based on index
                const total = 10 + (idx % 5) * 5;
                const sold = Math.floor(total * (0.3 + (idx % 4) * 0.2)); // 30% to 90% sold

                return (
                  <div
                    key={product.id || idx}
                    className="w-[240px] md:w-[280px] flex-shrink-0 select-none"
                    draggable={false}
                  >
                    <ProductCard
                      product={product}
                      isFlashSale={true}
                      flashSaleData={{ total, sold }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
