import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Danh sách các ngôn ngữ được hỗ trợ
  locales: ['vi', 'en'],

  // Ngôn ngữ mặc định nếu không khớp
  defaultLocale: 'vi',
  
  // Tùy chọn: Ẩn /vi ở url mặc định (chỉ hiển thị domain.com thay vì domain.com/vi)
  localePrefix: 'as-needed'
});

export const config = {
  // Bỏ qua các đường dẫn API, _next/static, _next/image, favicon.ico...
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
