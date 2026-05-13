import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { writeAuditLog } from '@/lib/audit';
import { db } from '@/lib/db';
import { verifyPasswordResetToken } from '@/lib/auth/password-reset-token';

const PASSWORD_BCRYPT_COST = 10;

export async function POST(request: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = (await request.json()) as { token?: string; password?: string };
  } catch {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }

  const token = body.token?.trim();
  const password = body.password;
  if (!token || !password) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: '重設連結無效' }, { status: 401 });
  }

  const verified = verifyPasswordResetToken(token, secret);
  if (!verified.ok) {
    if (verified.error === 'expired') {
      return NextResponse.json({ error: '重設連結已過期，請重新申請' }, { status: 401 });
    }
    return NextResponse.json({ error: '重設連結無效' }, { status: 401 });
  }

  const user = db
    .prepare('SELECT id FROM users WHERE email = ? LIMIT 1')
    .get(verified.email) as { id: number } | undefined;
  if (!user) {
    return NextResponse.json({ error: '重設連結無效' }, { status: 401 });
  }

  const nextHash = await bcrypt.hash(password, PASSWORD_BCRYPT_COST);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .run(nextHash, user.id);
  writeAuditLog(null, 'PASSWORD_RESET', 'user', user.id, 'Forgot-password token flow');

  return NextResponse.json({ message: '密碼已重設，請重新登入' });
}

export { PASSWORD_BCRYPT_COST };
