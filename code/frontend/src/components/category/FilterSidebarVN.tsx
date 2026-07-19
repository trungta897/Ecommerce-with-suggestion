import { useTranslations } from 'next-intl';

export default function FilterSidebarVN() {
  const t = useTranslations('product'); // Should be common or category if defined
  return (
    <div className="space-y-6">
      {/* AI Filter */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100">
        <h3 className="font-semibold text-purple-700 flex items-center gap-2 mb-3">
          ✨ Trợ lý AI Tìm kiếm
        </h3>
        <textarea 
          placeholder="Bạn cần máy để làm gì? (VD: chơi game, học tập, đồ họa...)"
          className="w-full text-sm p-3 rounded-lg border border-purple-200 focus:outline-none focus:border-purple-500 bg-white"
          rows={3}
        ></textarea>
        <button className="w-full mt-3 bg-gradient-ai text-white text-sm font-medium py-2 rounded-lg">
          Lọc thông minh
        </button>
      </div>

      <hr className="border-rule" />

      {/* Brand Filter */}
      <div>
        <h3 className="font-bold mb-3 text-ink">Hãng sản xuất</h3>
        <div className="space-y-2">
          {['Apple', 'Samsung', 'ASUS', 'Dell', 'HP', 'Lenovo'].map(brand => (
            <label key={brand} className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer">
              <input type="checkbox" className="rounded text-primary focus:ring-primary" />
              {brand}
            </label>
          ))}
        </div>
      </div>

      <hr className="border-rule" />

      {/* Price Filter */}
      <div>
        <h3 className="font-bold mb-3 text-ink">Mức giá</h3>
        <div className="space-y-2">
          {['Dưới 10 triệu', '10 - 20 triệu', '20 - 30 triệu', 'Trên 30 triệu'].map(price => (
            <label key={price} className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer">
              <input type="checkbox" className="rounded text-primary focus:ring-primary" />
              {price}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
