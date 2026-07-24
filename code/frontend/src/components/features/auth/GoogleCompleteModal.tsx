'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseInput, BaseButton } from '@/components/base';

const googleCompleteSchema = z.object({
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type GoogleCompleteData = z.infer<typeof googleCompleteSchema>;

interface Props {
  tempToken: string;
  email?: string;
  fullName?: string;
  onClose?: () => void;
}

export function GoogleCompleteModal({ tempToken, email, fullName, onClose }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<GoogleCompleteData>({
    resolver: zodResolver(googleCompleteSchema),
  });

  const onSubmit = async (data: GoogleCompleteData) => {
    try {
      // call authService.completeGoogleLogin({ tempToken, ...data })
      console.log('Complete registration:', tempToken, data);

      // const response = await authService.completeGoogleLogin({ tempToken, ...data });
      // setAuth(response.user, response.accessToken);
      // router.push('/');

      if (onClose) onClose();
    } catch {
      setError('root', { message: 'Đăng ký thất bại. Vui lòng thử lại.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background w-full max-w-md p-6 rounded-lg shadow-lg relative">
        <h2 className="text-xl font-semibold mb-4">Hoàn tất đăng ký</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Xin chào {fullName}, vui lòng cung cấp thêm mật khẩu để bảo vệ tài khoản {email} của bạn.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Mật khẩu *</label>
            <BaseInput type="password" {...register('password')} error={errors.password?.message} />
          </div>
          <div>
            <label className="text-sm font-medium">Số điện thoại</label>
            <BaseInput type="text" {...register('phone')} error={errors.phone?.message} />
          </div>
          <div>
            <label className="text-sm font-medium">Địa chỉ</label>
            <BaseInput type="text" {...register('address')} error={errors.address?.message} />
          </div>

          {errors.root && <div className="text-sm text-destructive">{errors.root.message}</div>}

          <div className="flex justify-end gap-2 mt-6">
            <BaseButton variant="outline" onClick={onClose} type="button">
              Hủy
            </BaseButton>
            <BaseButton type="submit" isLoading={isSubmitting}>
              Hoàn tất
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  );
}
