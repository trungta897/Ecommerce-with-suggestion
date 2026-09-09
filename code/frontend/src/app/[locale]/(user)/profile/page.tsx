'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Package,
  Heart,
  Settings,
  LogOut,
  Ticket,
  ArrowRight,
} from '@/components/base/icons';
import { useAuthStore } from '@/store';
import { userService } from '@/services/user-service';
import {
  ProfileInfoSection,
  ProfileSettingsSection,
  ProfileRecommendationsSection,
  ProfileWishlistSection,
} from '@/components/features/profile';

export default function UserProfilePage() {
  const t = useTranslations('profile');
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'info' | 'orders' | 'wishlist' | 'settings'>(
    'info'
  );

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
    enabled: !!user,
  });

  const hasRealEmail = Boolean(profile?.email && !profile.email.endsWith('@placeholder.local'));

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
            {/* Avatar */}
            <div className="flex items-center gap-3 mb-6">
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
              <h2 className="text-lg font-bold text-ink mb-4">{t('recentOrders')}</h2>
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
