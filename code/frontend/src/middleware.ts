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

  const accessToken = request.cookies.get('access_token')?.value;

  const localeMatch = pathname.match(/^\/(vi|en)(\/|$)/);
  const currentLocale = localeMatch ? localeMatch[1] : 'vi';
  const localePrefix = localeMatch ? `/${currentLocale}` : '';

  // NOTE: UX gate only, không thay thế xác thực Backend — mọi request API vẫn phải qua AuthGuard('jwt') verify signature đầy đủ.
  // Mục đích: Redirect nhanh ở tầng Server Edge, cải thiện trải nghiệm và ngăn chặn visual flash giao diện Admin.
  if (pathWithoutLocale.startsWith('/admin')) {
    const isAdminLogin = pathWithoutLocale === '/admin/login';
    const jwtPayload = accessToken ? parseJwtPayload(accessToken) : null;
    const userRole = jwtPayload?.role;
    const isInternalStaff = userRole && ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'].includes(userRole);

    if (isAdminLogin) {
      if (isInternalStaff) {
        return NextResponse.redirect(new URL(`${localePrefix}/admin/dashboard`, request.url));
      }
      return intlMiddleware(request);
    }

    // Với mọi route /admin/* khác ngoài /admin/login
    if (!accessToken || !userRole) {
      return NextResponse.redirect(new URL(`${localePrefix}/admin/login`, request.url));
    }

    if (userRole === 'CUSTOMER') {
      return NextResponse.redirect(new URL(`${localePrefix || '/'}`, request.url));
    }

    // Phân quyền cho Nhân viên (EMPLOYEE)
    if (userRole === 'EMPLOYEE') {
      const allowedEmployeePaths = [
        '/admin',
        '/admin/dashboard',
        '/admin/orders',
        '/admin/reviews',
      ];
      const isAllowedForEmployee = allowedEmployeePaths.some(
        (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
      );

      if (!isAllowedForEmployee) {
        return NextResponse.redirect(new URL(`${localePrefix}/admin/dashboard`, request.url));
      }
    }

    // ADMIN và SUPER_ADMIN được phép truy cập tất cả các route admin (bao gồm cả /admin/users)
    return intlMiddleware(request);
  }

  const isProtectedRoute = protectedRoutes.some((route) => pathWithoutLocale.startsWith(route));
  const isAuthRoute = authRoutes.some(
    (route) => pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
  );

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

// NOTE: UX gate helper giải mã payload JWT từ Base64
function parseJwtPayload(token: string): { sub?: string; email?: string; role?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
