'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Package,
  Heart,
  Settings,
  LogOut,
  Ticket,
  ArrowRight,
  Sparkles,
  Clock,
  ChevronRight,
  Loader2,
} from '@/components/base/icons';
import { useAuthStore } from '@/store';
import { userService } from '@/services/user-service';
import { orderService } from '@/services/order-service';
import { formatPrice } from '@/utils/format';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABEL_KEY, isOrderStatus } from '@/constants/order';
import {
  ProfileInfoSection,
  ProfileSettingsSection,
  ProfileRecommendationsSection,
  ProfileWishlistSection,
} from '@/components/features/profile';

export default function UserProfilePage() {
  const locale = useLocale();
  const t = useTranslations('profile');
  const tOrder = useTranslations('order');
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'info' | 'orders' | 'wishlist' | 'settings'>(
    'info'
  );

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
    enabled: !!user,
  });

  const { data: ordersRes, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['profile-recent-orders', user?.id],
    queryFn: () => orderService.getMyOrders(1, 5),
    enabled: !!user && activeSection === 'orders',
  });

  const recentOrders = ordersRes?.data || [];
  const hasRealEmail = Boolean(profile?.email && !profile.email.endsWith('@placeholder.local'));
  const vipTier = profile?.vipTier || 'BRONZE';
  const loyaltyPoints = profile?.loyaltyPoints ?? profile?.vipPoints ?? 0;

  const menuItems = [
    { key: 'info' as const, label: t('personalInfo'), icon: User },
    { key: 'orders' as const, label: t('myOrders'), icon: Package },
    { key: 'wishlist' as const, label: t('wishlist'), icon: Heart },
    { key: 'settings' as const, label: t('settings'), icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-ink mb-8">{t('title')}</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white border border-rule rounded-xl p-6">
            {/* Avatar & VIP Badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm">
                {profile?.fullName?.charAt(0).toUpperCase() ||
                  (hasRealEmail ? profile?.email?.charAt(0).toUpperCase() : 'U')}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-ink truncate">
                  {profile?.fullName ||
                    (hasRealEmail ? profile?.email?.split('@')[0] : profile?.phone) ||
                    'User'}
                </h3>
                <p className="text-xs text-ink-2 truncate">
                  {hasRealEmail ? profile?.email : profile?.phone || t('unlinkedEmail')}
                </p>
              </div>
            </div>

            <div className="mb-5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {t('vipTierLabel')}: {vipTier}
                </span>
              </div>
              <span className="font-semibold text-amber-700">
                {t('loyaltyPointsLabel', { points: loyaltyPoints })}
              </span>
            </div>

            {/* Menu */}
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === item.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
              <Link
                href="/profile/vouchers"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink-2 hover:bg-paper-2 hover:text-primary transition-colors"
              >
                <Ticket className="w-4 h-4" />
                <span>{t('voucherWallet')}</span>
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          {activeSection === 'info' && (
            <ProfileInfoSection
              profile={profile}
              isLoading={isLoading}
              hasRealEmail={hasRealEmail}
            />
          )}

          {activeSection === 'orders' && (
            <div className="bg-white border border-rule rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ink">{t('recentOrders')}</h2>
                <Link
                  href="/orders"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  {t('viewAllOrders')} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {isOrdersLoading ? (
                <div className="py-12 text-center text-ink-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                  <span className="text-sm">{t('loading')}</span>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-12 text-ink-2">
                  <Package className="w-12 h-12 mx-auto mb-3 text-muted" />
                  <p>{t('noOrders')}</p>
                  <Link
                    href="/"
                    className="text-primary hover:underline text-sm mt-3 inline-flex items-center gap-1 font-medium"
                  >
                    {t('exploreProducts')} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => {
                    const statusKey = order.status.toLowerCase();
                    return (
                      <Link key={order.id} href={`/orders/${order.id}`} className="block group">
                        <div className="border border-rule rounded-xl p-4 hover:border-primary/40 hover:bg-paper-2/40 transition-all flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-ink truncate">{order.id}</p>
                            <div className="flex items-center gap-1.5 text-xs text-ink-2 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(order.createdAt || Date.now()).toLocaleDateString(
                                  locale === 'vi' ? 'vi-VN' : 'en-US'
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                ORDER_STATUS_COLORS[order.status] ||
                                ORDER_STATUS_COLORS[statusKey] ||
                                'bg-gray-100 text-gray-800 border-gray-200'
                              }`}
                            >
                              {isOrderStatus(order.status)
                                ? tOrder(`statusLabels.${ORDER_STATUS_LABEL_KEY[order.status]}`)
                                : order.status}
                            </span>
                            <span className="font-bold text-sm text-primary">
                              {formatPrice(order.totalAmount, locale)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-ink-2 group-hover:text-primary" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeSection === 'wishlist' && <ProfileWishlistSection />}

          {activeSection === 'settings' && (
            <ProfileSettingsSection
              hasRealEmail={hasRealEmail}
              onSwitchToInfo={() => setActiveSection('info')}
            />
          )}

          {/* AI Recommendations */}
          <ProfileRecommendationsSection userId={user?.id} />
        </main>
      </div>
    </div>
  );
}
