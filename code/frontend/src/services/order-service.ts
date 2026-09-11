import { apiClient } from '@/lib/api-client';
import { Order, OrderStatus } from '@/types/order';
import { getOrCreateSessionId } from '@/utils/session';

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

export interface CreateOrderDto {
  shippingName: string;
  shippingAddress: string;
  shippingPhone: string;
  deliveryMethod?: string;
  paymentMethod: string;
  voucherId?: string;
  email?: string;
  items?: { productId: string; quantity: number }[];
  sessionId?: string;
}

export interface GuestOrderLookupResponse extends Order {
  trackingToken?: string;
}

export interface OrdersListResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const orderService = {
  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const payload = {
      ...dto,
      sessionId: dto.sessionId || getOrCreateSessionId(),
    };
    const { data } = await apiClient.post<Order | { data: Order }>('/orders', payload);
    return ((data as { data?: Order })?.data || data) as Order;
  },

  async createGuestOrder(dto: CreateOrderDto): Promise<Order> {
    const payload = {
      ...dto,
      sessionId: dto.sessionId || getOrCreateSessionId(),
    };
    const { data } = await apiClient.post<Order | { data: Order }>('/orders/guest', payload);
    return ((data as { data?: Order })?.data || data) as Order;
  },

  async payAgain(orderId: string): Promise<Order> {
    const { data } = await apiClient.post<Order | { data: Order }>(`/orders/${orderId}/pay-again`);
    return ((data as { data?: Order })?.data || data) as Order;
  },

  async payAgainGuest(orderId: string, phone: string): Promise<Order> {
    const { data } = await apiClient.post<Order | { data: Order }>(
      `/orders/guest/${orderId}/pay-again`,
      {
        phone,
      }
    );
    return ((data as { data?: Order })?.data || data) as Order;
  },

  async getMyOrders(page = 1, limit = 10): Promise<OrdersListResponse> {
    const { data } = await apiClient.get<OrdersListResponse>('/orders/my', {
      params: { page, limit },
    });
    return data;
  },

  async getOrderById(orderId: string): Promise<Order> {
    const { data } = await apiClient.get<Order | { data: Order }>(`/orders/${orderId}`);
    return ((data as { data?: Order })?.data || data) as Order;
  },

  async cancelOrder(orderId: string): Promise<Order> {
    const { data } = await apiClient.post<Order | { data: Order }>(`/orders/${orderId}/cancel`);
    return ((data as { data?: Order })?.data || data) as Order;
  },

  async getGuestOrderById(orderId: string, phone: string): Promise<GuestOrderLookupResponse> {
    const { data } = await apiClient.get<GuestOrderLookupResponse>(`/orders/guest/${orderId}`, {
      params: { phone },
    });
    return data;
  },

  async getAdminOrders(page = 1, limit = 10, status?: string): Promise<OrdersListResponse> {
    const { data } = await apiClient.get<OrdersListResponse>('/orders/admin', {
      params: { page, limit, status: status || undefined },
    });
    return data;
  },

  async updateOrderStatus(
    orderId: string,
    status: string,
    trackingData?: { deliveryPartner?: string; trackingId?: string }
  ): Promise<Order> {
    const payload = {
      status,
      ...trackingData,
    };
    const { data } = await apiClient.patch<Order | { data: Order }>(
      `/orders/${orderId}/status`,
      payload
    );
    return ((data as { data?: Order })?.data || data) as Order;
  },

  async recordManualShipping(
    orderId: string,
    dto: { carrier?: string; trackingCode?: string; status: OrderStatus | string }
  ): Promise<Order> {
    return this.updateOrderStatus(orderId, dto.status, {
      deliveryPartner: dto.carrier,
      trackingId: dto.trackingCode,
    });
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
