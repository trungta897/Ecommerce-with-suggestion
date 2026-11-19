import { z } from 'zod';

export const phoneLoginSchema = z.object({
  phone: z
    .string()
    .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, { message: 'Số điện thoại không hợp lệ' }),
});

export type PhoneLoginFormData = z.infer<typeof phoneLoginSchema>;

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email không hợp lệ' }),
  password: z.string().min(1, { message: 'Vui lòng nhập mật khẩu' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email({ message: 'Email không hợp lệ' }),
    password: z
      .string()
      .min(8, { message: 'Mật khẩu ít nhất 8 ký tự' })
      .regex(/[A-Z]/, { message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa' })
      .regex(/[0-9]/, { message: 'Mật khẩu phải chứa ít nhất 1 chữ số' })
      .regex(/[^A-Za-z0-9]/, { message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const otpSchema = z.object({
  otp: z.string().length(6, { message: 'Mã OTP phải gồm 6 chữ số' }),
});

export type OtpFormData = z.infer<typeof otpSchema>;
