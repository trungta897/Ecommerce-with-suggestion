'use client';

import { useTranslations } from 'next-intl';
import { BaseInput, BaseButton } from '@/components/base';
import { Search, Plus, Edit, Eye, EyeOff } from '@/components/base/icons';
import { useEffect, useState } from 'react';
import { voucherService } from '@/services/voucher-service';

export default function AdminVouchersPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const t = useTranslations('admin');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingVoucher, setEditingVoucher] = useState<any>(null);

  // Form state
  const [code, setCode] = useState('');
  const [type, setType] = useState('PERCENTAGE');
  const [value, setValue] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchVouchers(1);
  }, []);

  const fetchVouchers = async (p: number) => {
    try {
      setLoading(true);
      const res = await voucherService.getAdminVouchers(p, 10);
      setVouchers(res.data);
      setTotalPages(res.meta.totalPages);
      setPage(p);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
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
    } catch (err) {
      console.error('Failed to toggle voucher status', err);
    }
  };

  const openCreateModal = () => {
    setEditingVoucher(null);
    setCode('');
    setType('PERCENTAGE');
    setValue(0);
    setMaxDiscount('');
    setMinOrderValue(0);
    setUsageLimit('');
    setUsageLimitPerUser('');
    setStartDate('');
    setEndDate('');
    setShowModal(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEditModal = (voucher: any) => {
    setEditingVoucher(voucher);
    setCode(voucher.code);
    setType(voucher.type);
    setValue(voucher.value);
    setMaxDiscount(voucher.maxDiscount || '');
    setMinOrderValue(voucher.minOrderValue || 0);
    setUsageLimit(voucher.usageLimit || '');
    setUsageLimitPerUser(voucher.usageLimitPerUser || '');
    setStartDate(voucher.startDate ? new Date(voucher.startDate).toISOString().slice(0, 16) : '');
    setEndDate(voucher.endDate ? new Date(voucher.endDate).toISOString().slice(0, 16) : '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        code,
        type,
        value: Number(value),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        minOrderValue: Number(minOrderValue),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        usageLimitPerUser: usageLimitPerUser ? Number(usageLimitPerUser) : null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      };

      if (editingVoucher) {
        await voucherService.updateVoucher(editingVoucher.id, data);
      } else {
        await voucherService.createVoucher(data);
      }
      setShowModal(false);
      fetchVouchers(page);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Failed to save voucher', err);
      alert(err.response?.data?.message || 'Lỗi khi lưu voucher');
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
                        : `${voucher.value.toLocaleString('vi-VN')}đ`}
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
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${voucher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {voucher.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-5 py-3 flex gap-2">
                      <button
                        onClick={() => openEditModal(voucher)}
                        className="p-1.5 hover:bg-gray-200 rounded"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleToggle(voucher.id)}
                        className="p-1.5 hover:bg-gray-200 rounded"
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingVoucher ? 'Sửa Voucher' : 'Thêm Voucher Mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mã Voucher</label>
                  <BaseInput value={code} onChange={(e) => setCode(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Loại</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="PERCENTAGE">Phần trăm</option>
                    <option value="FIXED_AMOUNT">Số tiền</option>
                    <option value="FREE_SHIPPING">Miễn phí VC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá trị</label>
                  <BaseInput
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giảm tối đa (VNĐ)</label>
                  <BaseInput
                    type="number"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn tối thiểu (VNĐ)</label>
                  <BaseInput
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giới hạn số lần dùng chung
                  </label>
                  <BaseInput
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giới hạn số lần dùng/User (Phone)
                  </label>
                  <BaseInput
                    type="number"
                    value={usageLimitPerUser}
                    onChange={(e) =>
                      setUsageLimitPerUser(e.target.value ? Number(e.target.value) : '')
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <BaseInput
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                  <BaseInput
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <BaseButton type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Hủy
                </BaseButton>
                <BaseButton type="submit">Lưu</BaseButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
