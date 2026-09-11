'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { BaseButton, BaseModal } from '@/components/base';
import { Loader2 } from '@/components/base/icons';

export interface ConfirmActionState {
  isOpen: boolean;
  type: 'toggle' | 'role';
  userId: string;
  userName: string;
  newRole?: string;
}

interface UserConfirmModalProps {
  state: ConfirmActionState | null;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const UserConfirmModal: React.FC<UserConfirmModalProps> = ({
  state,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const t = useTranslations('admin.users');

  if (!state) return null;

  return (
    <BaseModal
      isOpen={state.isOpen}
      onClose={onClose}
      title={state.type === 'toggle' ? t('confirm_toggle_title') : t('confirm_role_title')}
    >
      <div className="space-y-4 py-2">
        <p className="text-sm text-ink-2">
          {state.type === 'toggle'
            ? t('confirm_toggle_desc')
            : t('confirm_role_desc', { role: state.newRole || '' })}
        </p>
        <div className="p-3 bg-paper-2 rounded-xl text-xs font-medium text-ink">
          {state.userName}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-rule">
          <BaseButton type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('cancel')}
          </BaseButton>
          <BaseButton type="button" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('confirm')}
              </>
            ) : (
              t('confirm')
            )}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  );
};
