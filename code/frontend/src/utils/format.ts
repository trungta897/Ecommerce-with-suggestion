import { USD_TO_VND_RATE } from '@/constants/currency';

export function formatPrice(priceVnd: number, locale: string): string {
  if (locale === 'en') {
    const priceUsd = Number(priceVnd) / USD_TO_VND_RATE;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(priceUsd);
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(priceVnd));
}
