'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Edit } from '@/components/base/icons';
import { BaseButton, BaseInput } from '@/components/base';
import { userService } from '@/services/user-service';
import { useToast } from '@/providers/toast-provider';
import { AddressModal } from '@/components/features/address/AddressModal';
import { useAuthStore } from '@/store';
import { User } from '@/types';

interface ProfileInfoSectionProps {
  profile?: User;
  isLoading: boolean;
  hasRealEmail: boolean;
}

export function ProfileInfoSection({ profile, isLoading, hasRealEmail }: ProfileInfoSectionProps) {
  const t = useTranslations('profile');
  const toast = useToast();
  const queryClient = useQueryClient();
  const { accessToken, setAuth } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
  });

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddressChanged, setIsAddressChanged] = useState(false);
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

  const isDirty = Boolean(
    isAddressChanged ||
    (profile &&
      (formData.fullName !== (profile.fullName || '') ||
        formData.phone !== (profile.phone || '') ||
        formData.address !== (profile.address || '')))
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const updateMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile'], updatedProfile);
      setIsAddressChanged(false);
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

  return (
    <>
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
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-ink">{t('email')}</label>
                <BaseInput
                  type="text"
                  value={hasRealEmail ? profile?.email || '' : t('unlinkedEmail')}
                  disabled
                  className={!hasRealEmail ? 'text-ink-3 italic bg-paper-2' : ''}
                />
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

              {/* Clean Shipping Address Card */}
              <div className="space-y-2 md:col-span-2 pt-2 border-t border-rule">
                <label className="text-sm font-bold text-ink">{t('shippingAddress')} *</label>
                {formData.address ? (
                  <div className="p-4 bg-paper-2 border border-rule/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-ink break-words leading-normal">
                          {formData.address}
                        </span>
                        {isAddressChanged && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 rounded-md shrink-0">
                            {t('unsavedBadge')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-primary bg-white border border-rule/80 hover:border-primary/50 hover:bg-primary/5 transition-all self-start sm:self-center shrink-0 active:scale-95 shadow-xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{t('changeAddress')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-paper-2/60 border border-dashed border-rule rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-ink-2 text-sm">
                      <MapPin className="w-5 h-5 text-muted" />
                      <span>{t('noAddressYet')}</span>
                    </div>
                    <BaseButton
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddressModalOpen(true)}
                    >
                      {t('addAddress')}
                    </BaseButton>
                  </div>
                )}
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>
            </div>

            {isDirty && (
              <div className="mt-6 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <BaseButton type="submit" isLoading={updateMutation.isPending}>
                  {t('saveChanges')}
                </BaseButton>
                <span className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  {t('unsavedBadge')}
                </span>
              </div>
            )}
          </>
        )}
      </form>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        initialAddress={formData.address}
        onConfirm={(newAddress) => {
          setFormData((prev) => ({ ...prev, address: newAddress }));
          setIsAddressChanged(true);
          setErrors((prev) => ({ ...prev, address: undefined }));
          toast.info(t('toastAddressApplied'));
        }}
      />
    </>
  );
}
