'use client';

import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  loginSchema,
  LoginFormData,
  phoneLoginSchema,
  PhoneLoginFormData,
  otpSchema,
  OtpFormData,
} from '@/schemas';
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

  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail, isSubmitting: isSubmittingEmail },
    setError: setErrorEmail,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Phone form
  const {
    register: registerPhone,
    handleSubmit: handleSubmitPhone,
    formState: { errors: errorsPhone, isSubmitting: isSubmittingPhone },
    setError: setErrorPhone,
  } = useForm<PhoneLoginFormData>({
    resolver: zodResolver(phoneLoginSchema),
  });

  // OTP form
  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: errorsOtp, isSubmitting: isSubmittingOtp },
    setError: setErrorOtp,
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const handleMergeCart = async () => {
    const localItems = useCartStore.getState().items;
    if (localItems.length > 0) {
      useCartStore.getState().setMerging(true);
      try {
        await cartService.mergeCart({
          items: localItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        });
        useCartStore.getState().clearCart();
      } catch (error) {
        console.error('Merge cart failed', error);
      } finally {
        useCartStore.getState().setMerging(false);
      }
    }
  };

  const onEmailSubmit = async (data: LoginFormData) => {
    try {
      const response = await authService.login(data);
      setAuth(response.user, response.accessToken);
      await handleMergeCart();
      router.push('/');
    } catch {
      setErrorEmail('root', { message: t('login_error') || 'Đăng nhập thất bại' });
    }
  };

  const onPhoneSubmit = async (data: PhoneLoginFormData) => {
    try {
      await authService.requestPhoneOtp(data.phone);
      setPhoneNumber(data.phone);
      setOtpSent(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorPhone('root', {
        message: err.response?.data?.message || 'Có lỗi xảy ra khi gửi OTP',
      });
    }
  };

  const onOtpSubmit = async (data: OtpFormData) => {
    try {
      const response = await authService.verifyPhoneOtp(phoneNumber, data.otp);
      setAuth(response.user, response.accessToken);
      await handleMergeCart();
      router.push('/');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorOtp('root', { message: err.response?.data?.message || 'OTP không hợp lệ' });
    }
  };

  const onGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) throw new Error('No credential');
      console.log('Google credential:', credentialResponse.credential);
    } catch {
      setErrorEmail('root', { message: t('login_error') || 'Đăng nhập Google thất bại' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toggle Method */}
      {!otpSent && (
        <div className="flex border rounded-lg overflow-hidden p-1 bg-muted/20">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              loginMethod === 'phone'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setLoginMethod('phone')}
          >
            SĐT (Khách hàng)
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              loginMethod === 'email'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setLoginMethod('email')}
          >
            Email (Quản trị)
          </button>
        </div>
      )}

      {/* Phone Flow */}
      {loginMethod === 'phone' && (
        <>
          {!otpSent ? (
            <form onSubmit={handleSubmitPhone(onPhoneSubmit)} className="space-y-6">
              <div className="space-y-1 relative">
                <label className="text-sm font-medium" htmlFor="phone">
                  Số điện thoại
                </label>
                <BaseInput
                  id="phone"
                  placeholder="0912345678"
                  {...registerPhone('phone')}
                  error={errorsPhone.phone?.message}
                />
              </div>

              {errorsPhone.root && (
                <div className="text-sm font-medium text-destructive mt-2">
                  {errorsPhone.root.message}
                </div>
              )}

              <BaseButton type="submit" className="w-full" isLoading={isSubmittingPhone}>
                Gửi mã OTP
              </BaseButton>
            </form>
          ) : (
            <form onSubmit={handleSubmitOtp(onOtpSubmit)} className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">Mã OTP đã được gửi đến</p>
                <p className="font-semibold">{phoneNumber}</p>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline mt-1"
                  onClick={() => setOtpSent(false)}
                >
                  Thay đổi số điện thoại
                </button>
              </div>

              <div className="space-y-1 relative">
                <label className="text-sm font-medium" htmlFor="otp">
                  Mã OTP (6 chữ số)
                </label>
                <BaseInput
                  id="otp"
                  maxLength={6}
                  placeholder="123456"
                  {...registerOtp('otp')}
                  error={errorsOtp.otp?.message}
                />
              </div>

              {errorsOtp.root && (
                <div className="text-sm font-medium text-destructive mt-2">
                  {errorsOtp.root.message}
                </div>
              )}

              <BaseButton type="submit" className="w-full" isLoading={isSubmittingOtp}>
                Xác nhận
              </BaseButton>
            </form>
          )}
        </>
      )}

      {/* Email Flow */}
      {loginMethod === 'email' && (
        <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1 relative">
              <label className="text-sm font-medium" htmlFor="email">
                {t('email')}
              </label>
              <BaseInput
                id="email"
                type="email"
                placeholder="example@gmail.com"
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
            <div className="text-sm font-medium text-destructive mt-2">
              {errorsEmail.root.message}
            </div>
          )}

          <BaseButton type="submit" className="w-full" isLoading={isSubmittingEmail}>
            {t('login_button')}
          </BaseButton>
        </form>
      )}

      {/* Google Login (Optional) */}
      {!otpSent && (
        <>
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
                setErrorEmail('root', { message: t('login_error') || 'Đăng nhập Google thất bại' })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
