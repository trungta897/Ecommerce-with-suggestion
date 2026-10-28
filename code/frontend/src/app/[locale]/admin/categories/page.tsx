'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import toast from 'react-hot-toast';
import { BaseButton, BaseInput } from '@/components/base';
import { Plus, Edit, Eye, EyeOff, Search, Loader2 } from '@/components/base/icons';
import { CategoryEditModal } from '@/components/admin/categories/CategoryEditModal';
import { categoryService } from '@/services/category-service';
import { Category } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminCategoriesPage() {
  const locale = useLocale();
  const t = useTranslations('admin.categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [parentFilter, setParentFilter] = useState<string>('all');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleToggleStatus = async (category: Category) => {
    try {
      setTogglingId(category.id);
      const newStatus = !category.isActive;
      await categoryService.update(category.id, { isActive: newStatus });
      toast.success(t('update_success'));
      fetchCategories();
    } catch (error) {
      console.error('Failed to toggle category status', error);
      toast.error(t('update_error'));
    } finally {
      setTogglingId(null);
    }
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => {
      map.set(cat.id, cat.name);
    });
    return map;
  }, [categories]);

  const rootCategories = useMemo(() => {
    return categories.filter((cat) => !cat.parentId);
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      if (statusFilter === 'active' && cat.isActive === false) return false;
      if (statusFilter === 'inactive' && cat.isActive !== false) return false;

      if (parentFilter === 'root' && cat.parentId) return false;
      if (parentFilter !== 'all' && parentFilter !== 'root' && cat.parentId !== parentFilter) {
        return false;
      }

      return true;
    });
  }, [categories, searchQuery, statusFilter, parentFilter]);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('title')}</h1>
          <p className="text-xs text-ink-2 mt-1">
            {t('totalCategories', { count: filteredCategories.length })}
          </p>
        </div>
        <Link href={`/${locale}/admin/categories/new`}>
          <BaseButton className="gap-2">
            <Plus className="w-4 h-4" />
            {t('add_new')}
          </BaseButton>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
          <BaseInput
            placeholder={t('searchPlaceholder')}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="border border-rule rounded-xl px-3.5 py-2 text-sm bg-white text-ink focus:outline-none focus:border-primary shadow-xs"
        >
          <option value="all">{t('allStatuses')}</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </select>

        <select
          value={parentFilter}
          onChange={(e) => setParentFilter(e.target.value)}
          className="border border-rule rounded-xl px-3.5 py-2 text-sm bg-white text-ink focus:outline-none focus:border-primary shadow-xs"
        >
          <option value="all">{t('allParents')}</option>
          <option value="root">{t('onlyRoot')}</option>
          {rootCategories.map((rc) => (
            <option key={rc.id} value={rc.id}>
              {rc.name}
            </option>
          ))}
        </select>

        {(searchQuery || statusFilter !== 'all' || parentFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setParentFilter('all');
            }}
            className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
          >
            {t('resetFilter')}
          </button>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-rule overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-2 border-b border-rule bg-paper-2">
                <th className="px-5 py-3 font-medium">{t('name')}</th>
                <th className="px-5 py-3 font-medium">{t('slug')}</th>
                <th className="px-5 py-3 font-medium">{t('parent')}</th>
                <th className="px-5 py-3 font-medium">{t('status')}</th>
                <th className="px-5 py-3 font-medium text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-ink-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                    <span>{t('loadingCategories')}</span>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-ink-2">
                    {t('noData')}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => {
                  const parentName = category.parentId ? categoryMap.get(category.parentId) : null;
                  return (
                    <tr
                      key={category.id}
                      className="border-b border-rule last:border-0 hover:bg-paper-2 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {category.imageUrl ? (
                            <div className="w-10 h-10 bg-paper-2 rounded-lg flex-shrink-0 overflow-hidden relative border border-rule/50">
                              <Image
                                src={category.imageUrl}
                                alt={category.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : null}
                          <span className="font-medium text-ink truncate max-w-[240px]">
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-ink-2 font-mono text-xs">{category.slug}</td>
                      <td className="px-5 py-3 text-ink-2">
                        {parentName ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-paper-2 font-medium text-ink">
                            {parentName}
                          </span>
                        ) : (
                          <span className="text-ink-3 text-xs">{t('none_parent')}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {category.isActive ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            {t('active')}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            {t('inactive')}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="p-1.5 rounded-lg hover:bg-paper-2 text-ink-2 hover:text-primary transition-colors"
                            title={t('edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(category)}
                            disabled={togglingId === category.id}
                            className={`p-1.5 rounded-lg hover:bg-paper-2 transition-colors ${
                              category.isActive
                                ? 'text-ink-2 hover:text-orange-600'
                                : 'text-orange-500 hover:text-green-600'
                            }`}
                            title={category.isActive ? t('hide') : t('show')}
                          >
                            {togglingId === category.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : category.isActive ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Category Modal */}
      <CategoryEditModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
        allCategories={categories}
        onSuccess={fetchCategories}
      />
    </div>
  );
}
