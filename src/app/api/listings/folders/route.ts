import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { createFolder, getAllFolders } from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await resolveCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: '未登入', code: 'UNAUTHORIZED' }, { status: 401 });
  }
  const folders = getAllFolders();
  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  const user = await resolveCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: '未登入', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json', code: 'INVALID_REQUEST' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: '資料夾名稱不可為空', code: 'INVALID_REQUEST' }, { status: 400 });
  }

  try {
    const folder = createFolder(name);
    return NextResponse.json({ folder }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === '資料夾名稱已存在') {
      return NextResponse.json({ error: msg, code: 'DUPLICATE_NAME' }, { status: 400 });
    }
    return NextResponse.json({ error: 'internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
