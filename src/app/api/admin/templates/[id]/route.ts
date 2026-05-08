import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getTemplate, deleteTemplate, setDefaultTemplate } from '@/lib/db';

// 模板 HTML 檔案儲存目錄
const TEMPLATES_DIR = path.join(process.cwd(), 'data', 'templates');

/** DELETE /api/admin/templates/[id]
 * 刪除指定模板記錄及對應 HTML 檔案
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: '無效的模板 ID', code: 'INVALID_ID' }, { status: 400 });
  }

  // 刪除 DB 記錄
  const deleted = deleteTemplate(id);
  if (!deleted) {
    return NextResponse.json({ error: '找不到指定模板', code: 'NOT_FOUND' }, { status: 404 });
  }

  // 刪除對應 HTML 檔案（不存在時忽略）
  const filePath = path.join(TEMPLATES_DIR, `${id}.html`);
  try {
    fs.unlinkSync(filePath);
  } catch {
    // 檔案不存在時靜默忽略
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

/** PATCH /api/admin/templates/[id]
 * 將指定模板設為該 doc_type 的預設模板
 * Body: { is_default: true }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: '無效的模板 ID', code: 'INVALID_ID' }, { status: 400 });
  }

  // 確認模板存在
  const template = getTemplate(id);
  if (!template) {
    return NextResponse.json({ error: '找不到指定模板', code: 'NOT_FOUND' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '無效的 JSON 格式', code: 'INVALID_REQUEST' }, { status: 400 });
  }

  if (!(body && typeof body === 'object' && 'is_default' in body && (body as Record<string, unknown>).is_default === true)) {
    return NextResponse.json({ error: 'body 必須包含 is_default: true', code: 'INVALID_BODY' }, { status: 400 });
  }

  // 設定預設模板（同時清除同 doc_type 其他預設）
  setDefaultTemplate(id, template.doc_type);

  // 取回更新後的模板資料回傳
  const updated = getTemplate(id);
  return NextResponse.json(updated, { status: 200 });
}
