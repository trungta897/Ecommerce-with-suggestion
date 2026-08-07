import { USD_TO_VND_RATE } from '@/constants/currency';

export function formatPrice(priceUsd: number, locale: string): string {
  if (locale === 'vi') {
    const priceVnd = Math.round(priceUsd * USD_TO_VND_RATE);
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(priceVnd);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceUsd);
}
