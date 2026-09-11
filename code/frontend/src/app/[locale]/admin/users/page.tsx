'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { BaseInput, BaseButton } from '@/components/base';
import { Search, Plus, Loader2 } from '@/components/base/icons';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { UserInviteModal } from '@/components/admin/users/UserInviteModal';
import { UserConfirmModal, ConfirmActionState } from '@/components/admin/users/UserConfirmModal';
import { userService } from '@/services/user-service';
import { User, UserRole } from '@/types';
import { ROLE_COLORS } from '@/constants';
import { useAuthStore } from '@/store';
import { useDebounce } from '@/hooks/use-debounce';

export default function AdminUsersPage() {
  const t = useTranslations('admin.users');
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Invite Form State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EMPLOYEE'>('EMPLOYEE');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Safe Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<ConfirmActionState | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchUsers = useCallback(
    async (p: number) => {
      try {
        setLoading(true);
        const res = await userService.getAllUsers(p, 15);
        setUsers(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
      } catch (error: unknown) {
        console.error(error);
        toast.error(t('permission_error'));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchUsers(page);
  }, [page, fetchUsers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingInvite(true);
      await userService.inviteStaff(inviteEmail.trim(), inviteName.trim(), inviteRole);
      toast.success(t('invite_success'));
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('EMPLOYEE');
      fetchUsers(page);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t('invite_error'));
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleExecuteConfirmedAction = async () => {
    if (!confirmModal) return;
    try {
      setSubmittingAction(true);
      if (confirmModal.type === 'toggle') {
        await userService.toggleActive(confirmModal.userId);
        toast.success(t('toggle_success'));
      } else if (confirmModal.type === 'role' && confirmModal.newRole) {
        await userService.changeRole(confirmModal.userId, confirmModal.newRole);
        toast.success(t('role_success'));
      }
      setConfirmModal(null);
      fetchUsers(page);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t('permission_error'));
    } finally {
      setSubmittingAction(false);
    }
  };

  // Action-level RBAC check: can current user manage this target user?
  const isActionDisabled = (targetUser: User): boolean => {
    if (targetUser.id === currentUser?.id) return true; // Cannot edit self
    if (targetUser.role === UserRole.SUPER_ADMIN) return true; // Super admin cannot be edited
    if (currentUser?.role === UserRole.ADMIN && targetUser.role === UserRole.ADMIN) {
      return true; // Admin cannot edit other Admins
    }
    return false;
  };

  const filteredUsers = useMemo(() => {
    if (!debouncedSearch.trim()) return users;
    const q = debouncedSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
    );
  }, [users, debouncedSearch]);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('title')}</h1>
          <p className="text-xs text-ink-2 mt-1">
            Tổng cộng {filteredUsers.length} người dùng hiển thị
          </p>
        </div>
        {(currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN) && (
          <BaseButton onClick={() => setShowInviteModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('invite_staff')}
          </BaseButton>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
          <BaseInput
            placeholder={t('searchPlaceholder')}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-rule overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-2 border-b border-rule bg-paper-2">
                <th className="px-5 py-3 font-medium">{t('name')}</th>
                <th className="px-5 py-3 font-medium">{t('email_phone')}</th>
                <th className="px-5 py-3 font-medium">{t('role')}</th>
                <th className="px-5 py-3 font-medium">{t('status')}</th>
                <th className="px-5 py-3 font-medium text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-ink-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                    <span>{t('loading')}</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-ink-2">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const disabled = isActionDisabled(user);
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-rule last:border-0 hover:bg-paper-2 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.fullName?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </div>
                          <span className="font-medium text-ink truncate max-w-[180px]">
                            {user.fullName || 'No Name'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-ink-2">
                        <div className="truncate max-w-[200px]">{user.email}</div>
                        {user.phone && <span className="text-xs text-ink-3">{user.phone}</span>}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer outline-none border transition-colors ${
                            ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'
                          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}`}
                          value={user.role}
                          onChange={(e) => {
                            setConfirmModal({
                              isOpen: true,
                              type: 'role',
                              userId: user.id,
                              userName: user.fullName || user.email,
                              newRole: e.target.value,
                            });
                          }}
                          disabled={disabled}
                        >
                          <option value={UserRole.CUSTOMER}>{t('customer')}</option>
                          <option value={UserRole.EMPLOYEE}>{t('employee')}</option>
                          {currentUser?.role === UserRole.SUPER_ADMIN && (
                            <option value={UserRole.ADMIN}>{t('admin')}</option>
                          )}
                          {user.role === UserRole.SUPER_ADMIN && (
                            <option value={UserRole.SUPER_ADMIN}>{t('superAdmin')}</option>
                          )}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            user.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.isActive !== false ? t('active') : t('banned')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              type: 'toggle',
                              userId: user.id,
                              userName: user.fullName || user.email,
                            });
                          }}
                          disabled={disabled}
                          className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {user.isActive !== false ? t('ban') : t('unban')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* Safe Confirmation Modal */}
      <UserConfirmModal
        state={confirmModal}
        onClose={() => setConfirmModal(null)}
        onConfirm={handleExecuteConfirmedAction}
        isSubmitting={submittingAction}
      />

      {/* Invite Modal */}
      <UserInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSubmit={handleInvite}
        name={inviteName}
        onNameChange={setInviteName}
        email={inviteEmail}
        onEmailChange={setInviteEmail}
        role={inviteRole}
        onRoleChange={setInviteRole}
        currentUserRole={currentUser?.role}
        isSubmitting={submittingInvite}
      />
    </div>
  );
}
