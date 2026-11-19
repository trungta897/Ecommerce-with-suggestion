/**
 * Lấy giá trị bí mật từ biến môi trường.
 * - Môi trường production: bắt buộc phải cấu hình, thiếu sẽ dừng khởi động (fail-fast).
 * - Môi trường phát triển/kiểm thử: dùng giá trị mặc định chỉ để thuận tiện cục bộ.
 */
export function requireSecret(
  value: string | undefined,
  name: string,
  devFallback: string,
): string {
  if (value && value.length > 0) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `Thiếu biến môi trường bắt buộc ${name} trong môi trường production.`,
    );
  }
  return devFallback;
}
