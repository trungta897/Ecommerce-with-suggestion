'use client';

import { useState, useEffect, useCallback } from 'react';
import { locationService, LocationItem, WardItem } from '@/services/location-service';

export function useVietnameseLocations() {
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<WardItem[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<LocationItem | null>(null);
  const [selectedWard, setSelectedWard] = useState<WardItem | null>(null);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Fetch Provinces on Mount
  useEffect(() => {
    const fetchProvs = async () => {
      setLoadingProvinces(true);
      try {
        const data = await locationService.getProvinces();
        setProvinces(data);
      } catch (err) {
        console.error('Failed to fetch provinces:', err);
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
      } catch (err) {
        console.error('Failed to fetch wards:', err);
      } finally {
        setLoadingWards(false);
      }
    };
    void fetchWs();
  }, [selectedProvince]);

  const selectProvince = useCallback((p: LocationItem | null) => {
    setSelectedProvince(p);
    setSelectedWard(null);
  }, []);

  const selectWard = useCallback((w: WardItem | null) => {
    setSelectedWard(w);
  }, []);

  return {
    provinces,
    wards,
    selectedProvince,
    selectedWard,
    setSelectedProvince,
    setSelectedWard,
    selectProvince,
    selectWard,
    loadingProvinces,
    loadingWards,
  };
}
