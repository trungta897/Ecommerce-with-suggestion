import { useTranslations } from 'next-intl';
import FilterSidebarVN from '@/components/category/FilterSidebarVN';
import ProductCardVN from '@/components/product/ProductCardVN';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { FilterIcon } from '@/components/base/icons';

export default function CategorySlugPage({ params }: { params: { slug: string } }) {
  const t = useTranslations('home.categories');
  const categoryProducts = MOCK_PRODUCTS.filter((p) => p.category === params.slug);

  // Safe translation key or fallback
  const categoryTitle = ['laptop', 'phone', 'tablet', 'accessory'].includes(params.slug)
    ? t(params.slug as Parameters<typeof t>[0])
    : params.slug;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb / Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-ink uppercase">{categoryTitle}</h1>
        <p className="text-ink-2 mt-2 text-sm">Hiển thị {categoryProducts.length} sản phẩm</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar - Hidden on mobile, can be toggled via button in real app */}
        <aside className="hidden lg:block w-full lg:w-1/4">
          <FilterSidebarVN />
        </aside>

        {/* Product Grid */}
        <main className="w-full lg:w-3/4">
          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden mb-4">
            <button className="w-full py-2 border border-rule rounded-lg text-ink font-medium bg-white shadow-sm flex justify-center items-center gap-2">
              <FilterIcon className="w-4 h-4" />
              Lọc sản phẩm
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {categoryProducts.map((product) => (
              <ProductCardVN key={product.id} product={product} />
            ))}
            {categoryProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted">
                Không tìm thấy sản phẩm nào trong danh mục này.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
