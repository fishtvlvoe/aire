// 物件附件上傳 endpoint — 用於 market_research（周邊行情截圖）等輔助附件。
// 設計參考 /api/listings/[id]/photos/route.ts，但檔案 metadata 寫入 listings.attachments JSON 欄位。

import * as fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  db,
  addAttachment,
  getAttachments,
  getListing,
  removeAttachment,
  type AttachmentMeta,
} from '@/lib/db';
import type { ExtractedDataPayload, FieldWithProvenance } from '@/lib/ocr';

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
    return NextResponse.json<{ error: string; code: string }>(
      { error: 'invalid id', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }
  if (!getListing(listingId)) {
    return NextResponse.json<{ error: string; code: string }>(
      { error: 'listing not found', code: 'LISTING_NOT_FOUND' },
      { status: 404 },
    );
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
    return NextResponse.json<{ error: string; code: string }>(
      { error: 'invalid id', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }
  if (!getListing(listingId)) {
    return NextResponse.json<{ error: string; code: string }>(
      { error: 'listing not found', code: 'LISTING_NOT_FOUND' },
      { status: 404 },
    );
  }

  const formData = await req.formData();
  const typeValue = formData.get('type');
  if (!isAttachmentType(typeValue)) {
    return NextResponse.json<{ error: string; code: string }>(
      { error: `type must be one of ${ALLOWED_TYPES.join(', ')}`, code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }
  const type = typeValue;

  const fileValue = formData.get('file');
  if (!(fileValue instanceof File)) {
    return NextResponse.json<{ error: string; code: string }>(
      { error: 'file is required', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }
  const file = fileValue;

  // MIME 檢查
  if (!ALLOWED_MIME.test(file.type)) {
    return NextResponse.json<{ error: string; code: string }>(
      { error: `不支援的檔案類型：${file.type}（僅接受 jpg / png / pdf）`, code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }

  // 大小檢查
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json<{ error: string; code: string }>(
      { error: `檔案 ${file.name} 超過 5MB 限制（建議使用 1080p 截圖）`, code: 'INVALID_REQUEST' },
      { status: 413 },
    );
  }

  // 副檔名白名單
  const ext = path.extname(path.basename(file.name)).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json<{ error: string; code: string }>(
      { error: `不支援的副檔名：${ext}（僅接受 .jpg / .jpeg / .png / .pdf）`, code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }

  // 同 type 數量上限
  const currentSameType = getAttachments(listingId).filter((a) => a.type === type);
  if (currentSameType.length >= MAX_ATTACHMENTS_PER_TYPE) {
    return NextResponse.json<{ error: string; code: string }>(
      { error: `單一物件 ${type} 類型附件最多 ${MAX_ATTACHMENTS_PER_TYPE} 個`, code: 'INVALID_REQUEST' },
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

  // 上傳完成後，fire-and-forget 觸發 OCR 萃取（不阻擋回應）
  // 若附件為 PDF 類型，extract endpoint 會自動處理；非 PDF 則由 extract 回 400 靜默忽略
  if (file.type.toLowerCase().includes('pdf')) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    void fetch(`${baseUrl}/api/listings/${listingId}/extract`, {
      method: 'POST',
    }).catch(() => {
      // fire-and-forget：忽略失敗，不影響上傳回應
    });
  }

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
    return NextResponse.json<{ error: string; code: string }>(
      { error: 'invalid id', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }
  if (!getListing(listingId)) {
    return NextResponse.json<{ error: string; code: string }>(
      { error: 'listing not found', code: 'LISTING_NOT_FOUND' },
      { status: 404 },
    );
  }

  const url = new URL(req.url);
  const attachmentId = url.searchParams.get('attachmentId');
  if (!attachmentId) {
    return NextResponse.json<{ error: string; code: string }>(
      { error: 'attachmentId query param required', code: 'INVALID_REQUEST' },
      { status: 400 },
    );
  }

  const removed = removeAttachment(listingId, attachmentId);
  if (!removed) {
    return NextResponse.json<{ error: string; code: string }>(
      { error: 'attachment not found', code: 'ATTACHMENT_NOT_FOUND' },
      { status: 404 },
    );
  }

  // ─────────────────────────────────────────────
  // 同步清除 extracted_data 中對應的 by_attachment entry，
  // 並重新計算 merged_fields（移除僅來自此附件的欄位）
  // ─────────────────────────────────────────────
  const freshListing = getListing(listingId);
  if (freshListing?.extracted_data) {
    try {
      const extracted = JSON.parse(freshListing.extracted_data) as ExtractedDataPayload;

      // 移除已刪除附件的 by_attachment entry
      delete extracted.by_attachment[attachmentId];

      const remainingAttachmentIds = Object.keys(extracted.by_attachment);

      if (remainingAttachmentIds.length === 0) {
        // 所有附件都刪除了，清空整筆 extracted_data
        db.prepare('UPDATE listings SET extracted_data = NULL WHERE id = ?').run(listingId);
      } else {
        // 重新計算 merged_fields：
        // 只保留「仍存在附件」貢獻的欄位；若多個附件有同欄位，取最後一個（依 id 排序）
        const newMergedFields: Record<string, FieldWithProvenance> = {};

        for (const attachId of remainingAttachmentIds) {
          const entry = extracted.by_attachment[attachId];
          if (entry.status !== 'done') continue;

          for (const [fieldKey, fieldValue] of Object.entries(entry.fields)) {
            newMergedFields[fieldKey] = {
              ...fieldValue,
              // 保留 manual-edit 如果 merged_fields 原本就是 manual-edit
              provenance:
                extracted.merged_fields[fieldKey]?.provenance === 'manual-edit'
                  ? 'manual-edit'
                  : 'ocr-pdf',
              from: attachId,
            };
          }
        }

        extracted.merged_fields = newMergedFields;
        db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
          JSON.stringify(extracted),
          listingId,
        );
      }
    } catch {
      // extracted_data 格式損壞時靜默忽略，避免影響正常刪除流程
    }
  }

  return NextResponse.json({ success: true });
}
