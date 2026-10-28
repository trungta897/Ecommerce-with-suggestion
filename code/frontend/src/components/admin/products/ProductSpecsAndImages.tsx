'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BaseInput } from '@/components/base';
import { Plus, Trash2, Upload } from '@/components/base/icons';
import type { Product } from '@/types';

export interface SpecItem {
  key: string;
  value: string;
}

export function getInitialSpecs(initialData?: Product): SpecItem[] {
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
}

export function getInitialImages(initialData?: Product): string[] {
  if (initialData?.images && Array.isArray(initialData.images)) {
    return initialData.images.map((img) => (typeof img === 'string' ? img : img.url));
  }
  return initialData?.thumbnailUrl ? [initialData.thumbnailUrl] : [];
}

export function slugifyProductName(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function buildAutoProductDescription(
  t: (key: string, values?: Record<string, string | number>) => string,
  name: string,
  brand: string | undefined,
  specs: SpecItem[]
): string {
  const brandText = brand?.trim() ? ` ${t('brand_prefix')} ${brand.trim()}` : '';
  const specLines = specs
    .filter((s) => s.key.trim() && s.value.trim())
    .map((s) => `- **${s.key.trim()}**: ${s.value.trim()}`)
    .join('\n');

  return [
    `### ${t('desc_intro_title')}`,
    t('desc_intro_body', { name: name.trim(), brand: brandText }),
    '',
    `### ${t('desc_highlights_title')}`,
    t('desc_h1'),
    t('desc_h2'),
    t('desc_h3'),
    t('desc_h4'),
    '',
    ...(specLines ? [`### ${t('desc_specs_title')}`, specLines, ''] : []),
    `### ${t('desc_warranty_title')}`,
    t('desc_w1'),
    t('desc_w2'),
    t('desc_w3'),
  ].join('\n');
}

interface ProductSpecsSectionProps {
  specs: SpecItem[];
  onAddSpec: () => void;
  onSpecChange: (index: number, field: 'key' | 'value', value: string) => void;
  onRemoveSpec: (index: number) => void;
}

export const ProductSpecsSection: React.FC<ProductSpecsSectionProps> = ({
  specs,
  onAddSpec,
  onSpecChange,
  onRemoveSpec,
}) => {
  const t = useTranslations('admin.products');

  return (
    <div className="bg-white p-6 rounded-xl border border-rule space-y-4">
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <h2 className="text-base font-semibold text-ink">{t('specifications')}</h2>
        <button
          type="button"
          onClick={onAddSpec}
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
              onChange={(e) => onSpecChange(index, 'key', e.target.value)}
              className="flex-1"
            />
            <BaseInput
              placeholder={t('spec_val')}
              value={spec.value}
              onChange={(e) => onSpecChange(index, 'value', e.target.value)}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => onRemoveSpec(index)}
              className="p-2 text-ink-2 hover:text-red-500 rounded-lg hover:bg-paper-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ProductImagesSectionProps {
  images: string[];
  isUploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

export const ProductImagesSection: React.FC<ProductImagesSectionProps> = ({
  images,
  isUploading,
  onUpload,
  onRemoveImage,
}) => {
  const t = useTranslations('admin.products');

  return (
    <div className="bg-white p-6 rounded-xl border border-rule space-y-4">
      <h2 className="text-base font-semibold text-ink border-b border-rule pb-3">{t('images')}</h2>

      <div className="grid grid-cols-2 gap-3">
        {images.map((img, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg border border-rule overflow-hidden group bg-paper-2"
          >
            <Image src={img} alt="Product" fill className="object-contain" />
            <button
              type="button"
              onClick={() => onRemoveImage(index)}
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
          onChange={onUpload}
          disabled={isUploading}
          className="hidden"
        />
      </label>
    </div>
  );
};
