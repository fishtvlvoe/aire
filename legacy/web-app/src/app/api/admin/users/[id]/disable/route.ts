import { NextRequest, NextResponse } from 'next/server';
import { writeAuditLog } from '@/lib/audit';
import { deleteUserSessions } from '@/lib/auth';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const userId = Number(id);
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId) as { id: number; email: string } | undefined;
  if (!user) {
    return NextResponse.json({ error: '找不到使用者' }, { status: 404 });
  }

  db.prepare('UPDATE users SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ?').run(userId);
  deleteUserSessions(userId);

  writeAuditLog(currentUser.id, 'disable_user', 'user', userId, `停用帳號：${user.email}`);
  return NextResponse.json({ ok: true });
}
