import { useTranslations } from 'next-intl';

export default function AdminAddProductPage() {
  const t = useTranslations('admin.products');
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('add_new')}</h1>

      <div className="flex gap-6">
        <div className="flex-1 space-y-4">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-rule">
            {/* Product Form */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t('product_name')}</label>
              <input type="text" className="w-full border p-2 rounded" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t('price')}</label>
              <input type="text" className="w-full border p-2 rounded" />
            </div>
          </div>
        </div>

        <div className="w-1/3">
          <div className="p-6 bg-paper-2 rounded-lg border-2 border-purple-300">
            <button className="w-full py-2 bg-gradient-ai text-white rounded-lg font-semibold flex items-center justify-center gap-2">
              {t('generate_desc')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
