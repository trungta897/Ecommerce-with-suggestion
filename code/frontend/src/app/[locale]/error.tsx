'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('error.500');

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-9xl font-black text-slate-200">500</h1>
      <h2 className="text-2xl font-bold mt-4 mb-2">{t('subtitle')}</h2>
      <p className="text-slate-500 mb-8 max-w-md">{t('description')}</p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
      >
        {t('retry')}
      </button>
    </div>
  );
}
