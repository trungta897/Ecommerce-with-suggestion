import { useTranslations } from 'next-intl';
import { OtpForm } from '@/components/features/auth/OtpForm';

export default function OtpPage() {
  const t = useTranslations('auth');
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block w-1/2 bg-paper-2">
        {/* Placeholder for Left Side Graphic */}
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6">
          <h1 className="text-2xl font-bold mb-2">{t('otp_title')}</h1>
          <p className="text-sm text-muted-foreground mb-6">{t('otp_description')}</p>
          <OtpForm />
        </div>
      </div>
    </div>
  );
}
