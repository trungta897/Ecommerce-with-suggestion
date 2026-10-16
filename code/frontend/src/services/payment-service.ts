import { apiClient } from '../lib/api-client';

export interface CreatePaymentOrderResponse {
  orderUrl: string;
}

export const paymentService = {
  async createVnPayOrder(orderId: string, phone?: string): Promise<CreatePaymentOrderResponse> {
    const { data } = await apiClient.post<CreatePaymentOrderResponse>(
      `/payment/vnpay/create/${orderId}`,
      phone ? { phone } : {}
    );
    return data;
  },
};
