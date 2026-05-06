import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getCachedLicense } from '@/lib/license/server-verify';

function isExemptPath(pathname: string): boolean {
  return (
    pathname === '/login'
    || pathname.startsWith('/setup/')
    || pathname === '/setup'
    || pathname.startsWith('/api/setup/')
    || pathname === '/api/setup'
    || pathname.startsWith('/api/auth/')
    || pathname.startsWith('/_next/')
    || pathname === '/favicon.ico'
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isExemptPath(pathname)) {
    return NextResponse.next();
  }

  const license = getCachedLicense();
  if (!license?.valid) {
    return NextResponse.redirect(new URL('/setup', request.url));
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
