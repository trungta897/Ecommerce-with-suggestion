'use client';

import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { phoneLoginSchema, PhoneLoginFormData, otpSchema, OtpFormData } from '@/schemas';
import { BaseInput, BaseButton } from '@/components/base';
import { authService } from '@/services/authService';
import { cartService } from '@/services/cart-service';
import { useAuthStore } from '@/store';
import { useCartStore } from '@/store/useCartStore';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [otpSent, setOtpSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

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

  return (
    <div className="space-y-6">
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
    </div>
  );
}
