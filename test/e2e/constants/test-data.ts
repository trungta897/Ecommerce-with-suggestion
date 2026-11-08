/** Dữ liệu đầu vào giả lập cho các test (không gửi OTP/SMS thật) */
export const TEST_DATA = {
  invalidPhone: 'abc',
  wrongAdminPassword: 'Wrong@Password123',
  searchKeyword: 'a',
} as const;

/** Thời gian chờ (ms) */
export const TIMEOUTS = {
  test: 60_000,
  expect: 10_000,
  navigation: 30_000,
  webServer: 180_000,
} as const;

/** Cấu hình so sánh ảnh giao diện (visual regression) */
export const VISUAL = {
  maxDiffPixelRatio: 0.02,
  desktopViewport: { width: 1440, height: 900 },
} as const;
