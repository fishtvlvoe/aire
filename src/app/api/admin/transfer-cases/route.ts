import { NextRequest, NextResponse } from 'next/server';
import { writeAuditLog } from '@/lib/audit';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { db } from '@/lib/db';
import { transferCaseSchema, validationError } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = transferCaseSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }
  const { from_user_id, to_user_id } = parsed.data;

  if (from_user_id === to_user_id) {
    return NextResponse.json({ error: '來源與目標不可相同' }, { status: 400 });
  }

  const fromUser = db.prepare('SELECT id, display_name FROM users WHERE id = ?').get(from_user_id) as { id: number; display_name: string } | undefined;
  const toUser = db.prepare('SELECT id, display_name FROM users WHERE id = ?').get(to_user_id) as { id: number; display_name: string } | undefined;

  if (!fromUser || !toUser) {
    return NextResponse.json({ error: '找不到指定業務' }, { status: 404 });
  }

  const result = db.prepare('UPDATE listings SET owner_id = ? WHERE owner_id = ?').run(to_user_id, from_user_id);
  const transferred = result.changes;

  writeAuditLog(
    currentUser.id,
    'transfer_cases',
    'user',
    from_user_id,
    `將 ${fromUser.display_name} 的 ${transferred} 筆物件轉移給 ${toUser.display_name}`
  );

  return NextResponse.json({ transferred });
}

export async function GET(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  // 回傳每個 agent 的物件數量
  const agents = db.prepare(`
    SELECT u.id, u.display_name, u.email, u.is_active,
           COUNT(l.id) as listing_count
    FROM users u
    LEFT JOIN listings l ON l.owner_id = u.id
    WHERE u.role = 'agent'
    GROUP BY u.id
    ORDER BY u.display_name ASC
  `).all() as Array<{ id: number; display_name: string; email: string; is_active: number; listing_count: number }>;

  return NextResponse.json({ agents });
}
