import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ShoppingCart, Heart, User, Menu, Sparkles } from '@/components/base/icons';

export function HeaderVN() {
  const t = useTranslations('common.header');

  // Tạm thời mock trạng thái đăng nhập. Sau này sẽ thay bằng hook useAuth() hoặc Zustand store.
  const isLoggedIn = false;

  return (
    <header className="w-full bg-white border-b border-rule">
      {/* Top Banner */}
      <div className="bg-primary py-2.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-primary-foreground">{t('promo_text')}</p>
          </div>
          {!isLoggedIn && (
            <div className="flex divide-x divide-white/20">
              <Link
                href="/register"
                className="pr-3 text-sm font-medium text-primary-foreground transition hover:text-gray-200"
              >
                {t('create_account')}
              </Link>
              <Link
                href="/login"
                className="pl-3 text-sm font-medium text-primary-foreground transition hover:text-gray-200"
              >
                {t('sign_in')}
              </Link>
            </div>
          )}
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

          {/* AI Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8 relative group">
            <div className="absolute -inset-0.5 bg-gradient-ai rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <input
              type="text"
              placeholder={t('ai_search')}
              className="relative w-full rounded-full border-2 border-transparent bg-white py-2.5 pl-5 pr-12 text-sm focus:border-purple-400 focus:outline-none shadow-sm"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-800 transition-colors">
              <Sparkles className="h-5 w-5" />
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-5">
            {isLoggedIn && (
              <Link
                href="/profile"
                className="text-ink-2 transition hover:text-primary hidden sm:block"
                aria-label={t('sign_in')} // Consider changing translation key to 'profile' later
              >
                <User className="h-6 w-6" />
              </Link>
            )}
            <Link
              href="/wishlist"
              className="text-ink-2 transition hover:text-primary hidden sm:block relative"
              aria-label={t('wishlist')}
            >
              <Heart className="h-6 w-6" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                0
              </span>
            </Link>
            <Link
              href="/cart"
              className="text-ink-2 transition hover:text-primary relative"
              aria-label={t('cart')}
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                2
              </span>
            </Link>
            <button className="lg:hidden text-ink-2 transition hover:text-primary">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
