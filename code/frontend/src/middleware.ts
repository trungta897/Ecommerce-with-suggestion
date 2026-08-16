import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Cấu hình next-intl
const intlMiddleware = createMiddleware({
  locales: ['vi', 'en'],
  defaultLocale: 'vi',
  localePrefix: 'as-needed',
});

// Khởi tạo Redis & Ratelimit (chỉ khi có cấu hình để tránh lỗi crash)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit =
  redisUrl && redisToken
    ? new Ratelimit({
        redis: new Redis({
          url: redisUrl,
          token: redisToken,
        }),
        // Giới hạn 20 requests / 10 giây mỗi IP
        limiter: Ratelimit.slidingWindow(20, '10 s'),
      })
    : null;

export default async function middleware(request: NextRequest) {
  // 1. Rate Limit Check
  if (ratelimit && !request.nextUrl.pathname.includes('/too-many-requests')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      const url = request.nextUrl.clone();

      // Keep locale if it exists, otherwise prepend /vi
      const localeMatch = request.nextUrl.pathname.match(/^\/(vi|en)(\/|$)/);
      const currentLocale = localeMatch ? localeMatch[1] : 'vi';
      url.pathname = `/${currentLocale}/too-many-requests`;

      return NextResponse.rewrite(url, {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  }

  // 2. Kiểm tra HttpOnly Cookie (Route Protection Server-Side)
  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = pathname.replace(/^\/(vi|en)(\/|$)/, '/').replace(/\/$/, '') || '/';

  const protectedRoutes = ['/profile', '/orders'];
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

  const isProtectedRoute = protectedRoutes.some((route) => pathWithoutLocale.startsWith(route));
  const isAuthRoute = authRoutes.some(
    (route) => pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
  );

  const accessToken = request.cookies.get('access_token')?.value;

  const localeMatch = pathname.match(/^\/(vi|en)(\/|$)/);
  const currentLocale = localeMatch ? localeMatch[1] : 'vi';
  const localePrefix = localeMatch ? `/${currentLocale}` : '';

  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL(`${localePrefix}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && accessToken) {
    const homeUrl = new URL(`${localePrefix || '/'}`, request.url);
    return NextResponse.redirect(homeUrl);
  }

  // 3. Chuyển cho next-intl xử lý đa ngôn ngữ
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
