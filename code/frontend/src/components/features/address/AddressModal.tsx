'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, MapPin, Info, Check } from '@/components/base/icons';
import { BaseButton } from '@/components/base';
import { AddressSelector } from './AddressSelector';

export interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAddress?: string;
  onConfirm: (newAddress: string) => void;
}

export function extractInitialStreet(address?: string): string {
  if (!address || typeof address !== 'string') return '';
  const parts = address.split(',');
  return parts[0]?.trim() || '';
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  initialAddress = '',
  onConfirm,
}) => {
  const t = useTranslations('profile');
  const [selectedAddress, setSelectedAddress] = useState<string>(initialAddress);

  useEffect(() => {
    if (isOpen) {
      setSelectedAddress(initialAddress);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialAddress]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (selectedAddress.trim()) {
      onConfirm(selectedAddress.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-rule/80 z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rule/80 bg-paper-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-ink">{t('addressModalTitle')}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-2 hover:text-ink hover:bg-paper-2 transition-colors"
            aria-label={t('cancel')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Current Saved Address & Honest Note */}
          {initialAddress && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-start gap-2 text-blue-900">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{t('currentSavedAddress')} </span>
                  <span className="font-medium text-blue-800">{initialAddress}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-blue-700/80 pt-1 border-t border-blue-100/60">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <p>{t('reselectLocationNote')}</p>
              </div>
            </div>
          )}

          {/* Address Selector Component */}
          <AddressSelector
            initialAddress={initialAddress}
            onAddressChange={(fullAddress) => {
              setSelectedAddress(fullAddress);
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-rule/80 bg-paper-1 flex items-center justify-end gap-3">
          <BaseButton variant="outline" size="sm" onClick={onClose}>
            {t('cancel')}
          </BaseButton>
          <BaseButton
            variant="default"
            size="sm"
            onClick={handleApply}
            disabled={!selectedAddress.trim()}
            className="flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{t('applyAddress')}</span>
          </BaseButton>
        </div>
      </div>
    </div>
  );
};
