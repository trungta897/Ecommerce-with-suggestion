import { apiClient } from '../lib/api-client';

export interface CreateZaloPayOrderResponse {
  orderUrl: string;
  appTransId: string;
}

export const paymentService = {
  async createZaloPayOrder(orderId: string): Promise<CreateZaloPayOrderResponse> {
    const { data } = await apiClient.post<CreateZaloPayOrderResponse>(
      `/payment/zalopay/create/${orderId}`
    );
    return data;
  },
};
