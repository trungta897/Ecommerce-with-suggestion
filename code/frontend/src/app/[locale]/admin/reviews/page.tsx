'use client';

import { useTranslations } from 'next-intl';
import { BaseInput } from '@/components/base';
import { Search, Star, Eye, EyeOff } from '@/components/base/icons';
import { useEffect, useState, useCallback } from 'react';
import { reviewService } from '@/services/review-service';
import { AdminReviewItem } from '@/types/review';
import { AdminPagination } from '@/components/admin/AdminPagination';

export default function AdminReviewsPage() {
  const t = useTranslations('admin.reviews');
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  const fetchReviews = useCallback(
    async (p: number) => {
      try {
        setLoading(true);
        const res = await reviewService.getAdminReviews(p, 10);
        setReviews(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setPage(p);
      } catch (err: unknown) {
        console.error('Failed to load reviews', err);
        setError(t('loadError'));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  const handleToggle = async (id: string) => {
    try {
      await reviewService.toggleVisibility(id);
      fetchReviews(page);
    } catch (err: unknown) {
      console.error('Failed to toggle visibility', err);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-ink mb-8">{t('title')}</h1>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
          <BaseInput placeholder={t('searchPlaceholder')} className="pl-10" />
        </div>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      {/* Reviews Table */}
      <div className="bg-white rounded-xl border border-rule overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-2 border-b border-rule bg-paper-2">
                <th className="px-5 py-3 font-medium">{t('product')}</th>
                <th className="px-5 py-3 font-medium">{t('user')}</th>
                <th className="px-5 py-3 font-medium">{t('rating')}</th>
                <th className="px-5 py-3 font-medium">{t('comment')}</th>
                <th className="px-5 py-3 font-medium">{t('status')}</th>
                <th className="px-5 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    {t('loading')}
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="border-b border-rule last:border-0 hover:bg-paper-2 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-ink max-w-[160px] truncate">
                      {review.product?.name}
                    </td>
                    <td className="px-5 py-3 text-ink-2">
                      <div>{review.user?.fullName}</div>
                      <div className="text-xs text-gray-500">{review.user?.phone}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-2 max-w-[250px] truncate">
                      {review.title && <div className="font-medium text-black">{review.title}</div>}
                      {review.content}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          review.status === 'VISIBLE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {review.status === 'VISIBLE' ? t('visible') : t('hidden')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleToggle(review.id)}
                        className="p-1.5 rounded-lg hover:bg-paper-2 text-ink-2 hover:text-orange-500 transition-colors"
                        title={review.status === 'VISIBLE' ? t('hideReview') : t('showReview')}
                      >
                        {review.status === 'VISIBLE' ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        onPageChange={fetchReviews}
        className="mt-6 rounded-xl border border-rule"
      />
    </div>
  );
}
