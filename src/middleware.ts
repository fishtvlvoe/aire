import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

function isStaticAssetPath(pathname: string): boolean {
  return pathname.startsWith('/_next/') || pathname === '/favicon.ico';
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/login'
    || pathname === '/forgot-password'
    || pathname === '/reset-password'
    || pathname === '/admin/login'
    || pathname === '/setup'
    || pathname.startsWith('/setup/')
    || pathname === '/api/setup'
    || pathname.startsWith('/api/setup/')
    || pathname === '/api/license'
    || pathname.startsWith('/api/license/')
    || pathname.startsWith('/api/admin/')
    || pathname.startsWith('/api/auth/')
  );
}

function shouldSkipAuth(pathname: string): boolean {
  return isStaticAssetPath(pathname) || isPublicPath(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkipAuth(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export const runtime = 'nodejs';
