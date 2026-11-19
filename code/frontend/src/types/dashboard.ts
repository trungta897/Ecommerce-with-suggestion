export interface RecentOrder {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  } | null;
}

export interface DashboardStats {
  revenue: number | null;
  totalOrders: number;
  totalUsers: number | null;
  totalProducts: number;
  orderStatusCounts: Record<string, number>;
  recentOrders: RecentOrder[];
}
