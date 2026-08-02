import { useTranslations } from 'next-intl';
import { BaseInput } from '@/components/base';
import { Search, Star, Eye, EyeOff } from '@/components/base/icons';

export default function AdminReviewsPage() {
  const t = useTranslations('admin.reviews');

  const mockReviews = [
    {
      id: '1',
      product: 'iPhone 15 Pro Max',
      user: 'Nguyễn Văn A',
      rating: 5,
      comment: 'Sản phẩm tuyệt vời, giao hàng nhanh!',
      status: 'visible',
      date: '20/07',
    },
    {
      id: '2',
      product: 'Samsung Galaxy S24 Ultra',
      user: 'Trần Thị B',
      rating: 4,
      comment: 'Chất lượng tốt, đúng mô tả. Pin khá trâu.',
      status: 'visible',
      date: '19/07',
    },
    {
      id: '3',
      product: 'MacBook Air M3',
      user: 'Lê Văn C',
      rating: 2,
      comment: 'Hàng không đúng mô tả, bị trầy xước.',
      status: 'visible',
      date: '18/07',
    },
    {
      id: '4',
      product: 'AirPods Pro 2',
      user: 'Phạm Thị D',
      rating: 1,
      comment: 'Spam review nội dung xấu...',
      status: 'hidden',
      date: '17/07',
    },
    {
      id: '5',
      product: 'iPad Pro M4',
      user: 'Hoàng Văn E',
      rating: 5,
      comment: 'Màn hình đẹp, mượt mà. Rất hài lòng!',
      status: 'visible',
      date: '16/07',
    },
  ];

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
              {mockReviews.map((review) => (
                <tr
                  key={review.id}
                  className="border-b border-rule last:border-0 hover:bg-paper-2 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-ink max-w-[160px] truncate">
                    {review.product}
                  </td>
                  <td className="px-5 py-3 text-ink-2">{review.user}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-2 max-w-[250px] truncate">{review.comment}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        review.status === 'visible'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {t(review.status as Parameters<typeof t>[0])}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      className="p-1.5 rounded-lg hover:bg-paper-2 text-ink-2 hover:text-orange-500 transition-colors"
                      title={review.status === 'visible' ? t('hideReview') : t('showReview')}
                    >
                      {review.status === 'visible' ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
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
