import { apiClient } from '../lib/api-client';

export interface ValidateVoucherResponse {
  valid: boolean;
  voucherId: string;
  code: string;
  type: string;
  discountAmount: number;
}

export const voucherService = {
  async validateVoucher(code: string, subtotal: number): Promise<ValidateVoucherResponse> {
    const { data } = await apiClient.get<ValidateVoucherResponse>(
      `/vouchers/validate?code=${code}&subtotal=${subtotal}`
    );
    return data;
  },
};
