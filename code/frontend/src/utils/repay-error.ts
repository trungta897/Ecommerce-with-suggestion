import { isAxiosError } from 'axios';

export type RepayErrorCategory = 'RATE_LIMIT' | 'TRANSIENT' | 'CLIENT';

export function classifyRepayError(err: unknown): RepayErrorCategory {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 429) {
      return 'RATE_LIMIT';
    }
    if (!err.response || (typeof status === 'number' && status >= 500)) {
      return 'TRANSIENT';
    }
    return 'CLIENT';
  }
  return 'TRANSIENT';
}
