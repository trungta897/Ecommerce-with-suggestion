'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { Loader2, ShieldAlert } from '@/components/base/icons';

interface AdminGuardProps {
  children: React.ReactNode;
}

const ALLOWED_ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'];

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Nếu không phải trang admin/login và chưa xác thực hoặc không có role hợp lệ
    const isLoginPage = pathname?.includes('/admin/login');
    if (isLoginPage) return;

    if (!isAuthenticated || !user || !ALLOWED_ADMIN_ROLES.includes(user.role)) {
      router.replace('/admin/login');
    }
  }, [mounted, isAuthenticated, user, pathname, router]);

  // Trong thời gian đợi hydrate từ localStorage
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-2">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-ink-2 font-medium">Đang khởi tạo...</p>
        </div>
      </div>
    );
  }

  const isLoginPage = pathname?.includes('/admin/login');
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Nếu không có quyền hợp lệ
  if (!isAuthenticated || !user || !ALLOWED_ADMIN_ROLES.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-2">
        <div className="flex flex-col items-center gap-3">
          <ShieldAlert className="w-10 h-10 text-orange-500" />
          <p className="text-sm text-ink font-semibold">Đang xác thực quyền truy cập...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
