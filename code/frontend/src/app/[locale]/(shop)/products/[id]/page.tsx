'use client';

import { useTranslations } from 'next-intl';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import {
  Star,
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Sparkles,
  ChevronRight,
} from '@/components/base/icons';
import { BaseButton } from '@/components/base';
import { useCartStore } from '@/store';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');

  const product = MOCK_PRODUCTS.find((p) => p.id === params.id);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <p className="text-muted text-lg">{t('notFound')}</p>
        <Link href="/" className="text-primary hover:underline mt-4 inline-block">
          {tCommon('home')}
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      id: 0,
      user_id: '',
      product_id: Number(product.id),
      quantity,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-ink-2 mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          {tCommon('home')}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link
          href={`/category/${product.category}`}
          className="hover:text-primary transition-colors capitalize"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-ink font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="bg-white rounded-2xl border border-rule p-6 flex items-center justify-center aspect-square relative overflow-hidden">
          <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-6" />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-2xl lg:text-3xl font-bold text-ink">{product.name}</h1>

          {/* Brand */}
          <p className="text-ink-2">
            {t('brand')}: <span className="font-semibold text-ink">{product.brand}</span>
          </p>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm text-ink-2">(24 {t('reviews')})</span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-muted line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-semibold rounded">
                  -{product.discountPercentage}%
                </span>
              </>
            )}
          </div>

          {/* AI Score */}
          {product.aiScore && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl">
              <h3 className="font-semibold text-purple-700 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4" />
                {t('aiMatch')}: {product.aiScore}%
              </h3>
              <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${product.aiScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Quantity + Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-ink">{t('quantity')}:</span>
              <div className="flex items-center border border-rule rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-paper-2 transition-colors rounded-l-lg"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-paper-2 transition-colors rounded-r-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-green-600 font-medium">{t('inStock')}</span>
            </div>

            <div className="flex gap-3">
              <BaseButton size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
                <ShoppingCart className="w-5 h-5" />
                {t('addToCart')}
              </BaseButton>
              <BaseButton size="lg" variant="outline" className="px-4">
                <Heart className="w-5 h-5" />
              </BaseButton>
            </div>

            <BaseButton size="lg" variant="outline" className="w-full">
              {t('buyNow')}
            </BaseButton>
          </div>
        </div>
      </div>

      {/* Tabs: Description / Reviews */}
      <div className="mt-12">
        <div className="flex border-b border-rule">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'description'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {t('description')}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === 'reviews'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {t('reviews')} (24)
          </button>
        </div>

        <div className="py-8">
          {activeTab === 'description' ? (
            <div className="prose max-w-none text-ink-2 leading-relaxed space-y-4">
              <p>{product.name}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Chip xử lý mạnh mẽ, đa nhiệm mượt mà</li>
                <li>Màn hình sắc nét, công nghệ hiển thị tiên tiến</li>
                <li>Pin dung lượng lớn, sử dụng cả ngày dài</li>
                <li>Camera chất lượng cao, chụp ảnh chuyên nghiệp</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-6">
              {/* AI Review Summary */}
              <div className="p-5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl">
                <h3 className="font-semibold text-purple-700 flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5" />
                  {t('aiSummary')}
                </h3>
                <ul className="list-disc list-inside text-sm text-ink-2 space-y-1">
                  <li>Camera chụp đêm rất tốt</li>
                  <li>Pin sử dụng được 2 ngày liên tục</li>
                  <li>Thiết kế sang trọng, cao cấp</li>
                </ul>
              </div>

              {/* Mock Reviews */}
              {[
                {
                  name: 'Nguyễn Văn A',
                  rating: 5,
                  comment: 'Sản phẩm tuyệt vời, giao hàng nhanh!',
                },
                {
                  name: 'Trần Thị B',
                  rating: 4,
                  comment: 'Chất lượng tốt, đúng mô tả. Pin khá trâu.',
                },
              ].map((review, idx) => (
                <div key={idx} className="border border-rule rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-ink">{review.name}</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-ink-2">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
