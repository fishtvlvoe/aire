import { NextRequest, NextResponse } from 'next/server';
import {
  createSessionToken,
  verifyAdminPassword,
  buildSetCookieHeader,
  buildClearCookieHeader,
} from '../../../../lib/admin-session';

// 強制 Node runtime（bcrypt 不能跑 Edge）
export const runtime = 'nodejs';

const SESSION_TTL_SECONDS = 43_200; // 12 小時

export async function POST(req: NextRequest) {
  const passwordHash = process.env.LICENSE_ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!passwordHash || !sessionSecret) {
    return NextResponse.json({ error: 'admin_not_configured' }, { status: 503 });
  }

  let body: { password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_password' }, { status: 401 });
  }

  const password = typeof body.password === 'string' ? body.password : '';
  const ok = await verifyAdminPassword(password, passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'invalid_password' }, { status: 401 });
  }

  const token = createSessionToken(sessionSecret, SESSION_TTL_SECONDS);
  const setCookie = buildSetCookieHeader(token, SESSION_TTL_SECONDS);
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.headers.set('Set-Cookie', setCookie);
  return res;
}

export async function DELETE(_req: NextRequest) {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.headers.set('Set-Cookie', buildClearCookieHeader());
  return res;
}
