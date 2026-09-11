import { isAxiosError } from 'axios';

interface ApiErrorResponse {
  message?: string;
}

export function getApiErrorMessage(err: unknown): string | undefined {
  if (isAxiosError<ApiErrorResponse>(err)) {
    return err.response?.data?.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return undefined;
}
