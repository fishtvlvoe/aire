import { NextResponse } from 'next/server';
import {
  createRefreshToken,
  generateRefreshToken,
  getValidRefreshToken,
  revokeRefreshToken,
} from '@/lib/auth/db';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function readCookie(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) return null;
  const chunks = cookieHeader.split(';').map((chunk) => chunk.trim());
  const target = chunks.find((chunk) => chunk.startsWith(`${key}=`));
  if (!target) return null;
  return decodeURIComponent(target.slice(key.length + 1));
}

export async function POST(request: Request) {
  const oldRefreshToken = readCookie(request.headers.get('cookie'), REFRESH_COOKIE_NAME);
  if (!oldRefreshToken) {
    return NextResponse.json({ error: 'invalid-refresh-token' }, { status: 401 });
  }

  const existing = getValidRefreshToken(oldRefreshToken);
  if (!existing) {
    return NextResponse.json({ error: 'invalid-refresh-token' }, { status: 401 });
  }

  revokeRefreshToken(oldRefreshToken);

  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();
  createRefreshToken(existing.user_id, newRefreshToken, expiresAt);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(REFRESH_COOKIE_NAME, newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
  return response;
}

