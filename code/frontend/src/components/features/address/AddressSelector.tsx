'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { locationService, LocationItem, DistrictItem, WardItem } from '@/services/location-service';
import { Search, ChevronDown, Check, Loader2, MapPin } from '@/components/base/icons';

export interface AddressSelectorProps {
  initialAddress?: string;
  onAddressChange?: (
    fullAddress: string,
    details: {
      provinceName: string;
      districtName: string;
      wardName: string;
      street: string;
    }
  ) => void;
  error?: string;
  disabled?: boolean;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  initialAddress = '',
  onAddressChange,
  error,
  disabled = false,
}) => {
  const t = useTranslations('address');

  // Data State
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [wards, setWards] = useState<WardItem[]>([]);

  // Selection State
  const [selectedProvince, setSelectedProvince] = useState<LocationItem | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictItem | null>(null);
  const [selectedWard, setSelectedWard] = useState<WardItem | null>(null);
  const [street, setStreet] = useState<string>('');

  // Loading State
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Dropdown Open State
  const [openProv, setOpenProv] = useState(false);
  const [openDist, setOpenDist] = useState(false);
  const [openWard, setOpenWard] = useState(false);

  // Search Filter State
  const [searchProv, setSearchProv] = useState('');
  const [searchDist, setSearchDist] = useState('');
  const [searchWard, setSearchWard] = useState('');

  // Click Outside Refs
  const provRef = useRef<HTMLDivElement>(null);
  const distRef = useRef<HTMLDivElement>(null);
  const wardRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (provRef.current && !provRef.current.contains(e.target as Node)) setOpenProv(false);
      if (distRef.current && !distRef.current.contains(e.target as Node)) setOpenDist(false);
      if (wardRef.current && !wardRef.current.contains(e.target as Node)) setOpenWard(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Fetch Districts when Province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict(null);
      return;
    }
    const fetchDists = async () => {
      setLoadingDistricts(true);
      try {
        const data = await locationService.getDistricts(selectedProvince.id);
        setDistricts(data);
      } finally {
        setLoadingDistricts(false);
      }
    };
    void fetchDists();
  }, [selectedProvince]);

  // Fetch Wards when District changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard(null);
      return;
    }
    const fetchWs = async () => {
      setLoadingWards(true);
      try {
        const data = await locationService.getWards(selectedDistrict.id);
        setWards(data);
      } finally {
        setLoadingWards(false);
      }
    };
    void fetchWs();
  }, [selectedDistrict]);

  // Filtered lists
  const filteredProvinces = useMemo(
    () => provinces.filter((p) => p.fullName.toLowerCase().includes(searchProv.toLowerCase())),
    [provinces, searchProv]
  );

  const filteredDistricts = useMemo(
    () => districts.filter((d) => d.fullName.toLowerCase().includes(searchDist.toLowerCase())),
    [districts, searchDist]
  );

  const filteredWards = useMemo(
    () => wards.filter((w) => w.fullName.toLowerCase().includes(searchWard.toLowerCase())),
    [wards, searchWard]
  );

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
      if (selectedDistrict) parts.push(selectedDistrict.fullName);
      if (selectedProvince) parts.push(selectedProvince.fullName);

      const fullAddr = parts.join(', ');
      onAddressChangeRef.current(fullAddr || initialAddress, {
        provinceName: selectedProvince?.fullName || '',
        districtName: selectedDistrict?.fullName || '',
        wardName: selectedWard?.fullName || '',
        street: street.trim(),
      });
    }
  }, [selectedProvince, selectedDistrict, selectedWard, street, initialAddress]);

  return (
    <div className="w-full space-y-4">
      {/* 3 Column Grid for Locations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* PROVINCE DROPDOWN */}
        <div className="relative" ref={provRef}>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('province')} *
          </label>
          <button
            type="button"
            disabled={disabled || loadingProvinces}
            onClick={() => {
              setOpenProv(!openProv);
              setOpenDist(false);
              setOpenWard(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-xl text-sm font-medium transition-colors text-left ${
              openProv
                ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                : 'border-gray-300 hover:border-gray-400'
            } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
          >
            <span className={selectedProvince ? 'text-gray-900 truncate' : 'text-gray-400'}>
              {loadingProvinces
                ? t('loading')
                : selectedProvince
                  ? selectedProvince.fullName
                  : t('provincePlaceholder')}
            </span>
            {loadingProvinces ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0 ml-2" />
            ) : (
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
                  openProv ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {openProv && (
            <div className="absolute left-0 right-0 z-40 mt-1.5 p-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchProvince')}
                  value={searchProv}
                  onChange={(e) => setSearchProv(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                />
              </div>
              {filteredProvinces.length === 0 ? (
                <div className="py-3 text-center text-xs text-gray-400">{t('noResults')}</div>
              ) : (
                <div className="space-y-1">
                  {filteredProvinces.map((p) => {
                    const isSelected = selectedProvince?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProvince(p);
                          setSelectedDistrict(null);
                          setSelectedWard(null);
                          setOpenProv(false);
                          setSearchProv('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span>{p.fullName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DISTRICT DROPDOWN */}
        <div className="relative" ref={distRef}>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('district')} *
          </label>
          <button
            type="button"
            disabled={disabled || !selectedProvince || loadingDistricts}
            onClick={() => {
              setOpenDist(!openDist);
              setOpenProv(false);
              setOpenWard(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-xl text-sm font-medium transition-colors text-left ${
              openDist
                ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                : 'border-gray-300 hover:border-gray-400'
            } ${disabled || !selectedProvince ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
          >
            <span
              className={selectedDistrict ? 'text-gray-900 truncate' : 'text-gray-400 truncate'}
            >
              {loadingDistricts
                ? t('loading')
                : !selectedProvince
                  ? t('selectProvinceFirst')
                  : selectedDistrict
                    ? selectedDistrict.fullName
                    : t('districtPlaceholder')}
            </span>
            {loadingDistricts ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0 ml-2" />
            ) : (
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
                  openDist ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {openDist && selectedProvince && (
            <div className="absolute left-0 right-0 z-40 mt-1.5 p-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchDistrict')}
                  value={searchDist}
                  onChange={(e) => setSearchDist(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                />
              </div>
              {filteredDistricts.length === 0 ? (
                <div className="py-3 text-center text-xs text-gray-400">{t('noResults')}</div>
              ) : (
                <div className="space-y-1">
                  {filteredDistricts.map((d) => {
                    const isSelected = selectedDistrict?.id === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedDistrict(d);
                          setSelectedWard(null);
                          setOpenDist(false);
                          setSearchDist('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span>{d.fullName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* WARD DROPDOWN */}
        <div className="relative" ref={wardRef}>
          <label className="block text-xs font-semibold text-gray-700 mb-1">{t('ward')} *</label>
          <button
            type="button"
            disabled={disabled || !selectedDistrict || loadingWards}
            onClick={() => {
              setOpenWard(!openWard);
              setOpenProv(false);
              setOpenDist(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-xl text-sm font-medium transition-colors text-left ${
              openWard
                ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                : 'border-gray-300 hover:border-gray-400'
            } ${disabled || !selectedDistrict ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
          >
            <span className={selectedWard ? 'text-gray-900 truncate' : 'text-gray-400 truncate'}>
              {loadingWards
                ? t('loading')
                : !selectedDistrict
                  ? t('selectDistrictFirst')
                  : selectedWard
                    ? selectedWard.fullName
                    : t('wardPlaceholder')}
            </span>
            {loadingWards ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0 ml-2" />
            ) : (
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
                  openWard ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {openWard && selectedDistrict && (
            <div className="absolute left-0 right-0 z-40 mt-1.5 p-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchWard')}
                  value={searchWard}
                  onChange={(e) => setSearchWard(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900"
                />
              </div>
              {filteredWards.length === 0 ? (
                <div className="py-3 text-center text-xs text-gray-400">{t('noResults')}</div>
              ) : (
                <div className="space-y-1">
                  {filteredWards.map((w) => {
                    const isSelected = selectedWard?.id === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          setSelectedWard(w);
                          setOpenWard(false);
                          setSearchWard('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-600 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span>{w.fullName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* STREET INPUT */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">{t('street')} *</label>
        <input
          type="text"
          disabled={disabled}
          placeholder={t('streetPlaceholder')}
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm transition-colors text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 ${
            error ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'
          }`}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
      </div>

      {/* FULL ADDRESS PREVIEW BOX */}
      {(selectedProvince || initialAddress) && (
        <div className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 shadow-inner">
          <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0 mr-2 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-gray-800 mr-1">{t('recordedAddress')}</span>
            <span className="font-medium text-indigo-700">
              {[
                street.trim(),
                selectedWard?.fullName,
                selectedDistrict?.fullName,
                selectedProvince?.fullName,
              ]
                .filter(Boolean)
                .join(', ') || initialAddress}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
