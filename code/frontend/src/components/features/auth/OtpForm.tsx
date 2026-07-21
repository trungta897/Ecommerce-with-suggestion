'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { otpSchema, OtpFormData } from '@/schemas';
import { BaseInput, BaseButton } from '@/components/base';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { UserRole } from '@/types';

export function OtpForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: OtpFormData) => {
    try {
      // Mock OTP verification
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (data.otp === '123456') {
        setAuth(
          {
            id: '1',
            email: 'user@example.com',
            role: UserRole.CUSTOMER,
            is_verified: true,
          },
          'mock-token-after-otp'
        );
        router.push('/');
      } else {
        throw new Error('Invalid OTP');
      }
    } catch {
      setError('root', { message: t('login_error') || 'OTP không hợp lệ' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1 relative">
          <label className="text-sm font-medium" htmlFor="otp">
            {t('otp')}
          </label>
          <BaseInput
            id="otp"
            type="text"
            placeholder="123456"
            maxLength={6}
            className="text-center tracking-[0.5em] text-lg"
            {...register('otp')}
            error={errors.otp?.message}
          />
        </div>
      </div>

      {errors.root && (
        <div className="text-sm font-medium text-destructive mt-2">{errors.root.message}</div>
      )}

      <BaseButton type="submit" className="w-full" isLoading={isSubmitting}>
        {t('otp_button')}
      </BaseButton>
    </form>
  );
}
