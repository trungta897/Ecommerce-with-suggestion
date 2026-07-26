'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function LocaleNotFound() {
  const t = useTranslations('common.notFound');

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-8 rounded-2xl shadow-xl">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
          <span className="text-2xl font-bold text-rose-500">404</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{t('title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
          {t('description')}
        </p>
        <Link
          href="/vi"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-lg duration-200"
        >
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
