'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { BaseButton, BaseInput } from '@/components/base';
import { apiClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

export default function SetStaffPasswordPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error(t('invalid_invite_token'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('password_mismatch'));
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/auth/set-password', {
        token,
        newPassword,
      });
      toast.success(t('set_password_success'));
      router.push(`/${locale}/admin/login`);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || t('invalid_invite_token'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-2 px-4">
      <div className="w-full max-w-md rounded-2xl border border-rule bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-ink mb-2">{t('set_password_title')}</h1>
        <p className="text-sm text-ink-2 mb-6">{t('set_password_subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">{t('password')}</label>
            <BaseInput
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">{t('confirm_password')}</label>
            <BaseInput
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <BaseButton type="submit" className="w-full mt-2" isLoading={submitting}>
            {t('set_password_button')}
          </BaseButton>
        </form>

        <p className="mt-6 text-center text-sm text-ink-2">
          <Link
            href={`/${locale}/admin/login`}
            className="text-primary hover:underline font-medium"
          >
            {t('back_to_login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
