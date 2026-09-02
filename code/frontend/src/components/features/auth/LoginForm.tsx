'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { phoneLoginSchema, PhoneLoginFormData, otpSchema, OtpFormData } from '@/schemas';
import { BaseInput, BaseButton } from '@/components/base';
import { authService } from '@/services/authService';
import { cartService } from '@/services/cart-service';
import { useAuthStore } from '@/store';
import { useCartStore } from '@/store/useCartStore';
import { useToast } from '@/providers/toast-provider';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const t = useTranslations('auth');
  const toast = useToast();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpSent, countdown]);

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

  const onPhoneSubmit = async (data: PhoneLoginFormData) => {
    try {
      await authService.requestPhoneOtp(data.phone);
      setPhoneNumber(data.phone);
      setOtpSent(true);
      setCountdown(60);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response?.status === 429) {
        setErrorPhone('root', {
          message: t('rate_limit_error'),
        });
      } else {
        setErrorPhone('root', {
          message: err.response?.data?.message || t('otp_send_error'),
        });
      }
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await authService.requestPhoneOtp(phoneNumber);
      toast.success(t('otp_resend_success'));
      setCountdown(60);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response?.status === 429) {
        toast.error(t('rate_limit_error'));
      } else {
        toast.error(err.response?.data?.message || t('otp_send_error'));
      }
    } finally {
      setIsResending(false);
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
      setErrorOtp('root', { message: err.response?.data?.message || t('otp_invalid') });
    }
  };

  return (
    <div className="space-y-6">
      {!otpSent ? (
        <form onSubmit={handleSubmitPhone(onPhoneSubmit)} className="space-y-6">
          <div className="space-y-1 relative">
            <label className="text-sm font-medium" htmlFor="phone">
              {t('phone_number')}
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
            {t('send_otp')}
          </BaseButton>
        </form>
      ) : (
        <form onSubmit={handleSubmitOtp(onOtpSubmit)} className="space-y-6">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">{t('otp_sent_to')}</p>
            <p className="font-semibold">{phoneNumber}</p>
            <button
              type="button"
              className="text-xs text-primary hover:underline mt-1"
              onClick={() => setOtpSent(false)}
            >
              {t('change_phone')}
            </button>
          </div>

          <div className="space-y-1 relative">
            <label className="text-sm font-medium" htmlFor="otp">
              {t('otp_label')}
            </label>
            <BaseInput
              id="otp"
              maxLength={6}
              placeholder="123456"
              {...registerOtp('otp')}
              error={errorsOtp.otp?.message}
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-muted-foreground">{t('resend_otp_prompt')}</span>
            <button
              type="button"
              disabled={countdown > 0 || isResending}
              onClick={handleResendOtp}
              className={`font-semibold transition-colors ${
                countdown > 0 || isResending
                  ? 'text-muted-foreground cursor-not-allowed'
                  : 'text-primary hover:underline'
              }`}
            >
              {countdown > 0 ? t('resend_otp_countdown', { seconds: countdown }) : t('resend_otp')}
            </button>
          </div>

          {errorsOtp.root && (
            <div className="text-sm font-medium text-destructive mt-2">
              {errorsOtp.root.message}
            </div>
          )}

          <BaseButton type="submit" className="w-full" isLoading={isSubmittingOtp}>
            {t('otp_button')}
          </BaseButton>
        </form>
      )}
    </div>
  );
}
