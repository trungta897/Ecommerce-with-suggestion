'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft } from '@/components/base/icons';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { productService, CreateProductInput } from '@/services/product-service';

export default function AdminAddProductPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('admin.products');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: CreateProductInput) => {
    try {
      setSubmitting(true);
      await productService.create(data);
      toast.success(t('success_create'));
      router.push(`/${locale}/admin/products`);
    } catch (err: unknown) {
      console.error(err);
      toast.error(t('error_create'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/admin/products`}
          className="p-2 rounded-xl border border-rule hover:bg-paper-2 text-ink-2 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('add_new')}</h1>
          <p className="text-xs text-ink-2 mt-0.5">{t('title')}</p>
        </div>
      </div>

      <ProductForm onSubmit={handleSubmit} isSubmitting={submitting} />
    </div>
  );
}
