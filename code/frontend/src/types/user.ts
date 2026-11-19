export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  role: UserRole;
  isActive?: boolean;
  isVerified: boolean;
  vipPoints?: number;
  loyaltyPoints?: number;
  vipTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
