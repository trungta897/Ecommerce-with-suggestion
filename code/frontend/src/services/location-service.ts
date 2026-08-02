import { apiClient } from './api-client';

export interface LocationItem {
  id: string;
  name: string;
  fullName: string;
}

export interface DistrictItem extends LocationItem {
  provinceId: string;
}

export interface WardItem extends LocationItem {
  districtId: string;
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

  getDistricts: async (provinceId: string): Promise<DistrictItem[]> => {
    if (!provinceId) return [];
    try {
      const { data } = await apiClient.get(`/locations/provinces/${provinceId}/districts`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  getWards: async (districtId: string): Promise<WardItem[]> => {
    if (!districtId) return [];
    try {
      const { data } = await apiClient.get(`/locations/districts/${districtId}/wards`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
};
