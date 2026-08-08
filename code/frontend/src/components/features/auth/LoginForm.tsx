'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { loginSchema, LoginFormData } from '@/schemas';
import { BaseInput, BaseButton } from '@/components/base';
import { authService } from '@/services/authService';
import { cartService } from '@/services/cart-service';
import { useAuthStore } from '@/store';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

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

      const localItems = useCartStore.getState().items;
      if (localItems.length > 0) {
        useCartStore.getState().setMerging(true);
        try {
          await cartService.mergeCart({
            items: localItems.map((i) => ({ productId: i.product_id, quantity: i.quantity })),
          });
          useCartStore.getState().clearCart();
        } catch (error) {
          console.error('Merge cart failed', error);
        } finally {
          useCartStore.getState().setMerging(false);
        }
      }

      router.push('/');
    } catch {
      setError('root', { message: t('login_error') || 'Đăng nhập thất bại' });
    }
  };

  const onGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) throw new Error('No credential');
      // In real implementation:
      // const response = await authService.loginWithGoogle(credentialResponse.credential);
      // if (response.action === 'REQUIRE_PASSWORD') {
      //   router.push(`/auth/google-complete?token=${response.tempToken}`);
      //   return;
      // }
      // setAuth(response.user, response.accessToken);
      // router.push('/');
      console.log('Google credential:', credentialResponse.credential);
    } catch {
      setError('root', { message: t('login_error') || 'Đăng nhập Google thất bại' });
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

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t('or_continue_with') || 'Hoặc tiếp tục với'}
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={onGoogleSuccess}
          onError={() =>
            setError('root', { message: t('login_error') || 'Đăng nhập Google thất bại' })
          }
        />
      </div>
    </form>
  );
}
