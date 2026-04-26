/**
 * POST /api/listings/[id]/extract
 *
 * 對物件的 PDF 附件執行 OCR 管線，萃取結構化欄位並寫回 DB。
 *
 * 設計原則：
 * - 單一附件 OCR 失敗不影響其他附件（個別標記 status: 'failed'）
 * - 最終一律回 200（除非 listing 不存在或無 PDF 附件）
 * - extracted_data 格式遵循 ExtractedDataPayload（by_attachment + merged_fields）
 */

import path from 'node:path'
import { NextResponse } from 'next/server'
import { db, getListing, getAttachments } from '@/lib/db'
import { runOcrPipeline } from '@/lib/ocr'
import type { ExtractedDataPayload, ExtractedResultByAttachment } from '@/lib/ocr'
import { mapOcrFieldsToFormKeys } from '@/lib/ocr/field-mapping'

// ─────────────────────────────────────────────
// 型別
// ─────────────────────────────────────────────

interface ErrorPayload {
  error: string
  code: string
  detail?: string
}

// ─────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const listingId = Number(id)

  // 驗證 id 格式
  if (Number.isNaN(listingId)) {
    return NextResponse.json<ErrorPayload>(
      { error: 'invalid id', code: 'INVALID_ID' },
      { status: 400 },
    )
  }

  // 驗證 listing 存在
  const listing = getListing(listingId)
  if (!listing) {
    return NextResponse.json<ErrorPayload>(
      { error: 'listing not found', code: 'LISTING_NOT_FOUND' },
      { status: 404 },
    )
  }

  // 讀取附件清單並過濾 PDF
  const attachments = getAttachments(listingId)
  const pdfAttachments = attachments.filter((a) =>
    a.mime.toLowerCase().includes('pdf'),
  )

  if (pdfAttachments.length === 0) {
    return NextResponse.json<ErrorPayload>(
      { error: '沒有可解析的 PDF 附件', code: 'NO_PDF_ATTACHMENTS' },
      { status: 400 },
    )
  }

  // ─────────────────────────────────────────────
  // 對每個 PDF 附件執行 OCR（單一失敗不中斷）
  // ─────────────────────────────────────────────

  const byAttachment: Record<string, ExtractedResultByAttachment> = {}

  await Promise.all(
    pdfAttachments.map(async (attachment) => {
      // path 欄位儲存的是 public URL（/uploads/...），轉換為磁碟絕對路徑
      const diskPath = path.join(process.cwd(), 'public', attachment.path)

      try {
        const result = await runOcrPipeline(diskPath, 'transcript')
        byAttachment[attachment.id] = result
      } catch (err) {
        // OCR 失敗：記錄錯誤但不中斷其他附件
        const detail = err instanceof Error ? err.message : String(err)
        byAttachment[attachment.id] = {
          filename: attachment.filename,
          category: 'transcript',
          extracted_at: new Date().toISOString(),
          fields: {},
          raw_text: '',
          status: 'failed',
          // ExtractedResultByAttachment 無 error 欄位，透過 fields 附加診斷資訊
        } satisfies ExtractedResultByAttachment

        // 將錯誤訊息附加到結果（型別允許 extra properties）
        ;(byAttachment[attachment.id] as Record<string, unknown>)['error'] = detail
      }
    }),
  )

  // ─────────────────────────────────────────────
  // 合併 merged_fields（成功萃取的附件才納入）
  // ─────────────────────────────────────────────

  const mergedFields: ExtractedDataPayload['merged_fields'] = {}

  for (const result of Object.values(byAttachment)) {
    if (result.status !== 'done') continue

    // 將 OCR key 映射為表單 field key
    const mappedFields = mapOcrFieldsToFormKeys(result.fields)

    for (const [fieldKey, fieldValue] of Object.entries(mappedFields)) {
      const existing = mergedFields[fieldKey]
      if (!existing || fieldValue.confidence > existing.confidence) {
        mergedFields[fieldKey] = {
          value: fieldValue.value,
          confidence: fieldValue.confidence,
          provenance: 'ocr-pdf',
          from: result.filename,
        }
      }
    }
  }

  const extractedData: ExtractedDataPayload = {
    by_attachment: byAttachment,
    merged_fields: mergedFields,
  }

  // ─────────────────────────────────────────────
  // 寫回 DB
  // ─────────────────────────────────────────────

  db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
    JSON.stringify(extractedData),
    listingId,
  )

  return NextResponse.json({ success: true, extracted_data: extractedData })
}
