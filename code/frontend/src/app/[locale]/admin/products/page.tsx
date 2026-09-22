'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { BaseButton, BaseInput } from '@/components/base';
import { Plus, Edit, Eye, EyeOff, Search, Loader2 } from '@/components/base/icons';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { formatPrice } from '@/utils/format';
import { useAdminProducts, useCategories } from '@/hooks/use-products';
import { useDebounce } from '@/hooks/use-debounce';
import { productService } from '@/services/product-service';

export default function AdminProductsPage() {
  const locale = useLocale();
  const t = useTranslations('admin.products');
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<
    'all' | 'in_stock' | 'out_of_stock'
  >('all');
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();

  const {
    data: productsResponse,
    isLoading,
    refetch,
  } = useAdminProducts({
    page,
    limit: 10,
    categorySlug: selectedCategory !== 'all' ? selectedCategory : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    stockStatus: selectedStockStatus !== 'all' ? selectedStockStatus : undefined,
    q: debouncedSearch.trim() || undefined,
  });

  const products = productsResponse?.data || [];
  const totalPages = productsResponse?.metadata?.totalPages || 1;

  const handleToggleStatus = async (productId: string, currentActive: boolean) => {
    try {
      setTogglingId(productId);
      await productService.update(productId, { isActive: !currentActive });
      toast.success(t('success_update'));
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      refetch();
    } catch (err: unknown) {
      console.error(err);
      toast.error(t('error_update'));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('title')}</h1>
          {productsResponse?.metadata && (
            <p className="text-xs text-ink-2 mt-1">
              {t('totalProducts', { count: productsResponse.metadata.total })}
            </p>
          )}
        </div>
        <Link href={`/${locale}/admin/products/new`}>
          <BaseButton className="gap-2">
            <Plus className="w-4 h-4" />
            {t('add_new')}
          </BaseButton>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
          <BaseInput
            placeholder={t('searchPlaceholder')}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          className="border border-rule rounded-xl px-3.5 py-2 text-sm bg-white text-ink focus:outline-none focus:border-primary shadow-xs"
        >
          <option value="all">{t('filterCategory')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value as 'all' | 'active' | 'inactive');
            setPage(1);
          }}
          className="border border-rule rounded-xl px-3.5 py-2 text-sm bg-white text-ink focus:outline-none focus:border-primary shadow-xs"
        >
          <option value="all">{t('filterStatus')}</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </select>

        <select
          value={selectedStockStatus}
          onChange={(e) => {
            setSelectedStockStatus(e.target.value as 'all' | 'in_stock' | 'out_of_stock');
            setPage(1);
          }}
          className="border border-rule rounded-xl px-3.5 py-2 text-sm bg-white text-ink focus:outline-none focus:border-primary shadow-xs"
        >
          <option value="all">{t('filterStock')}</option>
          <option value="in_stock">{t('inStock')}</option>
          <option value="out_of_stock">{t('outOfStock')}</option>
        </select>

        {(searchTerm ||
          selectedCategory !== 'all' ||
          selectedStatus !== 'all' ||
          selectedStockStatus !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedStatus('all');
              setSelectedStockStatus('all');
              setPage(1);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
          >
            {t('resetFilter')}
          </button>
        )}
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
                <th className="px-5 py-3 font-medium text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                    <span>{t('loadingProducts')}</span>
                  </td>
                </tr>
              )}
              {!isLoading && products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-2">
                    {t('noData')}
                  </td>
                </tr>
              )}
              {!isLoading &&
                products.map((product) => {
                  const isActive = product.isActive !== false;
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-rule last:border-0 hover:bg-paper-2 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-paper-2 rounded-lg flex-shrink-0 overflow-hidden relative border border-rule/50">
                            <Image
                              src={product.thumbnailUrl || '/placeholder.svg'}
                              alt={product.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span
                            className="font-medium text-ink truncate max-w-[220px]"
                            title={product.name}
                          >
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
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                            }`}
                          >
                            {isActive ? t('active') : t('inactive')}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              product.stock && product.stock > 0
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {product.stock && product.stock > 0 ? t('inStock') : t('outOfStock')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/${locale}/admin/products/${product.id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-paper-2 text-ink-2 hover:text-primary transition-colors inline-block"
                            title={t('edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(product.id, isActive)}
                            disabled={togglingId === product.id}
                            className={`p-1.5 rounded-lg hover:bg-paper-2 transition-colors ${
                              isActive
                                ? 'text-ink-2 hover:text-orange-600'
                                : 'text-orange-500 hover:text-green-600'
                            }`}
                            title={isActive ? t('hide') : t('show')}
                          >
                            {togglingId === product.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : isActive ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalItems={productsResponse?.metadata?.total}
          limit={10}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>
    </div>
  );
}
