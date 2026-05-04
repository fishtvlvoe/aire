import { NextRequest, NextResponse } from 'next/server';

// SESSION_COOKIE 常數，不 import db（Edge runtime 不支援 better-sqlite3）
const SESSION_COOKIE = 'session_id';
const PUBLIC_PATHS = [
  '/login',
  '/setup',
  '/license',
  '/api/auth/login',
  '/api/health',
  '/api/license/init',
  '/_next',
  '/favicon.ico',
];

/** 功能路由對應需要的 License 功能 key */
const FEATURE_ROUTE_MAP: Record<string, string> = {
  '/listings': 'disclosure-document',
  '/documents': 'disclosure-document',
};

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 只檢查 cookie 是否存在（UX redirect）；實際 session 有效性由 API routes 驗證
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Production 模式：必須有有效 License
  if (process.env.NEXT_PUBLIC_APP_MODE === 'production') {
    const licenseValid = req.cookies.get('license_valid')?.value === '1';
    if (!licenseValid && pathname !== '/setup') {
      return NextResponse.redirect(new URL('/setup', req.url));
    }
  }

  // 功能路由攔截（未授權功能 → 首頁）
  const featuresRaw = req.cookies.get('license_features')?.value;
  if (featuresRaw) {
    try {
      const features = JSON.parse(featuresRaw) as string[];
      for (const [route, requiredFeature] of Object.entries(FEATURE_ROUTE_MAP)) {
        if (pathname.startsWith(route) && !features.includes(requiredFeature)) {
          return NextResponse.redirect(new URL('/', req.url));
        }
      }
    } catch {
      // 解析失敗不阻塞
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
