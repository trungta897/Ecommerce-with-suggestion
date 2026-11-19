'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

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
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('subtitle')}</h2>
        <p className="text-gray-500 mb-8">{t('description')}</p>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-8 text-left bg-gray-100 p-4 rounded-lg overflow-auto text-sm border border-gray-200">
            <p className="font-semibold text-gray-700 mb-2">{t('error_detail')}</p>
            <p className="text-red-600 font-mono text-xs">{error.message || 'Unknown error'}</p>
            {error.digest && (
              <p className="text-gray-500 font-mono text-xs mt-1">Digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            {t('retry')}
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            {t('back_home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
