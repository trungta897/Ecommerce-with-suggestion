import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Các ngôn ngữ được hỗ trợ
const locales = ['vi', 'en'];

export default getRequestConfig(async ({ locale }) => {
  // Validate locale
  const currentLocale = locale || 'vi';
  if (!locales.includes(currentLocale)) notFound();

  // Load namespaces concurrently for better performance
  const [common, auth, product, home, admin, cart, profile, checkout, order, address, errorMsg] =
    await Promise.all([
      import(`../messages/${currentLocale}/common.json`),
      import(`../messages/${currentLocale}/auth.json`),
      import(`../messages/${currentLocale}/product.json`),
      import(`../messages/${currentLocale}/home.json`),
      import(`../messages/${currentLocale}/admin.json`),
      import(`../messages/${currentLocale}/cart.json`),
      import(`../messages/${currentLocale}/profile.json`),
      import(`../messages/${currentLocale}/checkout.json`),
      import(`../messages/${currentLocale}/order.json`),
      import(`../messages/${currentLocale}/address.json`),
      import(`../messages/${currentLocale}/error.json`),
    ]);

  return {
    locale: currentLocale,
    messages: {
      common: common.default,
      auth: auth.default,
      product: product.default,
      home: home.default,
      admin: admin.default,
      cart: cart.default,
      profile: profile.default,
      checkout: checkout.default,
      order: order.default,
      address: address.default,
      error: errorMsg.default,
    },
  };
});
