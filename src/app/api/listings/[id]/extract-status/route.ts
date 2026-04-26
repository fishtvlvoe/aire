/**
 * GET /api/listings/[id]/extract-status
 *
 * 回傳目前 OCR 萃取進度，供前端輪詢進度條使用。
 * 不觸發萃取，只讀取現有 extracted_data。
 */

import { NextResponse } from 'next/server'
import { getListing } from '@/lib/db'
import type { ExtractedDataPayload } from '@/lib/ocr'

// ─────────────────────────────────────────────
// 型別
// ─────────────────────────────────────────────

interface ErrorPayload {
  error: string
  code: string
  detail?: string
}

interface ExtractStatusPayload {
  /** 整體狀態 */
  status: 'none' | 'processing' | 'done' | 'failed'
  /** 完成比例（0–1） */
  progress: number
  /** 附件總數 */
  total: number
  /** 已成功萃取數 */
  done: number
  /** 失敗數 */
  failed: number
  /** merged_fields 的欄位總數（-1 表示尚無資料） */
  merged_fields_count: number
}

// ─────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────

export async function GET(
  _req: Request,
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

  // 尚未執行過萃取
  if (!listing.extracted_data) {
    return NextResponse.json<ExtractStatusPayload>({
      status: 'none',
      progress: 0,
      total: 0,
      done: 0,
      failed: 0,
      merged_fields_count: -1,
    })
  }

  // 解析 extracted_data
  let parsed: ExtractedDataPayload
  try {
    parsed = JSON.parse(listing.extracted_data) as ExtractedDataPayload
  } catch {
    return NextResponse.json<ErrorPayload>(
      { error: 'extracted_data 格式損壞', code: 'INVALID_REQUEST', detail: 'JSON parse failed' },
      { status: 500 },
    )
  }

  // 計算進度
  const byAttachment = parsed.by_attachment ?? {}
  const entries = Object.values(byAttachment)
  const total = entries.length
  const done = entries.filter((e) => e.status === 'done').length
  const failed = entries.filter((e) => e.status === 'failed').length
  const pending = entries.filter((e) => e.status === 'pending' || e.status === 'parsing').length

  // 判斷整體狀態
  let overallStatus: ExtractStatusPayload['status']
  if (total === 0) {
    overallStatus = 'none'
  } else if (pending > 0) {
    overallStatus = 'processing'
  } else if (done === total) {
    overallStatus = 'done'
  } else if (failed === total) {
    overallStatus = 'failed'
  } else {
    // 部分成功、部分失敗（無 pending）
    overallStatus = 'done'
  }

  const progress = total > 0 ? done / total : 0
  const merged_fields_count = Object.keys(parsed.merged_fields ?? {}).length

  return NextResponse.json<ExtractStatusPayload>({
    status: overallStatus,
    progress,
    total,
    done,
    failed,
    merged_fields_count,
  })
}
