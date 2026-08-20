'use client';

import { useTranslations } from 'next-intl';
import { BaseInput, BaseButton, BaseModal } from '@/components/base';
import { Search } from '@/components/base/icons';
import { useState, useEffect } from 'react';
import { userService } from '@/services/user-service';
import { UserRole } from '@/types';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const t = useTranslations('admin.users');
  const { user: currentUser } = useAuthStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [page, setPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [totalPages, setTotalPages] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EMPLOYEE'>('EMPLOYEE');

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const fetchUsers = async (p: number) => {
    try {
      setLoading(true);
      const res = await userService.getAllUsers(p, 20);
      setUsers(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.inviteStaff(inviteEmail, inviteName, inviteRole);
      toast.success('Đã gửi lời mời thành công');
      setShowInviteModal(false);
      fetchUsers(page);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi gửi lời mời');
    }
  };

  const handleToggleActive = async (id: string) => {
    if (!confirm('Bạn có chắc muốn thực hiện thao tác này?')) return;
    try {
      await userService.toggleActive(id);
      toast.success('Cập nhật trạng thái thành công');
      fetchUsers(page);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi phân quyền');
    }
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    if (!confirm(`Xác nhận đổi vai trò thành ${newRole}?`)) return;
    try {
      await userService.changeRole(id, newRole);
      toast.success('Cập nhật vai trò thành công');
      fetchUsers(page);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi phân quyền');
    }
  };

  const roleColors: Record<string, string> = {
    CUSTOMER: 'bg-blue-100 text-blue-800',
    EMPLOYEE: 'bg-green-100 text-green-800',
    ADMIN: 'bg-purple-100 text-purple-800',
    SUPER_ADMIN: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-ink">{t('title')}</h1>
        {(currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN) && (
          <BaseButton onClick={() => setShowInviteModal(true)}>Mời nhân viên</BaseButton>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
          <BaseInput placeholder={t('searchPlaceholder')} className="pl-10" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-rule overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-2 border-b border-rule bg-paper-2">
                <th className="px-5 py-3 font-medium">{t('name')}</th>
                <th className="px-5 py-3 font-medium">Email / SĐT</th>
                <th className="px-5 py-3 font-medium">{t('role')}</th>
                <th className="px-5 py-3 font-medium">{t('status')}</th>
                <th className="px-5 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-rule last:border-0 hover:bg-paper-2 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-red-400 flex items-center justify-center text-white text-xs font-bold">
                          {user.fullName?.charAt(0) || 'U'}
                        </div>
                        <span className="font-medium text-ink">{user.fullName || 'No Name'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-2">
                      {user.email} <br />
                      <span className="text-xs text-muted-foreground">{user.phone}</span>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer outline-none border ${roleColors[user.role] || 'bg-gray-100'}`}
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        disabled={
                          user.id === currentUser?.id ||
                          (currentUser?.role === UserRole.ADMIN &&
                            (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN))
                        }
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="EMPLOYEE">Employee</option>
                        <option value="ADMIN">Admin</option>
                        {user.role === UserRole.SUPER_ADMIN && (
                          <option value="SUPER_ADMIN">Super Admin</option>
                        )}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        disabled={
                          user.id === currentUser?.id ||
                          (currentUser?.role === UserRole.ADMIN &&
                            (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN))
                        }
                        className="text-xs text-red-500 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {user.isActive ? 'Khóa' : 'Mở khóa'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BaseModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Mời nhân viên"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Họ và Tên</label>
            <BaseInput
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <BaseInput
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Vai trò</label>
            <select
              className="w-full border rounded-md p-2"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'EMPLOYEE')}
            >
              <option value="EMPLOYEE">Employee</option>
              {currentUser?.role === UserRole.SUPER_ADMIN && <option value="ADMIN">Admin</option>}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <BaseButton variant="outline" onClick={() => setShowInviteModal(false)} type="button">
              Hủy
            </BaseButton>
            <BaseButton type="submit">Gửi lời mời</BaseButton>
          </div>
        </form>
      </BaseModal>
    </div>
  );
}
