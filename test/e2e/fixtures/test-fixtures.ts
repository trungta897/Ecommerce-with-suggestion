import { test as base, expect, type Page } from '@playwright/test';
import { IGNORED_CONSOLE_ERRORS, I18N_MISSING_PATTERNS } from '../constants';

export interface PageHealth {
  consoleErrors: string[];
  pageErrors: string[];
  i18nErrors: string[];
}

interface Fixtures {
  /** Theo dõi lỗi console / lỗi JS / thiếu key i18n trong suốt test */
  pageHealth: PageHealth;
}

function isIgnored(message: string): boolean {
  return IGNORED_CONSOLE_ERRORS.some((pattern) => pattern.test(message));
}

function isI18nError(message: string): boolean {
  return I18N_MISSING_PATTERNS.some((pattern) => pattern.test(message));
}

function attachHealthListeners(page: Page, health: PageHealth): void {
  page.on('console', (msg) => {
    const text = msg.text();
    if (isI18nError(text)) health.i18nErrors.push(text);
    if (msg.type() === 'error' && !isIgnored(text)) health.consoleErrors.push(text);
  });
  page.on('pageerror', (error) => {
    health.pageErrors.push(error.message);
  });
}

export const test = base.extend<Fixtures>({
  pageHealth: async ({ page }, use) => {
    const health: PageHealth = { consoleErrors: [], pageErrors: [], i18nErrors: [] };
    attachHealthListeners(page, health);
    await use(health);
  },
});

/** Khẳng định trang không có lỗi JS chưa bắt và không thiếu key dịch */
export function expectHealthyPage(health: PageHealth): void {
  expect(health.pageErrors, 'Uncaught JS errors on page').toEqual([]);
  expect(health.i18nErrors, 'Missing i18n messages').toEqual([]);
}

export { expect };
