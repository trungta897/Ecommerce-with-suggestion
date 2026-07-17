import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Các ngôn ngữ được hỗ trợ
const locales = ['vi', 'en'];

export default getRequestConfig(async ({ locale }) => {
  // Validate locale
  const currentLocale = locale || 'vi';
  if (!locales.includes(currentLocale)) notFound();

  return {
    locale: currentLocale,
    messages: {
      Common: (await import(`../messages/${currentLocale}/common.json`)).default,
      Auth: (await import(`../messages/${currentLocale}/auth.json`)).default,
      Product: (await import(`../messages/${currentLocale}/product.json`)).default,
    },
  };
});
