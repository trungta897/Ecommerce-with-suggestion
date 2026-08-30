'use client';

import { useTranslations } from 'next-intl';
import {
  User,
  Package,
  Heart,
  Settings,
  LogOut,
  Sparkles,
  Ticket,
  Bell,
  Lock,
  ArrowRight,
  ShieldCheck,
} from '@/components/base/icons';
import { BaseButton, BaseInput } from '@/components/base';
import { useAuthStore } from '@/store';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user-service';
import { activityService } from '@/services/activity-service';
import { useWishlist } from '@/hooks/use-wishlist';
import { useToast } from '@/providers/toast-provider';
import { AddressSelector } from '@/components/features/address/AddressSelector';
import ProductCard from '@/components/features/product/ProductCard';

export default function UserProfilePage() {
  const t = useTranslations('profile');
  const toast = useToast();
  const { user, logout, setAuth, accessToken } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'info' | 'orders' | 'wishlist' | 'settings'>(
    'info'
  );
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
    enabled: !!user,
  });

  const { data: wishlistItems, isLoading: isWishlistLoading } = useWishlist();

  const { data: recommendations, isLoading: isRecsLoading } = useQuery({
    queryKey: ['profile-recommendations', user?.id],
    queryFn: () => activityService.getRecommendations({ limit: 4 }),
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
  });

  const [settingsData, setSettingsData] = useState({
    promoEmails: true,
    orderNotifications: true,
  });

  const [errors, setErrors] = useState<{
    fullName?: string;
    phone?: string;
    address?: string;
  }>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
      if (accessToken) {
        setAuth(
          {
            id: profile.id,
            email: profile.email,
            fullName: profile.fullName,
            role: profile.role,
            isVerified: profile.isVerified,
          },
          accessToken
        );
      }
    }
  }, [profile, setAuth, accessToken]);

  const updateMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile'], updatedProfile);
      if (accessToken) {
        setAuth(
          {
            id: updatedProfile.id,
            email: updatedProfile.email,
            fullName: updatedProfile.fullName,
            role: updatedProfile.role,
            isVerified: updatedProfile.isVerified,
          },
          accessToken
        );
      }
      toast.success(t('toast.updateSuccessMessage'), t('toast.updateSuccessTitle'));
    },
    onError: () => {
      toast.error(t('toast.updateErrorMessage'), t('toast.updateErrorTitle'));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { fullName?: string; phone?: string; address?: string } = {};
    let hasError = false;

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('validation.fullNameRequired');
      toast.error(t('validation.fullNameRequired'), t('toast.updateErrorTitle'));
      hasError = true;
    } else if (formData.phone && !/^[0-9]{9,11}$/.test(formData.phone.trim())) {
      newErrors.phone = t('validation.phoneInvalid');
      toast.error(t('validation.phoneInvalid'), t('toast.updateErrorTitle'));
      hasError = true;
    } else if (!formData.address.trim()) {
      newErrors.address = t('validation.streetRequired');
      toast.error(t('validation.streetRequired'), t('toast.updateErrorTitle'));
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    updateMutation.mutate(formData);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t('saveSettingsSuccess'));
  };

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
                  profile?.email?.charAt(0).toUpperCase() ||
                  'U'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-ink truncate">
                  {profile?.fullName || profile?.email?.split('@')[0] || 'User'}
                </h3>
                <p className="text-xs text-ink-2 truncate">{profile?.email || ''}</p>
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
            <form onSubmit={handleSubmit} className="bg-white border border-rule rounded-xl p-6">
              <h2 className="text-lg font-bold text-ink mb-6">{t('personalInfo')}</h2>
              {isLoading ? (
                <div className="text-center py-8 text-ink-2">{t('loading')}</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-ink">{t('fullName')} *</label>
                      <BaseInput
                        name="fullName"
                        placeholder={t('fullName')}
                        value={formData.fullName}
                        onChange={handleChange}
                        className={errors.fullName ? 'border-red-500' : ''}
                      />
                      {errors.fullName && (
                        <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-ink">{t('email')}</label>
                      <BaseInput type="email" value={profile?.email || ''} disabled />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-ink">{t('phone')}</label>
                      <BaseInput
                        name="phone"
                        type="tel"
                        placeholder="0900 000 000"
                        value={formData.phone}
                        onChange={handleChange}
                        className={errors.phone ? 'border-red-500' : ''}
                      />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2 pt-2 border-t border-rule">
                      <label className="text-sm font-bold text-ink">{t('address')} *</label>
                      <AddressSelector
                        initialAddress={profile?.address || ''}
                        onAddressChange={(fullAddress) => {
                          setFormData((prev) => ({
                            ...prev,
                            address: fullAddress,
                          }));
                          setErrors((prev) => ({ ...prev, address: undefined }));
                        }}
                        error={errors.address}
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <BaseButton type="submit" isLoading={updateMutation.isPending}>
                      {t('saveChanges')}
                    </BaseButton>
                  </div>
                </>
              )}
            </form>
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

          {activeSection === 'wishlist' && (
            <div className="bg-white border border-rule rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-ink">{t('wishlist')}</h2>
                {wishlistItems && wishlistItems.length > 0 && (
                  <span className="text-xs text-ink-2 bg-paper-2 px-2.5 py-1 rounded-full font-medium">
                    {t('wishlistCount', { count: wishlistItems.length })}
                  </span>
                )}
              </div>

              {isWishlistLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-72 bg-paper-2 rounded-2xl w-full border border-rule/60"
                    />
                  ))}
                </div>
              ) : !wishlistItems || wishlistItems.length === 0 ? (
                <div className="text-center py-12 text-ink-2">
                  <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-7 h-7" />
                  </div>
                  <p className="text-ink font-semibold text-base mb-1">{t('emptyWishlist')}</p>
                  <p className="text-xs text-ink-2 max-w-sm mx-auto mb-5">
                    {t('emptyWishlistDesc')}
                  </p>
                  <Link href="/">
                    <BaseButton variant="outline" size="sm">
                      {t('exploreProducts')}
                    </BaseButton>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {wishlistItems.map((item) => (
                    <ProductCard key={item.id} product={item.product} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="bg-white border border-rule rounded-xl p-6 space-y-6">
              <h2 className="text-lg font-bold text-ink">{t('settings')}</h2>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* Notification Settings */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    {t('notificationSettings')}
                  </h3>
                  <div className="space-y-3 pl-6">
                    <label className="flex items-center gap-3 cursor-pointer text-sm text-ink select-none">
                      <input
                        type="checkbox"
                        checked={settingsData.promoEmails}
                        onChange={(e) =>
                          setSettingsData((prev) => ({ ...prev, promoEmails: e.target.checked }))
                        }
                        className="w-4 h-4 text-primary rounded border-rule focus:ring-primary"
                      />
                      <span>{t('promoEmails')}</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer text-sm text-ink select-none">
                      <input
                        type="checkbox"
                        checked={settingsData.orderNotifications}
                        onChange={(e) =>
                          setSettingsData((prev) => ({
                            ...prev,
                            orderNotifications: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-primary rounded border-rule focus:ring-primary"
                      />
                      <span>{t('orderStatusNotifications')}</span>
                    </label>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="space-y-3 pt-4 border-t border-rule">
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    {t('securitySettings')}
                  </h3>
                  <div className="bg-paper-2 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg text-ink-2 shadow-xs">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink">{t('changePassword')}</div>
                        <div className="text-xs text-ink-2">{t('changePasswordDesc')}</div>
                      </div>
                    </div>
                    <BaseButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast.info(
                          'Tính năng đổi mật khẩu đang gửi mã xác thực về email của bạn.',
                          'Bảo mật'
                        )
                      }
                    >
                      {t('changePassword')}
                    </BaseButton>
                  </div>
                </div>

                <div className="pt-2">
                  <BaseButton type="submit">{t('saveSettings')}</BaseButton>
                </div>
              </form>
            </div>
          )}

          {/* AI Recommendations */}
          <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 border border-purple-100 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-purple-900">{t('aiRecommend')}</h2>
                <p className="text-xs sm:text-sm text-purple-700">{t('aiRecommendDesc')}</p>
              </div>
            </div>

            <div className="mt-5">
              {isRecsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-64 bg-white/70 rounded-xl border border-purple-100" />
                  ))}
                </div>
              ) : recommendations && recommendations.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {recommendations.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-purple-600">
                  {t('aiRecommendDesc')}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
