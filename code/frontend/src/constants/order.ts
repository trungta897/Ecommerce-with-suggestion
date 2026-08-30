export const RETURN_MAX_EVIDENCE_FILES = 5;
export const RETURN_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PENDING_PAYMENT: 'bg-orange-100 text-orange-800 border-orange-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  HANDED_OVER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERING: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  RETURN_REQUESTED: 'bg-purple-100 text-purple-800 border-purple-200',
  RETURN_REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
  RETURNED: 'bg-gray-100 text-gray-800 border-gray-200',
  REFUNDED: 'bg-teal-100 text-teal-800 border-teal-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  // Lowercase aliases for resilience
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_payment: 'bg-orange-100 text-orange-800 border-orange-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  handed_over: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivering: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  return_requested: 'bg-purple-100 text-purple-800 border-purple-200',
  return_rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  returned: 'bg-gray-100 text-gray-800 border-gray-200',
  refunded: 'bg-teal-100 text-teal-800 border-teal-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export const DELIVERY_PARTNERS = [
  { id: 'GHTK', name: 'Giao Hàng Tiết Kiệm (GHTK)' },
  { id: 'GHN', name: 'Giao Hàng Nhanh (GHN)' },
  { id: 'VIETTEL_POST', name: 'Viettel Post' },
  { id: 'VNPOST', name: 'VNPost / Bưu điện Việt Nam' },
  { id: 'INTERNAL_SHIPPER', name: 'Shipper Nội bộ' },
];

export const ORDER_TABS = [
  { key: 'ALL', labelKey: 'allOrders', status: undefined },
  { key: 'PENDING', labelKey: 'pending', status: 'PENDING' },
  { key: 'CONFIRMED', labelKey: 'confirmed', status: 'CONFIRMED' },
  { key: 'DELIVERING', labelKey: 'delivering', status: 'DELIVERING' },
  { key: 'COMPLETED', labelKey: 'completed', status: 'COMPLETED' },
  { key: 'CANCELLED', labelKey: 'cancelled', status: 'CANCELLED' },
] as const;
