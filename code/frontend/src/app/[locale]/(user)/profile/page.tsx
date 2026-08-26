'use client';

import { useTranslations } from 'next-intl';
import { User, Package, Heart, Settings, LogOut, Sparkles, Ticket } from '@/components/base/icons';
import { BaseButton, BaseInput } from '@/components/base';
import { useAuthStore } from '@/store';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user-service';
import { useToast } from '@/providers/toast-provider';
import { AddressSelector } from '@/components/features/address/AddressSelector';

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

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
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
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {profile?.fullName?.charAt(0).toUpperCase() ||
                  profile?.email?.charAt(0).toUpperCase() ||
                  'U'}
              </div>
              <div>
                <h3 className="font-bold text-ink">
                  {profile?.fullName || profile?.email?.split('@')[0] || 'User'}
                </h3>
                <p className="text-xs text-ink-2">{profile?.email || ''}</p>
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
                  {item.label}
                </button>
              ))}
              <Link
                href="/profile/vouchers"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink-2 hover:bg-paper-2 hover:text-primary transition-colors"
              >
                <Ticket className="w-4 h-4" />
                Kho Voucher
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
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

                    {/* ADDRESS SELECTOR INTEGRATED HERE */}
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
                <Link href="/" className="text-primary hover:underline text-sm mt-2 inline-block">
                  {t('wishlist')}
                </Link>
              </div>
            </div>
          )}

          {activeSection === 'wishlist' && (
            <div className="bg-white border border-rule rounded-xl p-6">
              <h2 className="text-lg font-bold text-ink mb-4">{t('wishlist')}</h2>
              <div className="text-center py-12 text-ink-2">
                <Heart className="w-12 h-12 mx-auto mb-3 text-muted" />
                <p>{t('noOrders')}</p>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="bg-white border border-rule rounded-xl p-6">
              <h2 className="text-lg font-bold text-ink mb-4">{t('settings')}</h2>
              <p className="text-ink-2 text-sm">Coming soon...</p>
            </div>
          )}

          {/* AI Recommendations */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-6">
            <h2 className="text-lg font-bold text-purple-700 flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              {t('aiRecommend')}
            </h2>
            <p className="text-sm text-ink-2 mb-4">{t('aiRecommendDesc')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/80 rounded-lg p-3 text-center">
                  <div className="w-full aspect-square bg-paper-2 rounded-lg mb-2" />
                  <div className="h-3 bg-paper-2 rounded w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
