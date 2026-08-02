'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function LocaleNotFound() {
  const t = useTranslations('error.404');

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-xl">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
          <span className="text-2xl font-bold text-rose-500">404</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">{t('subtitle')}</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">{t('description')}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 transition shadow-lg duration-200"
        >
          {t('back_home')}
        </Link>
      </div>
    </div>
  );
}
