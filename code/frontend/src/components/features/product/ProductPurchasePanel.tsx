'use client';

import { useTranslations } from 'next-intl';
import { BaseButton } from '@/components/base/BaseButton';
import { Minus, Plus, ShoppingCart, Heart } from '@/components/base/icons';

interface ProductPurchasePanelProps {
  stock?: number;
  isOutOfStock: boolean;
  quantity: number;
  onQuantityChange: (nextQuantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

export function ProductPurchasePanel({
  stock,
  isOutOfStock,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
}: ProductPurchasePanelProps) {
  const t = useTranslations('product');

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink">{t('quantity')}:</span>
        <div className="flex items-center border border-rule rounded-lg">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="p-2 hover:bg-paper-2 transition-colors rounded-l-lg disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={isOutOfStock || quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center font-semibold">{isOutOfStock ? 0 : quantity}</span>
          <button
            onClick={() =>
              onQuantityChange(Math.min(quantity + 1, stock || Number.MAX_SAFE_INTEGER))
            }
            className="p-2 hover:bg-paper-2 transition-colors rounded-r-lg disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={isOutOfStock || quantity >= (stock || 0)}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {t('outOfStock')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {t('inStockWithCount', { count: stock || 0 })}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <BaseButton
          size="lg"
          className="flex-1 gap-2"
          onClick={onAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingCart className="w-5 h-5" />
          {isOutOfStock ? t('outOfStock') : t('addToCart')}
        </BaseButton>
        <BaseButton size="lg" variant="outline" className="px-4">
          <Heart className="w-5 h-5" />
        </BaseButton>
      </div>

      <BaseButton
        size="lg"
        variant="outline"
        className="w-full"
        onClick={onBuyNow}
        disabled={isOutOfStock}
      >
        {t('buyNow')}
      </BaseButton>
    </div>
  );
}
