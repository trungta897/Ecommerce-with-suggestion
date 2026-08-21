'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { locationService, LocationItem, WardItem } from '@/services/location-service';
import { Search, ChevronDown, ChevronUp, Check, Loader2, MapPin } from '@/components/base/icons';

export interface AddressSelectorProps {
  initialAddress?: string;
  onAddressChange?: (
    fullAddress: string,
    details: {
      provinceName: string;
      districtName: string;
      wardName: string;
      street: string;
      provinceId?: string;
      wardId?: string;
    }
  ) => void;
  error?: string;
  disabled?: boolean;
}

type Step = 'province' | 'ward';

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  initialAddress = '',
  onAddressChange,
  error,
  disabled = false,
}) => {
  const t = useTranslations('address');

  // Data State
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<WardItem[]>([]);

  // Selection State
  const [selectedProvince, setSelectedProvince] = useState<LocationItem | null>(null);
  const [selectedWard, setSelectedWard] = useState<WardItem | null>(null);
  const [street, setStreet] = useState<string>('');

  // Active step & panel state
  const [activeStep, setActiveStep] = useState<Step>('province');
  const [isListOpen, setIsListOpen] = useState(true);

  // Loading State
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Provinces on Mount
  useEffect(() => {
    const fetchProvs = async () => {
      setLoadingProvinces(true);
      try {
        const data = await locationService.getProvinces();
        setProvinces(data);
      } finally {
        setLoadingProvinces(false);
      }
    };
    void fetchProvs();
  }, []);

  // Fetch Wards when Province changes
  useEffect(() => {
    if (!selectedProvince) {
      setWards([]);
      setSelectedWard(null);
      return;
    }
    const fetchWs = async () => {
      setLoadingWards(true);
      try {
        const data = await locationService.getWards(selectedProvince.id);
        setWards(data);
      } finally {
        setLoadingWards(false);
      }
    };
    void fetchWs();
  }, [selectedProvince]);

  // Filtered lists matching name or mergedFrom
  const filteredProvinces = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return provinces;
    return provinces.filter((p) => {
      const matchName =
        p.fullName.toLowerCase().includes(query) || p.name.toLowerCase().includes(query);
      const matchMerged = p.mergedFrom ? p.mergedFrom.toLowerCase().includes(query) : false;
      return matchName || matchMerged;
    });
  }, [provinces, searchQuery]);

  const filteredWards = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return wards;
    return wards.filter((w) => {
      const matchName =
        w.fullName.toLowerCase().includes(query) || w.name.toLowerCase().includes(query);
      const matchMerged = w.mergedFrom ? w.mergedFrom.toLowerCase().includes(query) : false;
      return matchName || matchMerged;
    });
  }, [wards, searchQuery]);

  const onAddressChangeRef = useRef(onAddressChange);
  useEffect(() => {
    onAddressChangeRef.current = onAddressChange;
  }, [onAddressChange]);

  // Compute Full Address & Notify parent
  useEffect(() => {
    if (onAddressChangeRef.current) {
      const parts: string[] = [];
      if (street.trim()) parts.push(street.trim());
      if (selectedWard) parts.push(selectedWard.fullName);
      if (selectedProvince) parts.push(selectedProvince.fullName);

      const fullAddr = parts.join(', ');
      onAddressChangeRef.current(fullAddr || initialAddress, {
        provinceName: selectedProvince?.fullName || '',
        districtName: selectedWard?.mergedFrom || '',
        wardName: selectedWard?.fullName || '',
        street: street.trim(),
        provinceId: selectedProvince?.id || undefined,
        wardId: selectedWard?.id || undefined,
      });
    }
  }, [selectedProvince, selectedWard, street, initialAddress]);

  const handleSelectProvince = (p: LocationItem) => {
    setSelectedProvince(p);
    setSelectedWard(null);
    setActiveStep('ward');
    setSearchQuery('');
    setIsListOpen(true);
  };

  const handleSelectWard = (w: WardItem) => {
    setSelectedWard(w);
    setSearchQuery('');
    setIsListOpen(false);
  };

  return (
    <div className="w-full space-y-4">
      {/* 2-STEP LOCATION SELECTOR CARD */}
      <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        {/* STEP HEADER NAVIGATION */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-100">
          <div className="relative flex flex-col gap-3">
            {/* Step 1: Province */}
            <div
              onClick={() => {
                if (disabled) return;
                setActiveStep('province');
                setSearchQuery('');
                setIsListOpen(true);
              }}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                activeStep === 'province'
                  ? 'bg-blue-50/80 border border-blue-200/80 shadow-xs'
                  : 'hover:bg-gray-100/70'
              }`}
            >
              <div className="flex flex-col items-center mt-0.5">
                <div
                  className={`w-3.5 h-3.5 rounded-full ring-4 transition-all ${
                    selectedProvince
                      ? 'bg-blue-600 ring-blue-100'
                      : activeStep === 'province'
                        ? 'bg-blue-600 ring-blue-100'
                        : 'bg-gray-300 ring-gray-100'
                  }`}
                />
                <div className="w-0.5 h-6 bg-gray-200 mt-1" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                  {selectedProvince ? selectedProvince.fullName : t('province')}
                </div>
                <div className="text-xs text-gray-500 truncate mt-0.5">
                  {selectedProvince
                    ? selectedProvince.mergedFrom || t('province')
                    : t('provinceSubtitle')}
                </div>
              </div>
            </div>

            {/* Step 2: Ward */}
            <div
              onClick={() => {
                if (disabled || !selectedProvince) return;
                setActiveStep('ward');
                setSearchQuery('');
                setIsListOpen(true);
              }}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                !selectedProvince
                  ? 'opacity-60 cursor-not-allowed'
                  : activeStep === 'ward'
                    ? 'bg-blue-50/80 border border-blue-200/80 shadow-xs cursor-pointer'
                    : 'hover:bg-gray-100/70 cursor-pointer'
              }`}
            >
              <div className="flex flex-col items-center mt-0.5">
                <div
                  className={`w-3.5 h-3.5 rounded-full ring-4 transition-all ${
                    selectedWard
                      ? 'bg-blue-600 ring-blue-100'
                      : activeStep === 'ward'
                        ? 'bg-blue-600 ring-blue-100'
                        : 'bg-gray-300 ring-gray-100'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                  {selectedWard ? selectedWard.fullName : t('ward')}
                </div>
                <div className="text-xs text-gray-500 truncate mt-0.5">
                  {selectedWard ? selectedWard.mergedFrom || t('ward') : t('wardSubtitle')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH BAR & LIST ACCORDION */}
        <div className="p-3">
          <div className="relative flex items-center">
            <input
              type="text"
              disabled={disabled || (activeStep === 'ward' && !selectedProvince)}
              placeholder={activeStep === 'province' ? t('searchProvince') : t('searchWard')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsListOpen(true)}
              className="w-full pl-3.5 pr-16 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-gray-900"
            />
            <div className="absolute right-2.5 flex items-center gap-1.5 text-gray-400">
              <Search className="w-4 h-4" />
              <button
                type="button"
                onClick={() => setIsListOpen(!isListOpen)}
                className="p-1 hover:text-gray-600 rounded transition-colors"
              >
                {isListOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* LIST ITEMS */}
          {isListOpen && (
            <div className="mt-2.5 max-h-64 overflow-y-auto divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
              {activeStep === 'province' ? (
                loadingProvinces ? (
                  <div className="py-8 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-xs">{t('loading')}</span>
                  </div>
                ) : filteredProvinces.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">{t('noResults')}</div>
                ) : (
                  filteredProvinces.map((p) => {
                    const isSelected = selectedProvince?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProvince(p)}
                        className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/80 text-blue-700'
                            : 'hover:bg-gray-50/80 text-gray-900'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="text-sm font-medium leading-snug">{p.fullName}</div>
                          {p.mergedFrom && (
                            <div className="text-xs text-gray-400 font-normal leading-normal mt-0.5">
                              {p.mergedFrom}
                            </div>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                      </button>
                    );
                  })
                )
              ) : loadingWards ? (
                <div className="py-8 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="text-xs">{t('loading')}</span>
                </div>
              ) : filteredWards.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">{t('noResults')}</div>
              ) : (
                filteredWards.map((w) => {
                  const isSelected = selectedWard?.id === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleSelectWard(w)}
                      className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/80 text-blue-700'
                          : 'hover:bg-gray-50/80 text-gray-900'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="text-sm font-medium leading-snug">{w.fullName}</div>
                        {w.mergedFrom && (
                          <div className="text-xs text-gray-400 font-normal leading-normal mt-0.5">
                            {w.mergedFrom}
                          </div>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* STREET / DETAILED ADDRESS INPUT */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">{t('street')} *</label>
        <input
          type="text"
          disabled={disabled}
          placeholder={t('streetPlaceholder')}
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm transition-colors text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
            error ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'
          }`}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
      </div>

      {/* FULL ADDRESS PREVIEW BOX */}
      {(selectedProvince || initialAddress) && (
        <div className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 shadow-inner">
          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mr-2 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-gray-800 mr-1">{t('recordedAddress')}</span>
            <span className="font-medium text-blue-700">
              {[street.trim(), selectedWard?.fullName, selectedProvince?.fullName]
                .filter(Boolean)
                .join(', ') || initialAddress}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
