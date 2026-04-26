/**
 * POST /api/listings/[id]/field-visit/switch-source
 *
 * 切換 merged_fields 中某欄位的來源附件。
 * 業務人員可在不同附件版本間手動挑選最可信的欄位值。
 *
 * Request body: { fieldKey: string, attachmentId: string }
 * Response: { success: true, merged_fields: Record<string, FieldWithProvenance> }
 */

import { NextResponse } from 'next/server'
import { db, getListing } from '@/lib/db'
import type { ExtractedDataPayload, FieldWithProvenance } from '@/lib/ocr'

// ─────────────────────────────────────────────
// 型別
// ─────────────────────────────────────────────

interface ErrorPayload {
  error: string
  code: string
  detail?: string
}

interface SwitchSourceBody {
  fieldKey: string
  attachmentId: string
}

// ─────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const listingId = Number(id)

  // 驗證 id 格式
  if (Number.isNaN(listingId)) {
    return NextResponse.json<ErrorPayload>(
      { error: 'invalid id', code: 'INVALID_REQUEST' },
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

  // 解析 request body
  let body: SwitchSourceBody
  try {
    body = (await req.json()) as SwitchSourceBody
  } catch {
    return NextResponse.json<ErrorPayload>(
      { error: 'invalid json', code: 'INVALID_REQUEST' },
      { status: 400 },
    )
  }

  const { fieldKey, attachmentId } = body

  if (!fieldKey || typeof fieldKey !== 'string') {
    return NextResponse.json<ErrorPayload>(
      { error: 'fieldKey is required', code: 'INVALID_REQUEST' },
      { status: 400 },
    )
  }
  if (!attachmentId || typeof attachmentId !== 'string') {
    return NextResponse.json<ErrorPayload>(
      { error: 'attachmentId is required', code: 'INVALID_REQUEST' },
      { status: 400 },
    )
  }

  // 驗證 extracted_data 存在
  if (!listing.extracted_data) {
    return NextResponse.json<ErrorPayload>(
      { error: '此物件尚無萃取資料', code: 'NO_EXTRACTED_DATA' },
      { status: 400 },
    )
  }

  // 解析 extracted_data
  let extracted: ExtractedDataPayload
  try {
    extracted = JSON.parse(listing.extracted_data) as ExtractedDataPayload
  } catch {
    return NextResponse.json<ErrorPayload>(
      { error: 'extracted_data 格式損壞', code: 'INVALID_REQUEST', detail: 'JSON parse failed' },
      { status: 500 },
    )
  }

  // 驗證 by_attachment[attachmentId] 存在
  const targetAttachment = extracted.by_attachment?.[attachmentId]
  if (!targetAttachment) {
    return NextResponse.json<ErrorPayload>(
      { error: `找不到附件 ${attachmentId} 的萃取結果`, code: 'ATTACHMENT_NOT_FOUND' },
      { status: 400 },
    )
  }

  // 驗證 by_attachment[attachmentId].fields[fieldKey] 存在
  const targetField = targetAttachment.fields?.[fieldKey]
  if (!targetField) {
    return NextResponse.json<ErrorPayload>(
      { error: `附件 ${attachmentId} 中找不到欄位 ${fieldKey}`, code: 'FIELD_NOT_FOUND' },
      { status: 400 },
    )
  }

  // 將 merged_fields[fieldKey] 替換為目標附件的欄位值，並標記來源
  const newMergedField: FieldWithProvenance = {
    ...targetField,
    provenance: targetAttachment.status === 'done' ? 'ocr-pdf' : 'manual',
    from: attachmentId,
  }

  extracted.merged_fields = {
    ...extracted.merged_fields,
    [fieldKey]: newMergedField,
  }

  // 寫回 DB
  db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
    JSON.stringify(extracted),
    listingId,
  )

  return NextResponse.json({ success: true, merged_fields: extracted.merged_fields })
}
