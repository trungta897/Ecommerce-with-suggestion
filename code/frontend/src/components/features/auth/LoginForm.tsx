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

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await authService.login(data);
      setAuth(response.user, response.accessToken);
      // Redirect to home or intended page
      router.push('/');
    } catch {
      setError('root', { message: t('login_error') || 'Đăng nhập thất bại' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1 relative">
          <label className="text-sm font-medium" htmlFor="email">
            {t('email')}
          </label>
          <BaseInput
            id="email"
            type="email"
            placeholder="example@gmail.com"
            {...register('email')}
            error={errors.email?.message}
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
            {...register('password')}
            error={errors.password?.message}
          />
        </div>
      </div>

      {errors.root && (
        <div className="text-sm font-medium text-destructive mt-2">{errors.root.message}</div>
      )}

      <BaseButton type="submit" className="w-full" isLoading={isSubmitting}>
        {t('login_button')}
      </BaseButton>
    </form>
  );
}
