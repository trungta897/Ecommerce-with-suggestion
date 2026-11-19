import { useTranslations } from 'next-intl';
import { CATEGORY_BRANDS, CATEGORY_PRICE_RANGES } from '@/constants';

export default function FilterSidebar() {
  const t = useTranslations('category.sidebar');

  return (
    <div className="space-y-6">
      {/* AI Filter */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100">
        <h3 className="font-semibold text-purple-700 flex items-center gap-2 mb-3">
          {t('ai_assistant')}
        </h3>
        <textarea
          placeholder={t('ai_placeholder')}
          className="w-full text-sm p-3 rounded-lg border border-purple-200 focus:outline-none focus:border-purple-500 bg-white"
          rows={3}
        ></textarea>
        <button className="w-full mt-3 bg-gradient-ai text-white text-sm font-medium py-2 rounded-lg">
          {t('ai_filter_btn')}
        </button>
      </div>

      <hr className="border-rule" />

      {/* Brand Filter */}
      <div>
        <h3 className="font-bold mb-3 text-ink">{t('brands')}</h3>
        <div className="space-y-2">
          {CATEGORY_BRANDS.map((brand) => (
            <label
              key={brand}
              className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer"
            >
              <input type="checkbox" className="rounded text-primary focus:ring-primary" />
              {brand}
            </label>
          ))}
        </div>
      </div>

      <hr className="border-rule" />

      {/* Price Filter */}
      <div>
        <h3 className="font-bold mb-3 text-ink">{t('price_range')}</h3>
        <div className="space-y-2">
          {CATEGORY_PRICE_RANGES.map((priceKey) => (
            <label
              key={priceKey}
              className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer"
            >
              <input type="checkbox" className="rounded text-primary focus:ring-primary" />
              {t(priceKey)}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
