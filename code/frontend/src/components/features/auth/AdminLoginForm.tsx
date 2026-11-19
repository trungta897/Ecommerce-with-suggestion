'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { loginSchema, LoginFormData } from '@/schemas';
import { BaseInput, BaseButton } from '@/components/base';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';

export function AdminLoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail, isSubmitting: isSubmittingEmail },
    setError: setErrorEmail,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onEmailSubmit = async (data: LoginFormData) => {
    try {
      const response = await authService.login(data);
      const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'];
      if (!response.user?.role || !allowedRoles.includes(response.user.role)) {
        await authService.logout();
        throw new Error('UNAUTHORIZED_ROLE');
      }
      setAuth(response.user, response.accessToken);
      router.push('/admin'); // Redirect to admin dashboard
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED_ROLE') {
        setErrorEmail('root', { message: t('unauthorized_role') });
      } else {
        setErrorEmail('root', { message: t('login_error') });
      }
    }
  };

  return (
    <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1 relative">
          <label className="text-sm font-medium" htmlFor="email">
            {t('email')}
          </label>
          <BaseInput
            id="email"
            type="email"
            placeholder="admin@datn.com"
            {...registerEmail('email')}
            error={errorsEmail.email?.message}
          />
        </div>

        <div className="space-y-1 relative pt-2">
          <label className="text-sm font-medium" htmlFor="password">
            {t('password')}
          </label>
          <BaseInput
            id="password"
            type="password"
            placeholder="••••••••"
            {...registerEmail('password')}
            error={errorsEmail.password?.message}
          />
        </div>
      </div>

      {errorsEmail.root && (
        <div className="text-sm font-medium text-destructive mt-2">{errorsEmail.root.message}</div>
      )}

      <BaseButton type="submit" className="w-full" isLoading={isSubmittingEmail}>
        {t('admin_login_button')}
      </BaseButton>
    </form>
  );
}
