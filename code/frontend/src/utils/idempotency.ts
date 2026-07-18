/**
 * Tạo một chuỗi Idempotency Key duy nhất.
 * Sử dụng crypto.randomUUID() được hỗ trợ trong các trình duyệt hiện đại.
 * Nếu không hỗ trợ, fallback về một phương pháp tạo UUID đơn giản.
 */
export const generateIdempotencyKey = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback đơn giản
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      Number(c) ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))
    ).toString(16)
  );
};
