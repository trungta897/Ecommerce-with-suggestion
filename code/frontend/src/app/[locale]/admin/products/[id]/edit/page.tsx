'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft } from '@/components/base/icons';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { productService, CreateProductInput } from '@/services/product-service';
import { Product } from '@/types';

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const locale = useLocale();
  const t = useTranslations('admin.products');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await productService.getById(id);
        if (data) setProduct(data);
      } catch (err: unknown) {
        console.error(err);
        toast.error(t('notFound'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, t]);

  const handleSubmit = async (data: CreateProductInput) => {
    try {
      setSubmitting(true);
      await productService.update(id, data);
      toast.success(t('success_update'));
      router.push(`/${locale}/admin/products`);
    } catch (err: unknown) {
      console.error(err);
      toast.error(t('error_update'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return <div className="p-8 text-center text-ink-2">{t('noData')}</div>;
  }

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
          <h1 className="text-2xl font-bold text-ink">{t('edit_product')}</h1>
          <p className="text-xs text-ink-2 mt-0.5">{product.name}</p>
        </div>
      </div>

      <ProductForm initialData={product} onSubmit={handleSubmit} isSubmitting={submitting} />
    </div>
  );
}
