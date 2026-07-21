'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { registerSchema, RegisterFormData } from '@/schemas';
import { BaseInput, BaseButton } from '@/components/base';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';

export function RegisterForm() {
  const t = useTranslations('auth');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authService.register(data);
      // Giả lập redirect tới trang OTP hoặc login
      router.push('/login?registered=true');
    } catch {
      setError('root', { message: t('register_error') || 'Đăng ký thất bại' });
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

        <div className="space-y-1 relative pt-2">
          <label className="text-sm font-medium" htmlFor="confirmPassword">
            {t('confirm_password')}
          </label>
          <BaseInput
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </div>
      </div>

      {errors.root && (
        <div className="text-sm font-medium text-destructive mt-2">{errors.root.message}</div>
      )}

      <BaseButton type="submit" className="w-full" isLoading={isSubmitting}>
        {t('register_button')}
      </BaseButton>
    </form>
  );
}
