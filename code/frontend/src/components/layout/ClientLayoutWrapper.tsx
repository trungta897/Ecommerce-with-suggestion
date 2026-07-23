'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface ClientLayoutWrapperProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export function ClientLayoutWrapper({ header, footer, children }: ClientLayoutWrapperProps) {
  const pathname = usePathname();
  // Hide header and footer for admin routes
  const isAdmin = pathname.includes('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdmin && header}
      <main className="flex-1">{children}</main>
      {!isAdmin && footer}
    </div>
  );
}
