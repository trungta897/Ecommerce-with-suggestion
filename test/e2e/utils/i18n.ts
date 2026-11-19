import fs from 'fs';
import path from 'path';
import { PATHS, DEFAULT_LOCALE, type Locale } from '../constants';

type MessageTree = { [key: string]: string | MessageTree };

const cache = new Map<string, MessageTree>();

function loadNamespace(locale: Locale, namespace: string): MessageTree {
  const cacheKey = `${locale}/${namespace}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const filePath = path.join(PATHS.messagesDir, locale, `${namespace}.json`);
  const tree: MessageTree = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  cache.set(cacheKey, tree);
  return tree;
}

/**
 * Lấy text hiển thị trực tiếp từ file dịch của Frontend (single source of truth),
 * để test không phải hardcode text UI.
 *
 * @example t('auth.login_error') // "Đăng nhập thất bại..."
 * @example t('product.discount', { percent: 10 }, 'en')
 */
export function t(
  key: string,
  params: Record<string, string | number> = {},
  locale: Locale = DEFAULT_LOCALE
): string {
  const [namespace, ...segments] = key.split('.');
  let node: string | MessageTree = loadNamespace(locale, namespace);

  for (const segment of segments) {
    if (typeof node === 'string' || !(segment in node)) {
      throw new Error(`[e2e] Missing translation key "${key}" for locale "${locale}"`);
    }
    node = node[segment];
  }

  if (typeof node !== 'string') {
    throw new Error(`[e2e] Translation key "${key}" is not a string leaf`);
  }

  return Object.entries(params).reduce(
    (text, [param, value]) => text.replace(`{${param}}`, String(value)),
    node
  );
}

/** Thêm tiền tố locale vào route (localePrefix: 'as-needed' → vi không có tiền tố) */
export function localizedPath(route: string, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === DEFAULT_LOCALE) return route;
  return route === '/' ? `/${locale}` : `/${locale}${route}`;
}
