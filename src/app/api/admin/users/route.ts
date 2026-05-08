import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { writeAuditLog } from '@/lib/audit';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { db } from '@/lib/db';
import { adminUserCreateSchema, validationError } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json', code: 'INVALID_REQUEST' }, { status: 400 });
  }
  const parsed = adminUserCreateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }
  const { email, display_name, password } = parsed.data;
  const username = parsed.data.username ?? email;

  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(
      "INSERT INTO users (username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, 'agent') RETURNING id, username, email, display_name, role"
    ).get(username, email, hash, display_name) as { id: number; username: string; email: string; display_name: string; role: string };

    writeAuditLog(currentUser.id, 'create_user', 'user', result.id, `建立業務帳號：${email}`);
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: '帳號已存在' }, { status: 409 });
  }
}

export async function GET(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const users = db.prepare(
    'SELECT id, username, email, display_name, role, is_active, created_at FROM users ORDER BY created_at ASC'
  ).all();
  return NextResponse.json(users);
}
