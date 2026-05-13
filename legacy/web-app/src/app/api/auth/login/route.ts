import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, createSession } from '@/lib/auth';
import { validateLoginInput } from '@/lib/auth/credentials-login';

export async function POST(req: NextRequest) {
  try {
    const { email, password, licenseKey } = (await req.json()) as {
      email?: string;
      password?: string;
      licenseKey?: string;
    };

    const result = await validateLoginInput({
      email: email ?? '',
      password: password ?? '',
      licenseKey,
      requireLicense: true,
      requireAdmin: false,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const sessionId = createSession(result.user.id);

    const res = NextResponse.json({ success: true, ok: true });
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
