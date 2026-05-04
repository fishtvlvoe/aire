import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SESSION_COOKIE, createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: '請輸入帳號與密碼' }, { status: 400 });
    }

    const user = db.prepare(
      "SELECT id, email, password_hash, display_name, role, is_active FROM users WHERE email = ? LIMIT 1"
    ).get(email) as { id: number; password_hash: string; is_active: number; role: string } | undefined;

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: '帳號已停用' }, { status: 403 });
    }

    const sessionId = createSession(user.id);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
