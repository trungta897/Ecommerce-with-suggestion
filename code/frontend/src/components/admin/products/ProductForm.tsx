'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations, useLocale } from 'next-intl';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { BaseButton, BaseInput } from '@/components/base';
import { Upload, Plus, Trash2, Loader2, Sparkles } from '@/components/base/icons';
import { Category, Product } from '@/types';
import { categoryService } from '@/services/category-service';
import { productService, CreateProductInput } from '@/services/product-service';
import { USD_TO_VND_RATE } from '@/constants/currency';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

interface SpecItem {
  key: string;
  value: string;
}

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  isSubmitting?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
}) => {
  const t = useTranslations('admin.products');
  const locale = useLocale();
  const initialPrice = initialData?.price
    ? locale === 'en'
      ? Number((Number(initialData.price) / USD_TO_VND_RATE).toFixed(2))
      : Math.round(Number(initialData.price))
    : 0;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Specifications state
  const [specs, setSpecs] = useState<SpecItem[]>(() => {
    if (initialData?.specifications && typeof initialData.specifications === 'object') {
      return Object.entries(initialData.specifications).map(([key, value]) => ({
        key,
        value: String(value),
      }));
    }
    return [
      { key: 'CPU', value: '' },
      { key: 'RAM', value: '' },
      { key: 'Storage', value: '' },
    ];
  });

  // Images state
  const [images, setImages] = useState<string[]>(() => {
    if (initialData?.images && Array.isArray(initialData.images)) {
      return initialData.images.map((img) => (typeof img === 'string' ? img : img.url));
    }
    return initialData?.thumbnailUrl ? [initialData.thumbnailUrl] : [];
  });
  const [isUploading, setIsUploading] = useState(false);

  const productSchema = z.object({
    name: z.string().min(3, t('validation_name')),
    slug: z.string().min(1, t('validation_slug')),
    categoryId: z.string().min(1, t('validation_category')),
    brand: z.string().optional(),
    price: z.number().min(0, t('validation_price')),
    stock: z.number().min(0, t('validation_stock')),
    description: z.string().optional(),
    isActive: z.boolean(),
  });

  type ProductFormData = z.infer<typeof productSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      categoryId: initialData?.categoryId || '',
      brand: initialData?.brand || '',
      price: initialPrice,
      stock: initialData?.stock || 0,
      description: initialData?.description || '',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    },
  });

  const watchName = watch('name');
  const watchBrand = watch('brand');

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        const data = await categoryService.getAll();
        setCategories(data);
      } catch (err: unknown) {
        console.error('Failed to load categories', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('name', val);
    if (!initialData) {
      setValue('slug', slugify(val));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await productService.uploadImage(file);
      setImages((prev) => [...prev, url]);
      toast.success(t('upload_success'));
    } catch (err: unknown) {
      console.error(err);
      toast.error(t('upload_error'));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSpec = () => {
    setSpecs((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    setSpecs((prev) => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAutoGenerateDescription = () => {
    if (!watchName?.trim()) {
      toast.error(t('auto_desc_prompt'));
      return;
    }

    const brandText = watchBrand?.trim() ? ` ${t('brand_prefix')} ${watchBrand.trim()}` : '';
    const specLines = specs
      .filter((s) => s.key.trim() && s.value.trim())
      .map((s) => `- **${s.key.trim()}**: ${s.value.trim()}`)
      .join('\n');

    const generatedTemplate = `### ${t('desc_intro_title')}
${t('desc_intro_body', { name: watchName.trim(), brand: brandText })}

### ${t('desc_highlights_title')}
${t('desc_h1')}
${t('desc_h2')}
${t('desc_h3')}
${t('desc_h4')}

${specLines ? `### ${t('desc_specs_title')}\n${specLines}\n` : ''}
### ${t('desc_warranty_title')}
${t('desc_w1')}
${t('desc_w2')}
${t('desc_w3')}`;

    setValue('description', generatedTemplate);
    toast.success(t('auto_desc_success'));
  };

  const onFormSubmit = async (data: ProductFormData) => {
    const specRecord: Record<string, unknown> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        specRecord[s.key.trim()] = s.value.trim();
      }
    });

    let finalPrice = Number(data.price);
    if (locale === 'en') {
      finalPrice = Math.round(finalPrice * USD_TO_VND_RATE);
    }

    const payload: CreateProductInput = {
      name: data.name.trim(),
      slug: data.slug.trim(),
      categoryId: data.categoryId,
      brand: data.brand?.trim() || undefined,
      price: finalPrice,
      stock: data.stock,
      description: data.description?.trim() || undefined,
      specifications: Object.keys(specRecord).length > 0 ? specRecord : undefined,
      images: images.length > 0 ? images : undefined,
      isActive: data.isActive,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info & Specs (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-rule space-y-4">
            <h2 className="text-base font-semibold text-ink border-b border-rule pb-3">
              {t('general_info')}
            </h2>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                {t('product_name')} <span className="text-red-500">*</span>
              </label>
              <BaseInput
                placeholder={t('name_placeholder')}
                {...register('name')}
                onChange={handleNameChange}
                error={errors.name?.message}
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                {t('slug')} <span className="text-red-500">*</span>
              </label>
              <BaseInput
                placeholder={t('slug_placeholder')}
                {...register('slug')}
                error={errors.slug?.message}
              />
            </div>

            {/* Brand & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t('brand')}</label>
                <BaseInput placeholder={t('brand_placeholder')} {...register('brand')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  {t('category')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('categoryId')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-rule text-sm bg-white focus:outline-none focus:border-primary text-ink"
                  disabled={loadingCategories}
                >
                  <option value="">-- {t('select_category')} --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-xs text-red-500 mt-1">{errors.categoryId.message}</p>
                )}
              </div>
            </div>

            {/* Price & Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  {t('price')} <span className="text-red-500">*</span>
                </label>
                <BaseInput
                  type="number"
                  step={locale === 'en' ? '0.01' : '1000'}
                  placeholder="0"
                  {...register('price', { valueAsNumber: true })}
                  error={errors.price?.message}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  {t('stock')} <span className="text-red-500">*</span>
                </label>
                <BaseInput
                  type="number"
                  placeholder="0"
                  {...register('stock', { valueAsNumber: true })}
                  error={errors.stock?.message}
                />
              </div>
            </div>
          </div>

          {/* Description with Auto-generate button */}
          <div className="bg-white p-6 rounded-xl border border-rule space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h2 className="text-base font-semibold text-ink">{t('description')}</h2>
              <button
                type="button"
                onClick={handleAutoGenerateDescription}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t('generate_desc')}
              </button>
            </div>
            <textarea
              {...register('description')}
              rows={8}
              placeholder={t('description_placeholder')}
              className="w-full p-3.5 text-sm rounded-xl border border-rule focus:outline-none focus:border-primary text-ink resize-y font-mono leading-relaxed"
            />
          </div>

          {/* Specifications */}
          <div className="bg-white p-6 rounded-xl border border-rule space-y-4">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h2 className="text-base font-semibold text-ink">{t('specifications')}</h2>
              <button
                type="button"
                onClick={handleAddSpec}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('add_spec')}
              </button>
            </div>
            <div className="space-y-3">
              {specs.map((spec, index) => (
                <div key={index} className="flex items-center gap-3">
                  <BaseInput
                    placeholder={t('spec_key')}
                    value={spec.key}
                    onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <BaseInput
                    placeholder={t('spec_val')}
                    value={spec.value}
                    onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(index)}
                    className="p-2 text-ink-2 hover:text-red-500 rounded-lg hover:bg-paper-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Images & Status (1 col) */}
        <div className="space-y-6">
          {/* Images Upload */}
          <div className="bg-white p-6 rounded-xl border border-rule space-y-4">
            <h2 className="text-base font-semibold text-ink border-b border-rule pb-3">
              {t('images')}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {images.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg border border-rule overflow-hidden group bg-paper-2"
                >
                  <Image src={img} alt="Product" fill className="object-contain" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t('remove_image')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-rule rounded-xl p-6 cursor-pointer hover:border-primary transition-colors bg-paper-2/50">
              <Upload className="w-8 h-8 text-ink-2 mb-2" />
              <span className="text-xs font-semibold text-primary">
                {isUploading ? t('uploading') : t('upload_image')}
              </span>
              <span className="text-[10px] text-ink-2 mt-1">{t('image_hint')}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Visibility / Status */}
          <div className="bg-white p-6 rounded-xl border border-rule space-y-4">
            <h2 className="text-base font-semibold text-ink border-b border-rule pb-3">
              {t('status')}
            </h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-rule"
              />
              <span className="text-sm font-medium text-ink">{t('active')}</span>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="bg-white p-6 rounded-xl border border-rule space-y-3">
            <BaseButton
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                t('save')
              )}
            </BaseButton>
          </div>
        </div>
      </div>
    </form>
  );
};
