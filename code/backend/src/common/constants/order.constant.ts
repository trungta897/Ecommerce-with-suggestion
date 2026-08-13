/** Thời hạn cho phép trả hàng (ngày), tính từ completedAt */
export const RETURN_ELIGIBLE_DAYS = 14;

/** Thời hạn thanh toán (ms) — 30 phút */
export const PAYMENT_TIMEOUT_MS = 30 * 60 * 1000;

/** Số file chứng minh tối đa khi yêu cầu return */
export const RETURN_MAX_EVIDENCE_FILES = 5;

/** Dung lượng tối đa mỗi file chứng minh (bytes) — 10MB */
export const RETURN_MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Định dạng file chứng minh cho phép */
export const RETURN_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
];
