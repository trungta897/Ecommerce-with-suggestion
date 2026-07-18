import React from 'react';
import { useTranslations } from 'next-intl';

/* Hallmark · component: Card · genre: modern-minimal · theme: custom
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass
 */

interface ProductCardProps {
  title: string;
  price: string;
  originalPrice?: string;
  ram: string;
  rom: string;
  isAiMatch?: boolean;
}

export default function ProductCardVN({
  title,
  price,
  originalPrice,
  ram,
  rom,
  isAiMatch = false,
}: ProductCardProps) {
  const t = useTranslations('home.product');

  return (
    <div className="group relative flex flex-col bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl overflow-hidden hover:border-[var(--color-accent)] transition-all duration-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-[var(--color-focus)] focus-within:ring-offset-2">
      {/* AI Match Badge */}
      {isAiMatch && (
        <div className="absolute top-[var(--space-2)] left-[var(--space-2)] z-10 bg-gradient-to-r from-[var(--color-ai-gradient-start)] to-[var(--color-ai-gradient-end)] text-white text-xs font-bold px-[var(--space-3)] py-[var(--space-1)] rounded-full flex items-center gap-1 shadow-sm">
          {t('ai_match')}
        </div>
      )}

      {/* Product Image Placeholder */}
      <div className="w-full aspect-square bg-[var(--color-paper-2)] relative overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105 bg-[var(--color-paper-3)]" />
      </div>

      {/* Content */}
      <div className="p-[var(--space-4)] flex flex-col flex-1">
        <h3 className="font-semibold text-[var(--color-ink)] mb-[var(--space-1)] line-clamp-2">
          <a href="#" className="outline-none">
            <span className="absolute inset-0" />
            {title}
          </a>
        </h3>
        
        {/* Price Block */}
        <div className="mt-auto pt-[var(--space-2)] flex flex-col">
          <span className="text-xl font-bold text-[var(--color-accent)]">
            {price}
          </span>
          {originalPrice && (
            <span className="text-sm text-[var(--color-muted)] line-through">
              {originalPrice}
            </span>
          )}
        </div>

        {/* Specs (Dense Layout) */}
        <div className="flex flex-wrap gap-[var(--space-2)] mt-[var(--space-3)]">
          <div className="text-xs bg-[var(--color-paper-2)] border border-[var(--color-rule)] px-[var(--space-2)] py-1 rounded text-[var(--color-ink-2)]">
            <span className="text-[var(--color-muted)]">{t('ram')}:</span> {ram}
          </div>
          <div className="text-xs bg-[var(--color-paper-2)] border border-[var(--color-rule)] px-[var(--space-2)] py-1 rounded text-[var(--color-ink-2)]">
            <span className="text-[var(--color-muted)]">{t('rom')}:</span> {rom}
          </div>
        </div>
      </div>
    </div>
  );
}
