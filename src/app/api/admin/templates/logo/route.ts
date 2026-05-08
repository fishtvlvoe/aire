import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { resolveCurrentUser } from '@/lib/auth/resolve-user';
import { db, writeAuditLog } from '@/lib/db';

const MAX_FILE_SIZE = 1024 * 1024;
const BRANDING_DIR = path.join(process.cwd(), 'data', 'branding');
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.svg']);
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/svg+xml']);

function clearExistingLogoFiles() {
  if (!fs.existsSync(BRANDING_DIR)) {
    return;
  }
  const files = fs.readdirSync(BRANDING_DIR);
  for (const fileName of files) {
    if (!fileName.startsWith('logo.')) {
      continue;
    }
    fs.unlinkSync(path.join(BRANDING_DIR, fileName));
  }
}

function updateLogoPath(logoPath: string | null) {
  db.prepare(
    'INSERT OR REPLACE INTO feature_flags (key, enabled, value) VALUES (?, ?, ?)'
  ).run('doc_logo_path', 1, logoPath);
}

export async function POST(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: '缺少 file 欄位' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: '檔案大小不得超過 1MB' }, { status: 400 });
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: '只接受 PNG、JPG、SVG 格式' }, { status: 400 });
  }

  if (!fs.existsSync(BRANDING_DIR)) {
    fs.mkdirSync(BRANDING_DIR, { recursive: true });
  }

  clearExistingLogoFiles();

  const fileName = `logo${extension}`;
  const filePath = path.join(BRANDING_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const relativePath = `data/branding/${fileName}`;
  updateLogoPath(relativePath);
  writeAuditLog({
    action: 'upload_logo',
    targetType: 'feature_flag',
    userId: currentUser.id,
    detail: relativePath,
  });

  return NextResponse.json({ logoPath: relativePath });
}

export async function DELETE(req: NextRequest) {
  const currentUser = await resolveCurrentUser(req);
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json({ error: '權限不足' }, { status: 403 });
  }

  clearExistingLogoFiles();
  updateLogoPath(null);
  writeAuditLog({
    action: 'remove_logo',
    targetType: 'feature_flag',
    userId: currentUser.id,
    detail: 'doc_logo_path cleared',
  });

  return NextResponse.json({ logoPath: null });
}
