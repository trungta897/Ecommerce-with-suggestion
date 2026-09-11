'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function AdminReturnsPage() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    router.replace(`/${locale}/admin/orders?status=RETURN_REQUESTED`);
  }, [router, locale]);

  return (
    <div className="p-8 flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
