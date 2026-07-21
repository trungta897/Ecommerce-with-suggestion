export default function UserProfilePage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 flex gap-8">
      <div className="w-1/4 hidden md:block">
        <div className="bg-white p-6 rounded-xl border border-rule">
          <div className="w-16 h-16 bg-paper-2 rounded-full mb-4"></div>
          <h3 className="font-bold">Nguyễn Văn A</h3>
          <ul className="mt-6 space-y-4 text-sm text-ink-2">
            <li className="font-semibold text-primary">Đơn hàng của tôi</li>
            <li>Yêu thích</li>
            <li>Cài đặt</li>
          </ul>
        </div>
      </div>

      <div className="flex-1 space-y-8">
        <div className="bg-white p-6 rounded-xl border border-rule">
          <h2 className="text-xl font-bold mb-4">Đơn hàng gần đây</h2>
          <div className="text-sm text-muted">Chưa có đơn hàng nào.</div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100">
          <h2 className="text-lg font-bold text-purple-700 flex items-center gap-2 mb-4">
            ✨ AI Recommended For Your Setup
          </h2>
          <div className="text-sm text-muted">
            Dựa trên lịch sử mua hàng, đây là gợi ý cho bạn...
          </div>
        </div>
      </div>
    </div>
  );
}
