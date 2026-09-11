'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Review, reviewService } from '@/services/review-service';
import { useAuthStore } from '@/store/useAuthStore';
import { Star, MessageCircle, AlertCircle } from 'lucide-react';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const t = useTranslations('product');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isAuthenticated, user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchReviews = async (p: number) => {
    try {
      setLoading(true);
      const res = await reviewService.getReviewsByProduct(productId, p, 5);
      setReviews(res.data);
      setTotalPages(res.meta.totalPages);
      setPage(p);
    } catch (error) {
      console.error('Failed to load reviews', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await reviewService.createReview(productId, { rating, title, content });
      setShowForm(false);
      setRating(5);
      setTitle('');
      setContent('');
      fetchReviews(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || t('errorSubmit'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="mt-12 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary-600" />
          {t('reviewsTitle')}
        </h2>
        {isAuthenticated && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
          >
            {t('writeReview')}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200"
        >
          <h3 className="text-lg font-semibold mb-4">{t('yourReview')}</h3>

          {submitError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {submitError}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('ratingStars')}
            </label>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 cursor-pointer transition ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setRating(i + 1)}
                />
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder={t('titlePlaceholder')}
              maxLength={100}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('content')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder={t('contentPlaceholder')}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? t('submitting') : t('submitReview')}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                    {review.user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.user?.fullName}</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      {review.isVerifiedPurchase && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          {t('verifiedPurchase')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              {review.title && <h5 className="font-semibold mt-3 text-gray-800">{review.title}</h5>}
              {review.content && (
                <p className="text-gray-600 mt-2 text-sm leading-relaxed">{review.content}</p>
              )}
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8 pt-4 border-t border-gray-100">
              <button
                disabled={page === 1}
                onClick={() => fetchReviews(page - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
              >
                {t('previous')}
              </button>
              <span className="px-3 py-1 text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => fetchReviews(page + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
              >
                {t('next')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
          <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p>{t('noReviewsForProduct')}</p>
          <p className="text-sm mt-1">{t('beFirstReview')}</p>
        </div>
      )}
    </div>
  );
}
