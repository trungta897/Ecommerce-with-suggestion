'use client';

import { useLocale, useTranslations } from 'next-intl';
import { BaseButton, BaseInput } from '@/components/base';
import { Search, CheckCircle2, XCircle, Clock } from '@/components/base/icons';
import { formatPrice } from '@/utils/format';

export default function AdminReturnsPage() {
  const locale = useLocale();
  const t = useTranslations('admin.returns');

  const mockReturns = [
    {
      id: '1',
      orderId: 'ORD-240718',
      customer: 'Lê Văn C',
      email: 'c@gmail.com',
      product: 'MacBook Air M3',
      reason: 'Hàng bị trầy xước, không đúng mô tả',
      status: 'pending',
      requestDate: '20/07/2026',
      amount: 31990000,
    },
    {
      id: '2',
      orderId: 'ORD-240710',
      customer: 'Nguyễn Văn A',
      email: 'a@gmail.com',
      product: 'Tai nghe Bluetooth AirPods Pro Gen 2',
      reason: 'Lỗi kết nối Bluetooth, không sử dụng được',
      status: 'approved',
      requestDate: '15/07/2026',
      amount: 5990000,
    },
    {
      id: '3',
      orderId: 'ORD-240705',
      customer: 'Hoàng Văn E',
      email: 'e@gmail.com',
      product: 'Laptop ASUS TUF Gaming F15',
      reason: 'Đổi ý, không muốn mua nữa',
      status: 'rejected',
      requestDate: '10/07/2026',
      amount: 19990000,
    },
  ];

  const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-ink mb-8">{t('title')}</h1>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
          <BaseInput placeholder={t('orderId')} className="pl-10" />
        </div>
      </div>

      {/* Returns List - Card Layout */}
      <div className="space-y-4">
        {mockReturns.map((ret) => {
          const config = statusConfig[ret.status] || statusConfig.pending;
          const StatusIcon = config.icon;
          return (
            <div key={ret.id} className="bg-white border border-rule rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-ink">{ret.orderId}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {t(ret.status as Parameters<typeof t>[0])}
                    </span>
                  </div>
                  <p className="text-sm text-ink-2">
                    {t('customer')}: <span className="font-medium text-ink">{ret.customer}</span> (
                    {ret.email})
                  </p>
                  <p className="text-sm text-ink-2">
                    {t('reason')}: <span className="text-ink">{ret.reason}</span>
                  </p>
                  <div className="flex items-center gap-4 text-xs text-ink-2">
                    <span>{ret.product}</span>
                    <span>·</span>
                    <span>
                      {t('requestDate')}: {ret.requestDate}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(ret.amount, locale)}
                  </span>
                  {ret.status === 'pending' && (
                    <div className="flex gap-2">
                      <BaseButton size="sm" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {t('approve')}
                      </BaseButton>
                      <BaseButton size="sm" variant="destructive" className="gap-1">
                        <XCircle className="w-3 h-3" />
                        {t('reject')}
                      </BaseButton>
                    </div>
                  )}
                  {ret.status === 'approved' && (
                    <BaseButton size="sm" variant="outline" className="gap-1">
                      {t('refund')}
                    </BaseButton>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
