/** Các route public (không cần đăng nhập) */
export const PUBLIC_ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  cart: '/cart',
  category: '/category',
  search: '/search',
  orderLookup: '/orders/lookup',
  checkout: '/checkout',
  adminLogin: '/admin/login',
} as const;

/** Các route được middleware bảo vệ cho khách hàng */
export const CUSTOMER_PROTECTED_ROUTES = {
  profile: '/profile',
  orders: '/orders',
  vouchers: '/profile/vouchers',
} as const;

/** Các route admin (cần role ADMIN / SUPER_ADMIN) */
export const ADMIN_ROUTES = {
  root: '/admin',
  dashboard: '/admin/dashboard',
  orders: '/admin/orders',
  products: '/admin/products',
  productNew: '/admin/products/new',
  categories: '/admin/categories',
  categoryNew: '/admin/categories/new',
  discounts: '/admin/promotions/discounts',
  vouchers: '/admin/vouchers',
  returns: '/admin/returns',
  reviews: '/admin/reviews',
  users: '/admin/users',
} as const;

export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';

/** Mẫu URL / selector dùng chung */
export const URL_PATTERNS = {
  productLink: 'a[href*="/products/"]',
  checkout: /\/checkout(\?|$)/,
  login: /\/login(\?|$)/,
  adminLogin: /\/admin\/login(\?|$)/,
  adminArea: /\/admin(\/|$)/,
} as const;

/** Lỗi console đã biết, không phải bug của ứng dụng (dev mode / extension...) */
export const IGNORED_CONSOLE_ERRORS: readonly RegExp[] = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /favicon\.ico/i,
  /Failed to load resource: the server responded with a status of 401/i,
];

/** Dấu hiệu thiếu key dịch của next-intl */
export const I18N_MISSING_PATTERNS: readonly RegExp[] = [/MISSING_MESSAGE/, /Could not resolve/];
