'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { BaseInput, BaseButton, BaseModal } from '@/components/base';
import { Loader2 } from '@/components/base/icons';
import { UserRole } from '@/types';

interface UserInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  name: string;
  onNameChange: (val: string) => void;
  email: string;
  onEmailChange: (val: string) => void;
  role: 'ADMIN' | 'EMPLOYEE';
  onRoleChange: (val: 'ADMIN' | 'EMPLOYEE') => void;
  currentUserRole?: UserRole;
  isSubmitting: boolean;
}

export const UserInviteModal: React.FC<UserInviteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  name,
  onNameChange,
  email,
  onEmailChange,
  role,
  onRoleChange,
  currentUserRole,
  isSubmitting,
}) => {
  const t = useTranslations('admin.users');

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t('invite_modal_title')}>
      <form onSubmit={onSubmit} className="space-y-4 py-2">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('name')} *</label>
          <BaseInput
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t('namePlaceholder')}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('email')} *</label>
          <BaseInput
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="staff@gmail.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('role')}</label>
          <select
            className="w-full px-3.5 py-2.5 border border-rule rounded-xl text-sm bg-white focus:outline-none focus:border-primary text-ink"
            value={role}
            onChange={(e) => onRoleChange(e.target.value as 'ADMIN' | 'EMPLOYEE')}
          >
            <option value="EMPLOYEE">{t('employee')}</option>
            {currentUserRole === UserRole.SUPER_ADMIN && (
              <option value="ADMIN">{t('admin')}</option>
            )}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-rule">
          <BaseButton variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>
            {t('cancel')}
          </BaseButton>
          <BaseButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('send_invite')}
              </>
            ) : (
              t('send_invite')
            )}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
};
