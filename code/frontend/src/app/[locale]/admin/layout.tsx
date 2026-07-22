'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  ShoppingBag,
  Package,
  Users,
  MessageSquare,
  RotateCcw,
  Settings,
  LogOut,
  Sparkles,
} from '@/components/base/icons';

const ADMIN_NAV = [
  { key: 'dashboard', href: '/admin/dashboard', icon: BarChart3 },
  { key: 'products', href: '/admin/products', icon: ShoppingBag },
  { key: 'orders', href: '/admin/orders', icon: Package },
  { key: 'users', href: '/admin/users', icon: Users },
  { key: 'reviews', href: '/admin/reviews', icon: MessageSquare },
  { key: 'returns', href: '/admin/returns', icon: RotateCcw },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin.sidebar');
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-paper-2">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-rule flex-shrink-0 hidden lg:flex flex-col">
        {/* Logo / Brand */}
        <div className="p-6 border-b border-rule">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-red-400 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink text-lg">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {ADMIN_NAV.map((item) => {
            const isActive = pathname?.includes(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {t(item.key as Parameters<typeof t>[0])}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-rule space-y-1">
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink-2 hover:bg-paper-2 hover:text-ink transition-colors"
          >
            <Settings className="w-4 h-4" />
            {t('settings')}
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
