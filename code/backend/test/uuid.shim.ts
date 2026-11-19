// Jest (CommonJS) không nạp được gói `uuid` thuần ESM; dùng bản thay thế dựa trên `crypto`.
import { randomUUID } from 'crypto';

export const v4 = (): string => randomUUID();
export const validate = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
