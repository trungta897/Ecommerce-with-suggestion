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
      common: (await import(`../messages/${currentLocale}/common.json`)).default,
      auth: (await import(`../messages/${currentLocale}/auth.json`)).default,
      product: (await import(`../messages/${currentLocale}/product.json`)).default,
      home: (await import(`../messages/${currentLocale}/home.json`)).default,
    },
  };
});
