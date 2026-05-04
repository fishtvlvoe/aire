import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { writeAuditLog } from '@/lib/audit';
import { SESSION_COOKIE, getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  const currentUser = sessionId ? getSessionUser(sessionId) : null;
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const { email, display_name, password } = (await req.json()) as {
    email?: string;
    display_name?: string;
    password?: string;
  };

  if (!email || !display_name || !password) {
    return NextResponse.json({ error: '請填寫完整資訊' }, { status: 400 });
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(
      "INSERT INTO users (email, password_hash, display_name, role) VALUES (?, ?, ?, 'agent') RETURNING id, email, display_name, role"
    ).get(email, hash, display_name) as { id: number; email: string; display_name: string; role: string };

    writeAuditLog(currentUser.id, 'create_user', 'user', result.id, `建立業務帳號：${email}`);
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: '帳號已存在' }, { status: 409 });
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  const currentUser = sessionId ? getSessionUser(sessionId) : null;
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const users = db.prepare(
    'SELECT id, email, display_name, role, is_active, created_at FROM users ORDER BY created_at ASC'
  ).all();
  return NextResponse.json(users);
}
