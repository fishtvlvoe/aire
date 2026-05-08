import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { COLOR_SCHEME_IDS } from '@/lib/branding/color-schemes';
import { db, writeAuditLog } from '@/lib/db';

function readTemplateSettings(): { colorScheme: string; logoPath: string | null } {
  const rows = db.prepare(
    'SELECT key, value FROM feature_flags WHERE key IN (?, ?)'
  ).all('doc_color_scheme', 'doc_logo_path') as Array<{ key: string; value: string | null }>;

  let colorScheme = 'navy';
  let logoPath: string | null = null;
  for (const row of rows) {
    if (row.key === 'doc_color_scheme' && row.value) {
      colorScheme = row.value;
    }
    if (row.key === 'doc_logo_path') {
      logoPath = row.value || null;
    }
  }

  return { colorScheme, logoPath };
}

export async function GET(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }
  return NextResponse.json(readTemplateSettings());
}

export async function PATCH(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const payload = (await req.json().catch(() => null)) as { colorScheme?: unknown } | null;
  if (!payload || typeof payload.colorScheme !== 'string') {
    return NextResponse.json({ error: 'colorScheme 為必填欄位' }, { status: 400 });
  }
  if (!COLOR_SCHEME_IDS.has(payload.colorScheme)) {
    return NextResponse.json({ error: '無效的配色方案' }, { status: 400 });
  }

  db.prepare(
    'INSERT OR REPLACE INTO feature_flags (key, enabled, value) VALUES (?, ?, ?)'
  ).run('doc_color_scheme', 1, payload.colorScheme);

  writeAuditLog({
    action: 'update_doc_color_scheme',
    targetType: 'feature_flag',
    userId: currentUser.id,
    detail: `doc_color_scheme=${payload.colorScheme}`,
  });

  return NextResponse.json(readTemplateSettings());
}
