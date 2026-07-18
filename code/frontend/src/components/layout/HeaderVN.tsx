import { useTranslations } from "next-intl";
import Link from "next/link";
import { Search, ShoppingCart, Heart, User, Menu } from "lucide-react";

export function HeaderVN() {
  const t = useTranslations("common.header");

  return (
    <header className="w-full bg-white border-b border-gray-200">
      {/* Top Banner */}
      <div className="bg-black py-2.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-white">{t("promo_text")}</p>
          </div>
          <div className="flex divide-x divide-white/20">
            <Link
              href="/signup"
              className="pr-3 text-sm font-medium text-white transition hover:text-gray-300"
            >
              {t("create_account")}
            </Link>
            <Link
              href="/signin"
              className="pl-3 text-sm font-medium text-white transition hover:text-gray-300"
            >
              {t("sign_in")}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <span className="text-xl font-bold font-display tracking-tight text-gray-900">
              DATN
            </span>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8 relative">
            <input
              type="text"
              placeholder={t("search")}
              className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-4 pr-10 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="text-gray-700 transition hover:text-red-600 hidden sm:block"
              aria-label={t("sign_in")}
            >
              <User className="h-6 w-6" />
            </Link>
            <Link
              href="/wishlist"
              className="text-gray-700 transition hover:text-red-600 hidden sm:block relative"
              aria-label={t("wishlist")}
            >
              <Heart className="h-6 w-6" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                0
              </span>
            </Link>
            <Link
              href="/cart"
              className="text-gray-700 transition hover:text-red-600 relative"
              aria-label={t("cart")}
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                0
              </span>
            </Link>
            <button className="lg:hidden text-gray-700 transition hover:text-red-600">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
