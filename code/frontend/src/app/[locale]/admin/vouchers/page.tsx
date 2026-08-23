'use client';

import { BaseInput, BaseButton } from '@/components/base';
import { Search, Plus, Edit, Eye, EyeOff } from '@/components/base/icons';
import { useEffect, useState } from 'react';
import { voucherService } from '@/services/voucher-service';
import { VoucherItem, VoucherType } from '@/types/voucher';
import { VoucherFormModal } from '@/components/admin/vouchers/VoucherFormModal';

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);

  useEffect(() => {
    fetchVouchers(1);
  }, []);

  const fetchVouchers = async (p: number) => {
    try {
      setLoading(true);
      const res = await voucherService.getAdminVouchers(p, 10);
      setVouchers(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setPage(p);
    } catch (err: unknown) {
      console.error('Failed to load vouchers', err);
      setError('Lỗi khi tải danh sách Voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await voucherService.toggleVoucherStatus(id);
      fetchVouchers(page);
    } catch (err: unknown) {
      console.error('Failed to toggle voucher status', err);
    }
  };

  const openCreateModal = () => {
    setEditingVoucher(null);
    setShowModal(true);
  };

  const openEditModal = (voucher: VoucherItem) => {
    setEditingVoucher(voucher);
    setShowModal(true);
  };

  const handleSaveVoucher = async (data: {
    code: string;
    type: VoucherType;
    value: number;
    maxDiscount: number | null;
    minOrderValue: number;
    usageLimit: number | null;
    startDate: string | null;
    endDate: string | null;
  }) => {
    try {
      if (editingVoucher) {
        await voucherService.updateVoucher(editingVoucher.id, data);
      } else {
        await voucherService.createVoucher(data);
      }
      fetchVouchers(page);
    } catch (err: unknown) {
      console.error('Failed to save voucher', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Lỗi khi lưu voucher';
      alert(msg);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-ink">Quản lý Voucher</h1>
        <BaseButton onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tạo Voucher
        </BaseButton>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
          <BaseInput placeholder="Tìm kiếm voucher..." className="pl-10" />
        </div>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="bg-white rounded-xl border border-rule overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-2 border-b border-rule bg-paper-2">
                <th className="px-5 py-3 font-medium">Mã</th>
                <th className="px-5 py-3 font-medium">Loại</th>
                <th className="px-5 py-3 font-medium">Giá trị</th>
                <th className="px-5 py-3 font-medium">Hạn sử dụng</th>
                <th className="px-5 py-3 font-medium">Lượt sử dụng</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    Đang tải...
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    Không có voucher nào
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => (
                  <tr key={voucher.id} className="border-b border-rule hover:bg-paper-2">
                    <td className="px-5 py-3 font-semibold text-primary">{voucher.code}</td>
                    <td className="px-5 py-3">
                      {voucher.type === 'PERCENTAGE'
                        ? 'Phần trăm'
                        : voucher.type === 'FIXED_AMOUNT'
                          ? 'Số tiền'
                          : 'Miễn phí VC'}
                    </td>
                    <td className="px-5 py-3">
                      {voucher.type === 'PERCENTAGE'
                        ? `${voucher.value}%`
                        : `${Number(voucher.value).toLocaleString('vi-VN')}đ`}
                    </td>
                    <td className="px-5 py-3">
                      {voucher.endDate
                        ? new Date(voucher.endDate).toLocaleDateString('vi-VN')
                        : 'Không giới hạn'}
                    </td>
                    <td className="px-5 py-3">
                      {voucher.usedCount} / {voucher.usageLimit || '∞'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          voucher.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {voucher.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-5 py-3 flex gap-2">
                      <button
                        onClick={() => openEditModal(voucher)}
                        className="p-1.5 hover:bg-gray-200 rounded"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleToggle(voucher.id)}
                        className="p-1.5 hover:bg-gray-200 rounded"
                        title={voucher.isActive ? 'Khóa voucher' : 'Mở khóa'}
                      >
                        {voucher.isActive ? (
                          <EyeOff className="w-4 h-4 text-orange-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-green-600" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => fetchVouchers(page - 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Trước
          </button>
          <span className="px-4 py-2">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => fetchVouchers(page + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}

      <VoucherFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSaveVoucher}
        editingVoucher={editingVoucher}
      />
    </div>
  );
}
