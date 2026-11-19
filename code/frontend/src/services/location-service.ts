import { apiClient } from './api-client';

export interface LocationItem {
  id: string;
  name: string;
  fullName: string;
  mergedFrom?: string | null;
}

export interface WardItem extends LocationItem {
  provinceId: string;
}

export interface DistrictItem extends LocationItem {
  provinceId: string;
}

export const locationService = {
  getProvinces: async (): Promise<LocationItem[]> => {
    try {
      const { data } = await apiClient.get('/locations/provinces');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getWards: async (provinceId: string): Promise<WardItem[]> => {
    if (!provinceId) return [];
    try {
      const { data } = await apiClient.get(`/locations/provinces/${provinceId}/wards`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  // Fallback for district APIs if called
  getDistricts: async (provinceId: string): Promise<DistrictItem[]> => {
    if (!provinceId) return [];
    try {
      const { data } = await apiClient.get(`/locations/provinces/${provinceId}/districts`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};
