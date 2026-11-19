'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FilterSidebar from '@/components/category/FilterSidebar';
import ProductCard from '@/components/features/product/ProductCard';
import { useProductsByCategory } from '@/hooks/use-products';
import { FilterIcon, ChevronLeft, ChevronRight } from '@/components/base/icons';

const ITEMS_PER_PAGE = 20;

export default function CategorySlugPage({ params }: { params: { slug: string } }) {
  const t = useTranslations('home.categories');
  const tProduct = useTranslations('product');
  const [page, setPage] = useState<number>(1);

  const { data: productsResponse, isLoading } = useProductsByCategory(params.slug, {
    page,
    limit: ITEMS_PER_PAGE,
  });

  const categoryProducts = productsResponse?.data || [];
  const metadata = productsResponse?.metadata || {
    total: 0,
    page: 1,
    limit: ITEMS_PER_PAGE,
    totalPages: 1,
  };

  let categoryTitle = params.slug;
  try {
    const tr = t(params.slug as Parameters<typeof t>[0]);
    if (tr && !tr.includes('.')) categoryTitle = tr;
  } catch {
    categoryTitle = params.slug;
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > metadata.totalPages || newPage === page) return;
    setPage(newPage);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb / Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-ink uppercase">{categoryTitle}</h1>
        <p className="text-ink-2 mt-2 text-sm">
          {tProduct('showingCount', { count: metadata.total || categoryProducts.length })}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block w-full lg:w-1/4">
          <FilterSidebar />
        </aside>

        {/* Product Grid */}
        <main className="w-full lg:w-3/4 flex flex-col justify-between">
          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden mb-4">
            <button className="w-full py-2 border border-rule rounded-lg text-ink font-medium bg-white shadow-sm flex justify-center items-center gap-2">
              <FilterIcon className="w-4 h-4" />
              {tProduct('filterProducts')}
            </button>
          </div>

          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 bg-white rounded-2xl border border-rule/60" />
              ))}
            </div>
          )}

          {!isLoading && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-5">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
                {categoryProducts.length === 0 && (
                  <div className="col-span-full py-16 text-center text-muted bg-white rounded-2xl border border-rule/80">
                    <p className="text-base font-medium">{tProduct('notFound')}</p>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {metadata.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="p-2.5 rounded-xl border border-rule bg-white text-ink hover:bg-paper-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: metadata.totalPages }, (_, idx) => idx + 1)
                      .filter(
                        (p) => p === 1 || p === metadata.totalPages || Math.abs(p - page) <= 2
                      )
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && p - prev > 1;

                        return (
                          <div key={p} className="flex items-center gap-1.5">
                            {showEllipsis && <span className="px-1 text-muted">...</span>}
                            <button
                              onClick={() => handlePageChange(p)}
                              className={`w-9 h-9 rounded-xl font-semibold text-sm transition-all shadow-xs ${
                                p === page
                                  ? 'bg-primary text-white shadow-sm'
                                  : 'bg-white text-ink border border-rule hover:bg-paper-2'
                              }`}
                            >
                              {p}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= metadata.totalPages}
                    className="p-2.5 rounded-xl border border-rule bg-white text-ink hover:bg-paper-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
