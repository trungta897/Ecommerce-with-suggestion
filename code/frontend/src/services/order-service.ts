import { apiClient } from '@/lib/api-client';
import { Order } from '@/types/order';

export interface ReturnEligibilityResponse {
  eligible: boolean;
  reason?: string;
  daysLeft?: number;
}

export interface RequestReturnDto {
  returnReason: string;
  note?: string;
  files?: File[];
}

export interface RejectReturnDto {
  rejectReason: string;
}

export const orderService = {
  async getOrderById(orderId: string): Promise<Order> {
    const { data } = await apiClient.get<{ data: Order }>(`/orders/${orderId}`);
    return data.data;
  },

  async checkReturnEligibility(orderId: string): Promise<ReturnEligibilityResponse> {
    const { data } = await apiClient.get<ReturnEligibilityResponse>(
      `/orders/${orderId}/return/eligibility`
    );
    return data;
  },

  async requestReturn(orderId: string, dto: RequestReturnDto) {
    const formData = new FormData();
    formData.append('returnReason', dto.returnReason);
    if (dto.note) {
      formData.append('note', dto.note);
    }
    if (dto.files && dto.files.length > 0) {
      dto.files.forEach((file) => formData.append('files', file));
    }

    const { data } = await apiClient.post(`/orders/${orderId}/return`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async supplementEvidence(orderId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const { data } = await apiClient.patch(`/orders/${orderId}/return/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  async approveReturn(orderId: string) {
    const { data } = await apiClient.post(`/orders/${orderId}/return/approve`);
    return data;
  },

  async rejectReturn(orderId: string, dto: RejectReturnDto) {
    const { data } = await apiClient.post(`/orders/${orderId}/return/reject`, dto);
    return data;
  },
};
