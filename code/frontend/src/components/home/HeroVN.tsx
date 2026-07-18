import React from 'react';
import { useTranslations } from 'next-intl';

export default function HeroVN() {
  const t = useTranslations('home.hero');

  return (
    <section className="w-full max-w-7xl mx-auto px-[var(--space-4)] py-[var(--space-6)]">
      {/* Bento Grid Layout for Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-4)] min-h-[480px]">
        
        {/* Main Large Banner (2/3 width) */}
        <div className="md:col-span-2 relative rounded-2xl overflow-hidden bg-[var(--color-paper-2)] border border-[var(--color-rule)] group">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-ink)]/80 to-transparent z-10 p-[var(--space-8)] flex flex-col justify-center">
            <h2 className="display-font text-5xl font-bold text-[var(--color-paper)] mb-[var(--space-2)] text-balance">
              {t('main_banner_title')}
            </h2>
            <p className="text-[var(--color-paper-2)] text-lg mb-[var(--space-6)] max-w-sm">
              {t('main_banner_subtitle')}
            </p>
            <div>
              <button className="bg-[var(--color-accent)] text-[var(--color-accent-ink)] px-[var(--space-6)] py-[var(--space-3)] rounded-full font-semibold hover:bg-[var(--color-focus)] transition-colors">
                {t('main_banner_cta')}
              </button>
            </div>
          </div>
          {/* Placeholder for image */}
          <div className="absolute inset-0 bg-[var(--color-paper-3)] transition-transform duration-700 group-hover:scale-105" />
          
          {/* AI Assistant Floating Button */}
          <button className="absolute bottom-[var(--space-4)] right-[var(--space-4)] z-20 bg-gradient-to-r from-[var(--color-ai-gradient-start)] to-[var(--color-ai-gradient-end)] text-white px-[var(--space-4)] py-[var(--space-2)] rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            {t('ai_assistant')}
          </button>
        </div>

        {/* Right Side Stacked Banners (1/3 width) */}
        <div className="flex flex-col gap-[var(--space-4)]">
          {/* Top Small Banner */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-[var(--color-paper-2)] border border-[var(--color-rule)] group p-[var(--space-5)] flex flex-col justify-end">
            <div className="relative z-10">
              <h3 className="display-font text-2xl font-bold text-[var(--color-ink)]">
                {t('sub_banner_1_title')}
              </h3>
              <p className="text-[var(--color-muted)]">{t('sub_banner_1_subtitle')}</p>
            </div>
            {/* Placeholder for image */}
            <div className="absolute inset-0 bg-[var(--color-paper-3)] opacity-50 transition-transform duration-700 group-hover:scale-105" />
          </div>

          {/* Bottom Small Banner */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-[var(--color-paper-2)] border border-[var(--color-rule)] group p-[var(--space-5)] flex flex-col justify-end">
            <div className="relative z-10">
              <h3 className="display-font text-2xl font-bold text-[var(--color-ink)]">
                {t('sub_banner_2_title')}
              </h3>
              <p className="text-[var(--color-muted)]">{t('sub_banner_2_subtitle')}</p>
            </div>
            {/* Placeholder for image */}
            <div className="absolute inset-0 bg-[var(--color-paper-3)] opacity-50 transition-transform duration-700 group-hover:scale-105" />
          </div>
        </div>

      </div>
    </section>
  );
}
