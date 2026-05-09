import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { getCachedLicense } from '@/lib/license/server-verify';

function isStaticAssetPath(pathname: string): boolean {
  return pathname.startsWith('/_next/') || pathname === '/favicon.ico';
}

function isSetupOrPublicApiPath(pathname: string): boolean {
  return (
    pathname === '/setup'
    || pathname.startsWith('/setup/')
    || pathname === '/api/setup'
    || pathname.startsWith('/api/setup/')
    || pathname === '/api/license'
    || pathname.startsWith('/api/license/')
    || pathname.startsWith('/api/auth/')
  );
}

function hasUsers(): boolean {
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number } | undefined;
  return (row?.count ?? 0) > 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 靜態資源永遠放行
  if (isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  // 開發模式：跳過 License 檢查，但仍須建管理員和登入
  if (process.env.SKIP_LICENSE === 'true') {
    if (isSetupOrPublicApiPath(pathname) || pathname === '/login') {
      return NextResponse.next();
    }
    let usersExist = false;
    try { usersExist = hasUsers(); } catch { /* users 表尚未建立 */ }
    if (!usersExist) {
      return NextResponse.redirect(new URL('/setup/admin', request.url));
    }
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  const license = getCachedLicense();

  // License 尚未有效：只允許進入 setup 流程與 license 初始化 API（避免 setup UI fetch 被重導）
  if (!license?.valid) {
    // /setup/admin 是「License 有效後」才會進入的步驟，因此在此不放行
    if (isSetupOrPublicApiPath(pathname) && pathname !== '/setup/admin') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  // License 有效但尚未建立管理員 → 重導到 /setup/admin
  if (!hasUsers() && pathname !== '/setup/admin' && !pathname.startsWith('/api/setup/')) {
    return NextResponse.redirect(new URL('/setup/admin', request.url));
  }

  // setup 與 public API 放行（不需 token）
  if (isSetupOrPublicApiPath(pathname) || pathname === '/login') {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export const runtime = 'nodejs';
