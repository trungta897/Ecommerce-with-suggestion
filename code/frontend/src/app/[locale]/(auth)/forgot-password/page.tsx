import { useTranslations } from 'next-intl';
import { ForgotPasswordForm } from '@/components/features/auth/ForgotPasswordForm';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block w-1/2 bg-paper-2">
        {/* Placeholder for Left Side Graphic */}
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6">
          <h1 className="text-2xl font-bold mb-2">{t('forgot_password_title')}</h1>
          <p className="text-sm text-muted-foreground mb-6">{t('forgot_password_description')}</p>
          <ForgotPasswordForm />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              {t('back_to_login') || 'Quay lại Đăng nhập'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
