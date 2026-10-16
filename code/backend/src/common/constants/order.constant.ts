/** Thời hạn cho phép trả hàng (ngày), tính từ completedAt */
export const RETURN_ELIGIBLE_DAYS = 14;

/** Thời hạn thanh toán (ms) — 30 phút */

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

/** Số lượng tối đa cho 1 item trong đơn hàng */
export const ORDER_ITEM_MAX_QUANTITY = 99;

/** Số item tối đa trong một đơn hàng */
export const ORDER_MAX_ITEMS = 50;
