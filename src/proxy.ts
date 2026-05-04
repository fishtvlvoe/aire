import { NextRequest, NextResponse } from 'next/server';

// SESSION_COOKIE 常數，不 import db（Edge runtime 不支援 better-sqlite3）
const SESSION_COOKIE = 'session_id';
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/health', '/_next', '/favicon.ico'];

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
