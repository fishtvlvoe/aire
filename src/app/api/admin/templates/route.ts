import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { getAllTemplates, createTemplate } from '@/lib/db';

// 模板 HTML 檔案儲存目錄
const TEMPLATES_DIR = path.join(process.cwd(), 'data', 'templates');

/** GET /api/admin/templates
 * 取得所有模板列表，可用 ?doc_type=xxx 篩選
 */
export async function GET(req: NextRequest) {
  const docType = req.nextUrl.searchParams.get('doc_type') ?? undefined;
  const templates = getAllTemplates(docType);
  return NextResponse.json(templates, { status: 200 });
}

/** POST /api/admin/templates
 * 上傳 HTML 模板檔案並建立 DB 記錄
 * Content-Type: multipart/form-data
 * Fields: name, description (optional), doc_type, file (.html/.htm, <= 2MB, 含 {{ )
 */
export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: '無法解析 multipart/form-data', code: 'INVALID_REQUEST' }, { status: 400 });
  }

  const name = formData.get('name');
  const description = formData.get('description');
  const docType = formData.get('doc_type');
  const file = formData.get('file');

  // 必填欄位驗證
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'name 為必填欄位', code: 'MISSING_NAME' }, { status: 400 });
  }
  if (typeof docType !== 'string' || !docType.trim()) {
    return NextResponse.json({ error: 'doc_type 為必填欄位', code: 'MISSING_DOC_TYPE' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file 為必填欄位', code: 'MISSING_FILE' }, { status: 400 });
  }

  // 副檔名驗證：僅允許 .html / .htm
  const ext = path.extname(file.name).toLowerCase();
  if (ext !== '.html' && ext !== '.htm') {
    return NextResponse.json({ error: '只接受 .html 或 .htm 檔案', code: 'INVALID_FILE_TYPE' }, { status: 400 });
  }

  // 檔案大小驗證：<= 2MB
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '檔案大小不得超過 2MB', code: 'FILE_TOO_LARGE' }, { status: 400 });
  }

  // 讀取檔案內容
  const rawContent = await file.text();

  // 內容驗證：至少含一個 Handlebars 模板語法
  if (!rawContent.includes('{{')) {
    return NextResponse.json({ error: '模板內容必須包含至少一個 {{ 變數標記', code: 'NO_TEMPLATE_SYNTAX' }, { status: 400 });
  }

  // 安全清理：移除 <script> 標籤（防止 XSS）
  const sanitizedContent = rawContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

  // 建立 DB 記錄
  const template = createTemplate({
    name: name.trim(),
    description: typeof description === 'string' ? description.trim() || undefined : undefined,
    doc_type: docType.trim(),
  });

  // 確保 templates 目錄存在
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }

  // 將清理後的 HTML 寫入 data/templates/{id}.html
  const filePath = path.join(TEMPLATES_DIR, `${template.id}.html`);
  fs.writeFileSync(filePath, sanitizedContent, 'utf-8');

  return NextResponse.json(template, { status: 201 });
}
