import { Prisma } from '@prisma/client';

interface AuditEntry {
  action: string;
  adminId?: string;
  userId?: string;
  timestamp?: string;
  reason?: string;
  [key: string]: unknown;
}

/**
 * Append một entry vào field auditTrail (Json?) trên bảng orders
 * bằng MySQL JSON_ARRAY_APPEND — đảm bảo atomic, không mất log khi
 * 2 hành động xảy ra gần như đồng thời.
 *
 * @convention BẮT BUỘC dùng hàm này cho mọi ghi log auditTrail.
 *   TUYỆT ĐỐI KHÔNG đọc ra → push → ghi lại (race condition mất log).
 *   Luôn gọi bên trong Prisma transaction.
 * @see docs/convention.md > "Audit Trail"
 */
export async function appendAuditTrail(
  tx: Prisma.TransactionClient,
  orderId: string,
  entry: AuditEntry,
): Promise<void> {
  const auditLog = JSON.stringify({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  });
  await tx.$executeRaw`
    UPDATE orders
    SET auditTrail = JSON_ARRAY_APPEND(
      COALESCE(auditTrail, JSON_ARRAY()), '$', CAST(${auditLog} AS JSON)
    )
    WHERE id = ${orderId}
  `;
}
