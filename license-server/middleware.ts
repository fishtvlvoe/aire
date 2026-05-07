import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifySessionTokenEdge } from './lib/admin-session-edge';

const SESSION_COOKIE_NAME = 'admin_session';

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

function isAdminPagePath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

function isAdminApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/admin');
}

function buildUnauthorizedResponse(req: NextRequest, error: 'admin_not_configured' | 'unauthorized') {
  if (isAdminPagePath(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/admin/login', req.url), 307);
  }

  return NextResponse.json({ error }, { status: 401 });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (pathname === '/api/admin/session' && req.method === 'POST') {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    return buildUnauthorizedResponse(req, 'admin_not_configured');
  }

  const result = await verifySessionTokenEdge(token, secret);
  if (!result.valid) {
    return buildUnauthorizedResponse(req, 'unauthorized');
  }

  return NextResponse.next();
}
