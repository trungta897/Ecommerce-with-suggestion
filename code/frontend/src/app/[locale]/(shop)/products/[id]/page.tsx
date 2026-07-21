export default function ProductDetailPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl flex items-center justify-center">
          {/* Product Image Placeholder */}
          <div className="text-muted">Product Image Here</div>
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold display-font">Smartphone Pro Max</h1>
          <div className="text-3xl font-bold text-primary">25.990.000₫</div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-lg">
            <h3 className="font-semibold text-purple-700 flex items-center gap-2">
              ✨ AI Review Summary
            </h3>
            <ul className="list-disc list-inside text-sm mt-2 text-ink-2">
              <li>Camera chụp đêm rất tốt</li>
              <li>Pin sử dụng được 2 ngày liên tục</li>
            </ul>
          </div>

          <button className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-bold text-lg">
            Mua Ngay
          </button>
        </div>
      </div>
    </div>
  );
}
