import { UserRole } from '@/types';

export const ROLE_COLORS: Record<UserRole | string, string> = {
  [UserRole.CUSTOMER]: 'bg-blue-100 text-blue-800 border-blue-200',
  [UserRole.EMPLOYEE]: 'bg-green-100 text-green-800 border-green-200',
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
  [UserRole.SUPER_ADMIN]: 'bg-red-100 text-red-800 border-red-200',
};
