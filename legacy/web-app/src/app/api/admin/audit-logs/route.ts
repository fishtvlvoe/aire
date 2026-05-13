import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = 20;
  const offset = (page - 1) * limit;
  const userFilter = searchParams.get('user_id');
  const actionFilter = searchParams.get('action');
  const dateFilter = searchParams.get('date');

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (userFilter) { conditions.push('al.user_id = ?'); params.push(Number(userFilter)); }
  if (actionFilter) { conditions.push('al.action = ?'); params.push(actionFilter); }
  if (dateFilter) { conditions.push("date(al.created_at) = ?"); params.push(dateFilter); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = db.prepare(`
    SELECT al.id, al.action, al.target_type, al.target_id, al.detail, al.created_at,
           u.display_name as user_name, u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    ${where}
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM audit_logs al ${where}`).get(...params) as { cnt: number }).cnt;

  return NextResponse.json({ logs: rows, total, page, pages: Math.ceil(total / limit) });
}

// audit_logs 是 append-only，禁止刪除或修改
export function DELETE() {
  return NextResponse.json({ error: '不允許刪除 audit log' }, { status: 405 });
}

export function PUT() {
  return NextResponse.json({ error: '不允許修改 audit log' }, { status: 405 });
}
