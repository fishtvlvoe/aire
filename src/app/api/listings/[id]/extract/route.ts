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
import { NextResponse, type NextRequest } from 'next/server'
import { requireListingAccess } from '@/lib/auth/require-listing-access'
import { resolveCurrentUser } from '@/lib/auth/resolve-user'
import { db, getAttachments } from '@/lib/db'
import { runOcrPipeline } from '@/lib/ocr'
import type {
  AttachmentCategory,
  ExtractedDataPayload,
  ExtractedResultByAttachment,
  FieldProvenance,
} from '@/lib/ocr'
import { mapOcrFieldsToFormKeys } from '@/lib/ocr/field-mapping'

// ─────────────────────────────────────────────
// 型別
// ─────────────────────────────────────────────

interface ErrorPayload {
  error: string
  code: string
  detail?: string
}

const isAttachmentCategory = (v: unknown): v is AttachmentCategory =>
  v === 'transcript' ||
  v === 'title-deed' ||
  v === 'cadastral-map' ||
  v === 'photo' ||
  v === 'contract' ||
  v === 'other'

const inferAttachmentCategory = (attachment: {
  type?: string
  category?: unknown
}): AttachmentCategory => {
  if (isAttachmentCategory((attachment as any).category)) {
    return (attachment as any).category
  }

  if (attachment.type === 'field_visit') return 'photo'
  if (attachment.type === 'market_research') return 'other'
  return 'transcript'
}

// If result came from vision path, confidence will be 0.7 (set in ocr/index.ts)
const inferProvenance = (confidence: number): FieldProvenance =>
  confidence === 0.7 ? 'llm-vision' : 'ocr-pdf'

// ─────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────

export async function POST(
  request: NextRequest,
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

  const user = await resolveCurrentUser(request)
  const access = requireListingAccess(user, listingId)
  if (!access.allowed) {
    return NextResponse.json<ErrorPayload>(
      { error: access.message, code: access.code },
      { status: access.status },
    )
  }

  let llmVisionOptIn = request.headers.get('x-llm-vision-opt-in') === 'true'
  if (!llmVisionOptIn) {
    try {
      const body = (await request.json()) as { llmVisionOptIn?: unknown }
      llmVisionOptIn = body?.llmVisionOptIn === true
    } catch {
      // ignore non-JSON body
    }
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
      const category = inferAttachmentCategory(attachment)

      try {
        const result = await runOcrPipeline(diskPath, category, llmVisionOptIn)
        byAttachment[attachment.id] = result
      } catch (err) {
        // OCR 失敗：記錄錯誤但不中斷其他附件
        const detail = err instanceof Error ? err.message : String(err)
        byAttachment[attachment.id] = {
          filename: attachment.filename,
          category,
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
          provenance: inferProvenance(fieldValue.confidence),
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
