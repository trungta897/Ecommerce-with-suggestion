import { apiClient } from '../lib/api-client';

export interface ValidateVoucherResponse {
  valid: boolean;
  voucherId: string;
  code: string;
  type: string;
  discountAmount: number;
}

export const voucherService = {
  async validateVoucher(
    code: string,
    subtotal: number,
    phone: string
  ): Promise<ValidateVoucherResponse> {
    const { data } = await apiClient.get<ValidateVoucherResponse>(
      `/vouchers/validate?code=${code}&subtotal=${subtotal}&phone=${encodeURIComponent(phone)}`
    );
    return data;
  },

  async getAdminVouchers(page = 1, limit = 10) {
    const { data } = await apiClient.get(`/vouchers/admin?page=${page}&limit=${limit}`);
    return data;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createVoucher(voucherData: any) {
    const { data } = await apiClient.post('/vouchers', voucherData);
    return data;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateVoucher(id: string, voucherData: any) {
    const { data } = await apiClient.patch(`/vouchers/${id}`, voucherData);
    return data;
  },

  async toggleVoucherStatus(id: string) {
    const { data } = await apiClient.patch(`/vouchers/${id}/toggle`);
    return data;
  },
};
