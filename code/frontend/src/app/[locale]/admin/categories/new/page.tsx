'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { categoryService } from '@/services/category-service';
import { BaseButton, BaseInput } from '@/components/base';
import Link from 'next/link';
import { useToast } from '@/providers/toast-provider';

export default function AdminAddCategoryPage() {
  const t = useTranslations('admin.categories');
  const toast = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await categoryService.create(formData);
      toast.success(t('createSuccess'));
      router.push('/admin/categories');
    } catch (error) {
      console.error('Failed to create category', error);
      toast.error(t('createError'));
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]/g, '');
    setFormData((prev) => ({ ...prev, name, slug }));
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/categories" className="text-ink-2 hover:text-ink">
          ← {t('back')}
        </Link>
        <h1 className="text-2xl font-bold text-ink">{t('add_new')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-rule space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('name')}</label>
            <BaseInput value={formData.name} onChange={handleNameChange} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('slug')}</label>
            <BaseInput
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('description')}</label>
            <textarea
              className="w-full border p-2 rounded-lg"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: e.target.checked,
                }))
              }
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              {t('active')}
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <BaseButton type="submit" disabled={loading}>
            {loading ? t('saving') : t('saveCategory')}
          </BaseButton>
        </div>
      </form>
    </div>
  );
}
