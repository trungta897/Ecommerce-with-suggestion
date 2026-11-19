import { apiClient } from '../lib/api-client';
import {
  CreateVoucherInput,
  ValidateVoucherInput,
  ValidateVoucherResult,
  VouchersResponse,
  VoucherUsagesResponse,
  VoucherItem,
} from '@/types/voucher';

export const voucherService = {
  async validateVoucher(payload: ValidateVoucherInput): Promise<ValidateVoucherResult> {
    const { data } = await apiClient.post<ValidateVoucherResult>('/vouchers/validate', payload);
    return data;
  },

  async getPublicVouchers(page = 1, limit = 20): Promise<VouchersResponse> {
    const { data } = await apiClient.get<VouchersResponse>(
      `/vouchers/public?page=${page}&limit=${limit}`
    );
    return data;
  },

  async getAdminVouchers(page = 1, limit = 10, search?: string): Promise<VouchersResponse> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const { data } = await apiClient.get<VouchersResponse>(
      `/vouchers/admin?page=${page}&limit=${limit}${searchParam}`
    );
    return data;
  },

  async getVoucherUsages(voucherId: string, page = 1, limit = 10): Promise<VoucherUsagesResponse> {
    const { data } = await apiClient.get<VoucherUsagesResponse>(
      `/vouchers/${voucherId}/usages?page=${page}&limit=${limit}`
    );
    return data;
  },

  async getVoucherById(id: string): Promise<VoucherItem> {
    const { data } = await apiClient.get<VoucherItem>(`/vouchers/${id}`);
    return data;
  },

  async createVoucher(voucherData: CreateVoucherInput): Promise<VoucherItem> {
    const { data } = await apiClient.post<VoucherItem>('/vouchers', voucherData);
    return data;
  },

  async updateVoucher(id: string, voucherData: Partial<CreateVoucherInput>): Promise<VoucherItem> {
    const { data } = await apiClient.patch<VoucherItem>(`/vouchers/${id}`, voucherData);
    return data;
  },

  async toggleVoucherStatus(id: string): Promise<VoucherItem> {
    const { data } = await apiClient.patch<VoucherItem>(`/vouchers/${id}/toggle`);
    return data;
  },
};
