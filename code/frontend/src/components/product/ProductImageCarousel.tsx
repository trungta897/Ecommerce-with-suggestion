'use client';

import { useState, useEffect, useRef, MouseEvent, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from '@/components/base/icons';
import { ProductImage } from '@/types/product';

interface ProductImageCarouselProps {
  images?: ProductImage[];
  thumbnailUrl: string;
  altText: string;
  autoPlayInterval?: number;
}

export function ProductImageCarousel({
  images,
  thumbnailUrl,
  altText,
  autoPlayInterval = 4000,
}: ProductImageCarouselProps) {
  const displayImages =
    images && images.length > 0
      ? images
      : [{ url: thumbnailUrl, variant: 'thumbnail', isPrimary: true }];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === displayImages.length - 1 ? 0 : prevIndex + 1));
  }, [displayImages.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? displayImages.length - 1 : prevIndex - 1));
  }, [displayImages.length]);

  useEffect(() => {
    resetTimeout();
    if (!isHovered && displayImages.length > 1) {
      timeoutRef.current = setTimeout(nextSlide, autoPlayInterval);
    }
    return () => resetTimeout();
  }, [currentIndex, isHovered, autoPlayInterval, displayImages.length, nextSlide]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2)',
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)',
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div
        className="relative aspect-square w-full rounded-2xl border border-rule bg-white overflow-hidden group cursor-crosshair"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out flex items-center justify-center p-6"
          style={
            isHovered ? zoomStyle : { transformOrigin: 'center center', transform: 'scale(1)' }
          }
        >
          <Image
            src={displayImages[currentIndex].url}
            alt={`${altText} - ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Navigation Arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md text-ink-2 hover:text-ink transition-all opacity-0 group-hover:opacity-100 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md text-ink-2 hover:text-ink transition-all opacity-0 group-hover:opacity-100 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-20 h-20 flex-shrink-0 rounded-xl border-2 overflow-hidden bg-white transition-all snap-center ${
                currentIndex === idx
                  ? 'border-primary shadow-sm'
                  : 'border-transparent hover:border-rule'
              }`}
            >
              <Image
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover p-1"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
