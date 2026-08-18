'use client';

import { useLocale, useTranslations } from 'next-intl';
import { BaseInput } from '@/components/base';
import { AddressSelector } from '@/components/features/address/AddressSelector';
import { formatPrice } from '@/utils/format';

interface AddressDetails {
  provinceName: string;
  districtName: string;
  wardName: string;
  street: string;
  provinceId?: string;
  wardId?: string;
}

interface ShippingData {
  fullName: string;
  phone: string;
  address: string;
  pickupTime: string;
}

interface ShippingFormErrors {
  fullName?: string;
  phone?: string;
  address?: string;
  pickupTime?: string;
}

interface ShippingFormProps {
  shippingData: ShippingData;
  addressDetails: AddressDetails;
  deliveryMethod: string;
  errors: ShippingFormErrors;
  onShippingDataChange: (data: ShippingData) => void;
  onAddressDetailsChange: (details: AddressDetails) => void;
  onDeliveryMethodChange: (method: string) => void;
  onErrorsChange: (errors: ShippingFormErrors) => void;
}

export function ShippingForm({
  shippingData,
  addressDetails,
  deliveryMethod,
  errors,
  onShippingDataChange,
  onAddressDetailsChange,
  onDeliveryMethodChange,
  onErrorsChange,
}: ShippingFormProps) {
  const locale = useLocale();
  const t = useTranslations('checkout');

  const hasAddress = !!addressDetails?.provinceName;

  return (
    <div className="bg-white border border-rule rounded-xl p-6 space-y-6 shadow-sm">
      <h2 className="text-lg font-bold text-ink mb-4 border-b border-rule pb-3">
        {t('shippingInfo')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">{t('fullName')} *</label>
          <BaseInput
            placeholder={t('fullName')}
            value={shippingData.fullName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onShippingDataChange({ ...shippingData, fullName: e.target.value });
              onErrorsChange({ ...errors, fullName: undefined });
            }}
            className={errors.fullName ? 'border-red-500' : ''}
          />
          {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">{t('phone')} *</label>
          <BaseInput
            type="tel"
            placeholder="0900 000 000"
            value={shippingData.phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              onShippingDataChange({ ...shippingData, phone: e.target.value });
              onErrorsChange({ ...errors, phone: undefined });
            }}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
        </div>

        {deliveryMethod !== 'pickup' && (
          <div className="space-y-2 md:col-span-2 pt-2 border-t border-rule">
            <label className="text-sm font-bold text-ink">{t('address')} *</label>
            <AddressSelector
              initialAddress={shippingData.address}
              onAddressChange={(fullAddr, details) => {
                onShippingDataChange({ ...shippingData, address: fullAddr });
                onAddressDetailsChange(details);
                onErrorsChange({ ...errors, address: undefined });
              }}
              error={errors.address}
            />
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t border-rule">
        <label className="text-sm font-bold text-ink">{t('deliveryMethod')}</label>
        {['standard', 'express', 'pickup'].map((method) => {
          const isPickup = method === 'pickup';
          const isDisabled = !isPickup && !hasAddress;

          return (
            <label
              key={method}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                  : 'cursor-pointer hover:border-ink-2'
              } ${
                deliveryMethod === method
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'border-rule'
              }`}
            >
              <input
                type="radio"
                name="delivery"
                value={method}
                checked={deliveryMethod === method}
                disabled={isDisabled}
                onChange={(e) => onDeliveryMethodChange(e.target.value)}
                className="accent-primary w-4 h-4 disabled:opacity-50"
              />
              <span className="text-sm text-ink">
                {t(method as 'standard' | 'express' | 'pickup')}
              </span>
              <span className="text-sm font-semibold text-primary ml-auto">
                {isPickup ? t('free') : method === 'standard' ? t('free') : formatPrice(2, locale)}
              </span>
            </label>
          );
        })}
      </div>

      {deliveryMethod === 'pickup' && (
        <div className="space-y-2 pt-4 border-t border-rule">
          <label className="text-sm font-bold text-ink">{t('pickupTime')} *</label>
          <input
            type="datetime-local"
            className="w-full px-4 py-2 border border-rule rounded-xl text-ink outline-none focus:border-primary transition-colors"
            min={new Date().toISOString().slice(0, 16)}
            max={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
            value={shippingData.pickupTime || ''}
            onChange={(e) => {
              onShippingDataChange({ ...shippingData, pickupTime: e.target.value });
              onErrorsChange({ ...errors, pickupTime: undefined });
            }}
          />
          {errors.pickupTime && <p className="text-xs text-red-500">{errors.pickupTime}</p>}
        </div>
      )}
    </div>
  );
}
