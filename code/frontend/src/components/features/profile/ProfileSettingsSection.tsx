'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, ShieldCheck, Lock, Info } from '@/components/base/icons';
import { BaseButton } from '@/components/base';
import { useToast } from '@/providers/toast-provider';

interface ProfileSettingsSectionProps {
  hasRealEmail: boolean;
  onSwitchToInfo: () => void;
}

export function ProfileSettingsSection({
  hasRealEmail,
  onSwitchToInfo,
}: ProfileSettingsSectionProps) {
  const t = useTranslations('profile');
  const toast = useToast();

  const [settingsData, setSettingsData] = useState({
    promoNotifications: true,
    orderNotifications: true,
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t('saveSettingsSuccess'));
  };

  return (
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
                checked={settingsData.promoNotifications}
                onChange={(e) =>
                  setSettingsData((prev) => ({
                    ...prev,
                    promoNotifications: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-primary rounded border-rule focus:ring-primary"
              />
              <span>{hasRealEmail ? t('promoEmails') : t('promoSms')}</span>
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
              <span>{hasRealEmail ? t('orderStatusNotifications') : t('orderStatusSms')}</span>
            </label>
          </div>

          {/* Link Email Hint for Phone accounts */}
          {!hasRealEmail && (
            <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2 text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{t('linkEmailTitle')}: </span>
                  <span className="text-blue-800">{t('linkEmailDesc')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onSwitchToInfo}
                className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors shrink-0 self-start sm:self-center shadow-xs"
              >
                {t('linkEmailAction')}
              </button>
            </div>
          )}
        </div>

        {/* Security Settings */}
        <div className="space-y-3 pt-4 border-t border-rule">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            {t('securitySettings')}
          </h3>

          {hasRealEmail ? (
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
                onClick={() => toast.info(t('toast.changePasswordInfo'), t('toast.securityTitle'))}
              >
                {t('changePassword')}
              </BaseButton>
            </div>
          ) : (
            <div className="bg-paper-2 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">{t('passwordlessPhone')}</div>
                <div className="text-xs text-ink-2">{t('passwordlessDesc')}</div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <BaseButton type="submit">{t('saveSettings')}</BaseButton>
        </div>
      </form>
    </div>
  );
}
