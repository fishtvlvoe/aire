import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { createPasswordResetToken } from '@/lib/auth/password-reset-token';

const FORGOT_PASSWORD_MESSAGE = '如果帳號存在，重設連結已發送至您的信箱';

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: '請輸入 Email' }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: '請輸入 Email' }, { status: 400 });
  }

  const user = db
    .prepare('SELECT id FROM users WHERE email = ? LIMIT 1')
    .get(email) as { id: number } | undefined;

  if (user) {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('forgot-password 缺少 NEXTAUTH_SECRET，略過寄送重設信');
    } else {
      const token = createPasswordResetToken(email, secret, { expiresInSeconds: 15 * 60 });
      const baseUrl = process.env.NEXTAUTH_URL?.trim() || new URL(request.url).origin;
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
      await sendPasswordResetEmail(email, resetUrl);
    }
  }

  return NextResponse.json({ message: FORGOT_PASSWORD_MESSAGE });
}

export { FORGOT_PASSWORD_MESSAGE };
