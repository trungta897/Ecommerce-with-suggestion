'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { BaseInput, BaseButton } from '@/components/base';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const [isSuccess, setIsSuccess] = React.useState(false);

  const forgotPasswordSchema = React.useMemo(
    () =>
      z.object({
        email: z.string().email({ message: t('email_invalid') }),
      }),
    [t]
  );

  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async () => {
    // Mock sending reset link
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-600 bg-green-50 p-4 rounded-lg">
          {t('forgot_password_success')}
        </div>
      </div>
    );
  }

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
      </div>

      <BaseButton type="submit" className="w-full" isLoading={isSubmitting}>
        {t('send_link_button')}
      </BaseButton>
    </form>
  );
}
