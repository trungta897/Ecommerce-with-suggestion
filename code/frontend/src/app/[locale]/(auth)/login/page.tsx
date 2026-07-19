import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('auth');
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block w-1/2 bg-paper-2">
        {/* Placeholder for Left Side Graphic */}
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6">
          <h1 className="text-2xl font-bold mb-4">{t('login')}</h1>
          {/* LoginForm Component will go here */}
        </div>
      </div>
    </div>
  );
}
