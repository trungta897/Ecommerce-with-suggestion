import { useTranslations } from 'next-intl';
import { RegisterForm } from '@/components/features/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  const t = useTranslations('auth');
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block w-1/2 bg-paper-2">
        {/* Placeholder for Left Side Graphic */}
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6">
          <h1 className="text-2xl font-bold mb-6">{t('register')}</h1>
          <RegisterForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('has_account')}{' '}
            <Link href="/login" className="text-primary hover:underline">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
