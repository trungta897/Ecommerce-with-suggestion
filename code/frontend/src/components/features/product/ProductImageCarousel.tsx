'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Search, X } from '@/components/base/icons';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

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

  const modalNextSlide = useCallback(() => {
    setModalIndex((prevIndex) => (prevIndex === displayImages.length - 1 ? 0 : prevIndex + 1));
  }, [displayImages.length]);

  const modalPrevSlide = useCallback(() => {
    setModalIndex((prevIndex) => (prevIndex === 0 ? displayImages.length - 1 : prevIndex - 1));
  }, [displayImages.length]);

  useEffect(() => {
    resetTimeout();
    if (!isModalOpen && displayImages.length > 1) {
      timeoutRef.current = setTimeout(nextSlide, autoPlayInterval);
    }
    return () => resetTimeout();
  }, [currentIndex, isModalOpen, autoPlayInterval, displayImages.length, nextSlide]);

  const handleOpenModal = () => {
    setModalIndex(currentIndex);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setCurrentIndex(modalIndex);
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div
        className="relative aspect-square w-full rounded-2xl border border-rule bg-white overflow-hidden group cursor-pointer"
        onClick={handleOpenModal}
      >
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <Image
            src={displayImages[currentIndex].url}
            alt={`${altText} - ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Zoom Icon Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/50 p-4 rounded-full text-white backdrop-blur-sm">
            <Search className="w-8 h-8" />
          </div>
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

      {/* Fullscreen Image Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10">
          <button
            onClick={handleCloseModal}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
            aria-label="Close fullscreen"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
            <Image
              src={displayImages[modalIndex].url}
              alt={`${altText} - ${modalIndex + 1} (Fullscreen)`}
              fill
              className="object-contain"
              sizes="100vw"
            />

            {displayImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    modalPrevSlide();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    modalNextSlide();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
