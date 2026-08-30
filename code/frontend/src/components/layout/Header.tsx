'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ShoppingCart, User, Menu, Sparkles } from '@/components/base/icons';
import { useCart } from '@/hooks/use-cart';
import { useAuthStore } from '@/store';
import { HEADER_SUGGESTED_KEYWORDS } from '@/constants';

export function Header() {
  const t = useTranslations('common.header');
  const tCommon = useTranslations('common');
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <header className="w-full bg-white border-b border-rule">
      {/* Top Banner */}
      <div className="bg-primary py-2.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-primary-foreground">{t('promo_text')}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-primary-foreground">Hotline: 1900 6868</span>
            <span className="text-sm font-medium text-primary-foreground hidden sm:inline">
              Email: support@datn.com
            </span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">D</span>
            </div>
            <span className="text-2xl font-bold font-display tracking-tight text-ink">DATN</span>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-3xl mx-8 flex-col">
            <form onSubmit={handleSearch} className="relative group w-full">
              <div className="absolute -inset-0.5 bg-gradient-ai rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('ai_search')}
                className="relative w-full rounded-full border border-rule bg-paper-1 py-2.5 pl-5 pr-12 text-sm focus:border-primary focus:outline-none shadow-sm transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary text-white p-1.5 rounded-full hover:bg-primary/90 transition-colors flex items-center justify-center"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </form>
            {/* Suggested Keywords */}
            <div className="flex items-center gap-4 px-3 mt-2">
              {HEADER_SUGGESTED_KEYWORDS.map((kw) => (
                <Link
                  key={kw}
                  href={`/search?q=${encodeURIComponent(kw)}`}
                  className="text-xs font-medium text-ink-2 hover:text-primary transition-colors whitespace-nowrap"
                >
                  {kw}
                </Link>
              ))}
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-3">
            <Link
              href={isAuthenticated ? '/profile' : '/login'}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-ink-2 hover:bg-paper-2 hover:text-primary transition-colors hidden sm:flex"
            >
              <User className="h-5 w-5" />
              <span>{isAuthenticated ? t('account') : t('sign_in')}</span>
            </Link>

            <Link
              href="/cart"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-paper-2 border border-rule text-sm font-bold text-ink hover:border-primary hover:text-primary transition-all group relative shadow-sm"
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white group-hover:scale-110 transition-transform">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className="hidden md:inline">{tCommon('cart')}</span>
            </Link>

            <button className="lg:hidden text-ink-2 p-2 hover:bg-paper-2 rounded-lg transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
