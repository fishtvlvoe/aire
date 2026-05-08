import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { deleteFolder, getFolder, renameFolder } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Ctx) {
  const user = await resolveCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: '未登入', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { id } = await context.params;
  const folderId = Number(id);
  if (Number.isNaN(folderId)) {
    return NextResponse.json({ error: 'invalid id', code: 'INVALID_REQUEST' }, { status: 400 });
  }

  if (!getFolder(folderId)) {
    return NextResponse.json({ error: '資料夾不存在', code: 'NOT_FOUND' }, { status: 404 });
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
    renameFolder(folderId, name);
    return NextResponse.json({ folder: getFolder(folderId) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === '資料夾名稱已存在') {
      return NextResponse.json({ error: msg, code: 'DUPLICATE_NAME' }, { status: 400 });
    }
    return NextResponse.json({ error: 'internal error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: Ctx) {
  const user = await resolveCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: '未登入', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { id } = await context.params;
  const folderId = Number(id);
  if (Number.isNaN(folderId)) {
    return NextResponse.json({ error: 'invalid id', code: 'INVALID_REQUEST' }, { status: 400 });
  }

  const deleted = deleteFolder(folderId);
  if (!deleted) {
    return NextResponse.json({ error: '資料夾不存在', code: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
