import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createUser } from '@/lib/auth/db';

interface CreateFirstAdminBody {
  email?: string;
  displayName?: string;
  password?: string;
}

export async function POST(request: NextRequest) {
  let body: CreateFirstAdminBody;
  try {
    body = (await request.json()) as CreateFirstAdminBody;
  } catch {
    return NextResponse.json({ error: 'invalid-json-body' }, { status: 400 });
  }

  const email = body.email?.trim();
  const displayName = body.displayName?.trim();
  const password = body.password;

  // 必填欄位檢查
  if (!email || !displayName || !password) {
    return NextResponse.json({ error: '請填寫完整資訊' }, { status: 400 });
  }

  // 密碼長度檢查
  if (password.length < 6) {
    return NextResponse.json({ error: '密碼至少 6 字元' }, { status: 400 });
  }

  // 僅允許在 users 表為空時建立首位管理員
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number } | undefined;
  const count = row?.count ?? 0;
  if (count !== 0) {
    return NextResponse.json({ error: '管理員帳號已存在' }, { status: 409 });
  }

  try {
    // 注意：createUser 是以 username 建立帳號；此處以 email 當 username。
    const created = await createUser(email, password);

    // createUser 會依表結構自動帶入部分欄位，但 displayName 需要依需求覆寫。
    // 同時修正 email 欄位（避免被 createUser 以 "@local" 形式填入）。
    const columns = (db.pragma('table_info(users)') as Array<{ name: string }>).map((c) => c.name);
    const sets: string[] = [];
    const values: Array<string | number> = [];

    if (columns.includes('email')) {
      sets.push('email = ?');
      values.push(email);
    }
    if (columns.includes('display_name')) {
      sets.push('display_name = ?');
      values.push(displayName);
    }

    if (sets.length > 0) {
      values.push(created.id);
      db.prepare(
        `UPDATE users SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`
      ).run(...values);
    }

    const userRow = db.prepare('SELECT id, email, display_name, role FROM users WHERE id = ?').get(created.id) as
      | { id: number; email?: string; display_name?: string; role?: string }
      | undefined;

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userRow?.id ?? created.id,
          email: userRow?.email ?? email,
          displayName: userRow?.display_name ?? displayName,
          role: userRow?.role ?? 'admin',
        },
      },
      { status: 201 }
    );
  } catch {
    // 若發生競態或 unique constraint（理論上不應發生），統一視為已存在
    return NextResponse.json({ error: '管理員帳號已存在' }, { status: 409 });
  }
}
