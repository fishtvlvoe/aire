// 物件附件上傳 endpoint — 用於 market_research（周邊行情截圖）等輔助附件。
// 設計參考 /api/listings/[id]/photos/route.ts，但檔案 metadata 寫入 listings.attachments JSON 欄位。

import * as fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  addAttachment,
  getAttachments,
  getListing,
  removeAttachment,
  type AttachmentMeta,
} from '@/lib/db';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB（spec: market_research 截圖通常 1-3MB）
const MAX_ATTACHMENTS_PER_TYPE = 10;
const ALLOWED_MIME = /^(image\/(jpeg|jpg|png)|application\/pdf)$/i;
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.pdf']);
const ALLOWED_TYPES: AttachmentMeta['type'][] = ['market_research', 'field_visit'];

function isAttachmentType(value: unknown): value is AttachmentMeta['type'] {
  return typeof value === 'string' && (ALLOWED_TYPES as string[]).includes(value);
}

/**
 * GET /api/listings/[id]/attachments?type=market_research
 * 列出附件（可選用 type 篩選）。回傳 `{ attachments: AttachmentMeta[] }`。
 */
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listingId = Number(id);
  if (Number.isNaN(listingId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  if (!getListing(listingId)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const url = new URL(req.url);
  const typeFilter = url.searchParams.get('type');
  const all = getAttachments(listingId);
  const filtered =
    typeFilter && isAttachmentType(typeFilter) ? all.filter((a) => a.type === typeFilter) : all;
  return NextResponse.json({ attachments: filtered });
}

/**
 * POST /api/listings/[id]/attachments
 * multipart/form-data：
 *   - file: File（單檔）
 *   - type: 'market_research' | 'field_visit'（form field）
 * 限制：單檔 5MB；jpg/png/pdf；同 type 最多 10 個。
 */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listingId = Number(id);
  if (Number.isNaN(listingId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  if (!getListing(listingId)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const formData = await req.formData();
  const typeValue = formData.get('type');
  if (!isAttachmentType(typeValue)) {
    return NextResponse.json(
      { error: `type must be one of ${ALLOWED_TYPES.join(', ')}` },
      { status: 400 },
    );
  }
  const type = typeValue;

  const fileValue = formData.get('file');
  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }
  const file = fileValue;

  // MIME 檢查
  if (!ALLOWED_MIME.test(file.type)) {
    return NextResponse.json(
      { error: `不支援的檔案類型：${file.type}（僅接受 jpg / png / pdf）` },
      { status: 400 },
    );
  }

  // 大小檢查
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `檔案 ${file.name} 超過 5MB 限制（建議使用 1080p 截圖）` },
      { status: 413 },
    );
  }

  // 副檔名白名單
  const ext = path.extname(path.basename(file.name)).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      { error: `不支援的副檔名：${ext}（僅接受 .jpg / .jpeg / .png / .pdf）` },
      { status: 400 },
    );
  }

  // 同 type 數量上限
  const currentSameType = getAttachments(listingId).filter((a) => a.type === type);
  if (currentSameType.length >= MAX_ATTACHMENTS_PER_TYPE) {
    return NextResponse.json(
      { error: `單一物件 ${type} 類型附件最多 ${MAX_ATTACHMENTS_PER_TYPE} 個` },
      { status: 422 },
    );
  }

  // 寫實體檔
  const attachmentId = crypto.randomUUID();
  const filename = `${attachmentId}${ext}`;
  const dir = path.join(
    process.cwd(),
    'public/uploads/listings',
    String(listingId),
    'attachments',
    type,
  );
  await fs.promises.mkdir(dir, { recursive: true });
  const arrayBuffer = await file.arrayBuffer();
  await fs.promises.writeFile(path.join(dir, filename), Buffer.from(arrayBuffer));

  // 寫入 metadata
  const meta: AttachmentMeta = {
    id: attachmentId,
    filename: file.name,
    type,
    path: `/uploads/listings/${listingId}/attachments/${type}/${filename}`,
    size: file.size,
    mime: file.type,
    uploaded_at: new Date().toISOString(),
  };
  addAttachment(listingId, meta);

  return NextResponse.json({ attachment: meta });
}

/**
 * DELETE /api/listings/[id]/attachments?attachmentId=xxx
 * 移除單一附件（不刪實體檔，避免跨 process race；實體檔由清理 job 負責）。
 */
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listingId = Number(id);
  if (Number.isNaN(listingId)) {
    return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  }
  if (!getListing(listingId)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const url = new URL(req.url);
  const attachmentId = url.searchParams.get('attachmentId');
  if (!attachmentId) {
    return NextResponse.json({ error: 'attachmentId query param required' }, { status: 400 });
  }

  const removed = removeAttachment(listingId, attachmentId);
  if (!removed) {
    return NextResponse.json({ error: 'attachment not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
