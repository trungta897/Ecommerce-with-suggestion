'use client';

import { useLocale, useTranslations } from 'next-intl';
import { BaseButton, BaseInput } from '@/components/base';
import { Plus, Edit, EyeOff, Search } from '@/components/base/icons';
import { formatPrice } from '@/utils/format';
import { useProducts } from '@/hooks/use-products';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminProductsPage() {
  const locale = useLocale();
  const t = useTranslations('admin.products');
  const { data: productsResponse, isLoading } = useProducts({ all: true });
  const products = productsResponse?.data || [];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-ink">{t('title')}</h1>
        <Link href="/admin/products/new">
          <BaseButton className="gap-2">
            <Plus className="w-4 h-4" />
            {t('add_new')}
          </BaseButton>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
          <BaseInput placeholder={t('searchPlaceholder')} className="pl-10" />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-rule overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-2 border-b border-rule bg-paper-2">
                <th className="px-5 py-3 font-medium">{t('product_name')}</th>
                <th className="px-5 py-3 font-medium">{t('category')}</th>
                <th className="px-5 py-3 font-medium">{t('price')}</th>
                <th className="px-5 py-3 font-medium">{t('stock')}</th>
                <th className="px-5 py-3 font-medium">{t('status')}</th>
                <th className="px-5 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink-2 animate-pulse">
                    ...
                  </td>
                </tr>
              )}
              {!isLoading && products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-ink-2">
                    {t('noData')}
                  </td>
                </tr>
              )}
              {!isLoading &&
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-rule last:border-0 hover:bg-paper-2 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-paper-2 rounded-lg flex-shrink-0 overflow-hidden relative">
                          <Image
                            src={product.thumbnailUrl || '/placeholder.png'}
                            alt={product.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <span className="font-medium text-ink truncate max-w-[200px]">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-2 capitalize">
                      {product.category?.name || product.category?.slug || '-'}
                    </td>
                    <td className="px-5 py-3 font-semibold text-ink">
                      {formatPrice(product.price, locale)}
                    </td>
                    <td className="px-5 py-3 text-ink-2">{product.stock || 0}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          product.isActive !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.isActive !== false ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg hover:bg-paper-2 text-ink-2 hover:text-primary transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-paper-2 text-ink-2 hover:text-orange-500 transition-colors">
                          <EyeOff className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
