import { useTranslations } from 'next-intl';
import { LoginForm } from '@/components/features/auth/LoginForm';

export default function LoginPage() {
  const t = useTranslations('auth');
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block w-1/2 bg-paper-2">
        {/* Placeholder for Left Side Graphic */}
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6">
          <h1 className="text-2xl font-bold mb-6">{t('login')}</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
