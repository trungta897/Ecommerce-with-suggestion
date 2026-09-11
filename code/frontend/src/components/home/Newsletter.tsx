'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, CheckCircle2 } from '@/components/base/icons';
import { useToast } from '@/providers/toast-provider';

export function Newsletter() {
  const t = useTranslations('home.newsletter');
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error(t('invalid_email'));
      return;
    }

    setIsSubmitting(true);
    // Cosmetic client-side mock submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setEmail('');
      toast.success(t('subscribe_success_desc'), t('subscribe_success'));
      setTimeout(() => setIsSuccess(false), 5000);
    }, 400);
  };

  return (
    <section className="overflow-hidden mb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-ink py-16 px-6 sm:px-12 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-lg">
          {/* Decorative shapes */}
          <div className="absolute -z-10 top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute top-[-50%] left-[-10%] w-[80%] h-[150%] rounded-full bg-primary blur-[120px]" />
            <div className="absolute bottom-[-50%] right-[-10%] w-[60%] h-[150%] rounded-full bg-ai-start blur-[120px]" />
          </div>

          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
              {t('title')}
            </h2>
            <p className="text-lg leading-8 text-paper-2/90">{t('desc')}</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-4">
            <label htmlFor="email-address" className="sr-only">
              {t('placeholder')}
            </label>
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-white/60" aria-hidden="true" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full min-w-0 flex-auto rounded-xl border-0 bg-white/10 px-10 py-3.5 text-white shadow-sm ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 placeholder:text-white/50"
                placeholder={t('placeholder')}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-none rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all active:scale-95 disabled:opacity-75 flex items-center justify-center gap-2"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('subscribe_success')}</span>
                </>
              ) : (
                t('subscribe')
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
