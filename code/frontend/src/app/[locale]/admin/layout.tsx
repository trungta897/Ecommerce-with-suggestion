'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  ShoppingBag,
  Package,
  Users,
  MessageSquare,
  LogOut,
  Sparkles,
  Zap,
  FolderTree,
  Ticket,
  Menu,
  X,
} from '@/components/base/icons';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useAuthStore } from '@/store';
import { authService } from '@/services/authService';

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const ADMIN_NAV: NavItem[] = [
  {
    key: 'dashboard',
    href: '/admin/dashboard',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
  },
  {
    key: 'orders',
    href: '/admin/orders',
    icon: Package,
    roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
  },
  { key: 'products', href: '/admin/products', icon: ShoppingBag, roles: ['SUPER_ADMIN', 'ADMIN'] },
  {
    key: 'categories',
    href: '/admin/categories',
    icon: FolderTree,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    key: 'promotions',
    href: '/admin/promotions/discounts',
    icon: Zap,
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  { key: 'vouchers', href: '/admin/vouchers', icon: Ticket, roles: ['SUPER_ADMIN', 'ADMIN'] },
  {
    key: 'reviews',
    href: '/admin/reviews',
    icon: MessageSquare,
    roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'],
  },
  { key: 'users', href: '/admin/users', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin.sidebar');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout: logoutStore } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lọc menu theo vai trò người dùng (Nhân viên chỉ thấy dashboard, orders, reviews)
  const allowedNav = ADMIN_NAV.filter((item) => user?.role && item.roles.includes(user.role));

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      logoutStore();
      router.push('/admin/login');
    }
  };

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-paper-2 flex-col lg:flex-row">
        {/* Mobile Header Bar (< 1024px) */}
        <div className="lg:hidden bg-white border-b border-rule px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-red-400 rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink text-base">DATN Admin</span>
            {user?.role && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                {user.role}
              </span>
            )}
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-ink-2 hover:text-ink hover:bg-paper-2 rounded-lg transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer Navigation Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <aside className="fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col lg:hidden border-r border-rule shadow-xl">
            <div className="p-4 border-b border-rule flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-red-400 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-ink text-base">DATN Admin</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-ink-2 hover:text-ink hover:bg-paper-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {allowedNav.map((item) => {
                const isActive = pathname?.includes(item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
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

            <div className="p-3 border-t border-rule">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </button>
            </div>
          </aside>
        )}

        {/* Desktop Sidebar (>= 1024px) */}
        <aside className="w-64 bg-white border-r border-rule flex-shrink-0 hidden lg:flex flex-col">
          {/* Logo / Brand */}
          <div className="p-6 border-b border-rule">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-red-400 rounded-lg flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-ink text-lg block leading-tight">Admin Panel</span>
                {user?.role && (
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Items (Role Filtered) */}
          <nav className="flex-1 p-4 space-y-1">
            {allowedNav.map((item) => {
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

          {/* User Info & Real Logout */}
          <div className="p-4 border-t border-rule space-y-2">
            {user?.fullName && (
              <div className="px-3 py-1">
                <p className="text-xs text-ink-3">{t('loggedInAs')}</p>
                <p className="text-xs font-semibold text-ink truncate">{user.fullName}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('logout')}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AdminGuard>
  );
}
