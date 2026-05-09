import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { db, writeAuditLog } from '@/lib/db';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const BACKGROUND_DIR = path.join(process.cwd(), 'public', 'branding', 'backgrounds');
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg']);
const PAGES = new Set(['cover', 'content']);

function getFlagKey(page: string): 'doc_bg_cover' | 'doc_bg_content' {
  return page === 'cover' ? 'doc_bg_cover' : 'doc_bg_content';
}

function clearExistingBackgroundFiles(page: 'cover' | 'content'): void {
  if (!fs.existsSync(BACKGROUND_DIR)) {
    return;
  }
  const files = fs.readdirSync(BACKGROUND_DIR);
  for (const fileName of files) {
    if (!fileName.startsWith(`${page}.`)) {
      continue;
    }
    fs.unlinkSync(path.join(BACKGROUND_DIR, fileName));
  }
}

function updateBackgroundPath(page: 'cover' | 'content', backgroundPath: string): void {
  db.prepare(
    'INSERT OR REPLACE INTO feature_flags (key, enabled, value) VALUES (?, ?, ?)'
  ).run(getFlagKey(page), 1, backgroundPath);
}

export async function POST(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  const page = formData?.get('page');

  if (typeof page !== 'string' || !PAGES.has(page)) {
    return NextResponse.json({ error: 'page 只接受 cover 或 content' }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '缺少 file 欄位' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: '檔案大小不得超過 5MB' }, { status: 400 });
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: '只接受 PNG、JPG 格式' }, { status: 400 });
  }

  if (!fs.existsSync(BACKGROUND_DIR)) {
    fs.mkdirSync(BACKGROUND_DIR, { recursive: true });
  }

  clearExistingBackgroundFiles(page as 'cover' | 'content');

  const fileName = `${page}${extension}`;
  const filePath = path.join(BACKGROUND_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const relativePath = `/branding/backgrounds/${fileName}`;
  updateBackgroundPath(page as 'cover' | 'content', relativePath);
  writeAuditLog({
    action: 'upload_doc_background',
    targetType: 'feature_flag',
    userId: currentUser.id,
    detail: `${getFlagKey(page)}=${relativePath}`,
  });

  return NextResponse.json({ url: relativePath });
}

export async function DELETE(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const page = req.nextUrl.searchParams.get('page');
  if (!page || !PAGES.has(page)) {
    return NextResponse.json({ error: 'page 只接受 cover 或 content' }, { status: 400 });
  }

  clearExistingBackgroundFiles(page as 'cover' | 'content');
  updateBackgroundPath(page as 'cover' | 'content', '');
  writeAuditLog({
    action: 'delete_doc_background',
    targetType: 'feature_flag',
    userId: currentUser.id,
    detail: `${getFlagKey(page)} cleared`,
  });

  return NextResponse.json({ ok: true });
}

