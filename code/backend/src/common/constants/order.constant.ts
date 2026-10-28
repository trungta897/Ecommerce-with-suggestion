/** Thời hạn cho phép trả hàng (ngày), tính từ completedAt */
export const RETURN_ELIGIBLE_DAYS = 14;

/** Ngưỡng giá trị đơn hàng (VNĐ) bắt buộc đặt cọc */
export const DEPOSIT_THRESHOLD_VND = 200_000;

/** Mức tiền đặt cọc mặc định (VNĐ) */
export const DEPOSIT_AMOUNT_VND = 50_000;

/** Thời hạn giữ đơn chờ thanh toán (phút) */
export const PAYMENT_HOLD_MINUTES = 30;

/** Thời hạn giữ đơn chờ thanh toán (ms) — 30 phút */
export const PAYMENT_HOLD_MS = PAYMENT_HOLD_MINUTES * 60 * 1000;

/** Ngôn ngữ mặc định cho các tác vụ nền */
export const DEFAULT_LANG = 'vi';

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

/** Mã hành động ghi nhận vào auditTrail nội bộ */
export const PAYMENT_AUDIT_ACTIONS = {
  REFUND_STATE_DESYNC: 'REFUND_STATE_DESYNC',
  FORCE_RESET_REFUND: 'FORCE_RESET_REFUND',
  RETURN_APPROVED: 'RETURN_APPROVED',
  RETURN_REJECTED: 'RETURN_REJECTED',
  DUPLICATE_PAYMENT_SUPERSEDED_TXN: 'DUPLICATE_PAYMENT_SUPERSEDED_TXN',
} as const;

/** Lý do chuẩn hóa tiếng Anh cho auditTrail nội bộ */
export const REFUND_AUDIT_REASONS = {
  STATE_DESYNC: 'PROVIDER_PROCESSED_BUT_DB_LOST_PROCESSING_FLAG',
  DUPLICATE_SUPERSEDED_TXN:
    'DUPLICATE_PAYMENT_RECEIVED_FROM_ANOTHER_VNPAY_SESSION',
} as const;
