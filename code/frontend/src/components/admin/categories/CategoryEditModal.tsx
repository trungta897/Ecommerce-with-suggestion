'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { BaseModal, BaseButton, BaseInput } from '@/components/base';
import { Loader2 } from '@/components/base/icons';
import { Category } from '@/types';
import { categoryService } from '@/services/category-service';

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  allCategories: Category[];
  onSuccess: () => void;
}

export const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  isOpen,
  onClose,
  category,
  allCategories,
  onSuccess,
}) => {
  const t = useTranslations('admin.categories');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setSlug(category.slug || '');
      setDescription(category.description || '');
      setImageUrl(category.imageUrl || '');
      setParentId(category.parentId || '');
      setIsActive(category.isActive !== undefined ? category.isActive : true);
    }
  }, [category]);

  if (!category) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      await categoryService.update(category.id, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        parentId: parentId || undefined,
        isActive,
      });
      toast.success(t('update_success'));
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      toast.error(t('update_error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Filter out the category itself from parent options
  const eligibleParents = allCategories.filter((c) => c.id !== category.id);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t('edit_modal_title')}>
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t('name')} <span className="text-red-500">*</span>
          </label>
          <BaseInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('name')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t('slug')} <span className="text-red-500">*</span>
          </label>
          <BaseInput
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={t('slug')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('parent')}</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-rule text-sm bg-white focus:outline-none focus:border-primary text-ink"
          >
            <option value="">{t('none_parent')}</option>
            {eligibleParents.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('image')}</label>
          <BaseInput
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('description')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full p-3 text-sm rounded-xl border border-rule focus:outline-none focus:border-primary text-ink resize-none"
            placeholder={t('description')}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="category-active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border-rule"
          />
          <label htmlFor="category-active" className="text-sm font-medium text-ink cursor-pointer">
            {t('active')}
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-rule">
          <BaseButton type="button" variant="outline" onClick={onClose} disabled={submitting}>
            {t('cancel')}
          </BaseButton>
          <BaseButton type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('save_changes')
            )}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
};
