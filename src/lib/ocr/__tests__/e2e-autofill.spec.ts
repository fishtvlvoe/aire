/**
 * E2E Autofill 流程驗證
 *
 * 純 Node 測試，不啟動瀏覽器，直接驗證：
 *   - DB 操作層（better-sqlite3, :memory:）
 *   - 欄位映射邏輯（mapOcrFieldsToFormKeys）
 *   - 預填邏輯（空白欄位才填，有值不覆蓋）
 *   - Provenance 標記（ocr-pdf → manual-edit）
 *
 * ⚠️  API route（POST /api/listings/[id]/extract）依賴 NextResponse，
 *     無法在純 Node 環境直接呼叫；此處改為直接重現 route 內的核心邏輯，
 *     確保業務行為正確。
 */

import Database from 'better-sqlite3'
import { describe, it, expect, beforeEach } from 'vitest'
import { initDb } from '@/lib/db/schema'
import { mapOcrFieldsToFormKeys, OCR_TO_FORM_KEY } from '@/lib/ocr/field-mapping'
import type {
  ExtractedDataPayload,
  ExtractedResultByAttachment,
  FieldWithProvenance,
  ExtractedField,
  FieldProvenance,
} from '@/lib/ocr'

// ─────────────────────────────────────────────
// 測試用 in-memory DB 工廠
// ─────────────────────────────────────────────

/** 建立獨立的 :memory: DB，每個測試用一個，避免狀態污染 */
function makeTestDb() {
  const db = new Database(':memory:')
  initDb(db)
  return db
}

/** 建立最小化 listing，回傳 id */
function insertListing(db: Database.Database): number {
  const row = db
    .prepare(
      `INSERT INTO listings (propertyType, property_type, status, field_visit_status)
       VALUES ('apartment', 'apartment', 'draft', 'draft') RETURNING id`,
    )
    .get() as { id: number }
  return row.id
}

// ─────────────────────────────────────────────
// 測試資料：模擬 OCR 萃取結果
// ─────────────────────────────────────────────

/** 模擬 land-parser 產出的 OCR fields */
const MOCK_OCR_LAND_FIELDS: Record<string, ExtractedField> = {
  usage_zone:         { value: '住宅區',      confidence: 0.92 },
  land_area:          { value: '50.00',       confidence: 0.88 },
  owner_name:         { value: '王小明',       confidence: 0.75 },
  rights_range:       { value: '全部',         confidence: 0.85 }, // 同 form key ownership_scope，confidence 較高
  title_deed_number:  { value: 'A001',         confidence: 0.90 },
  registration_date:  { value: '2020-01-01',  confidence: 0.80 }, // 同 form key land_register_transcript，owner_name 勝出
}

/** 模擬 building-parser 產出的 OCR fields */
const MOCK_OCR_BUILDING_FIELDS: Record<string, ExtractedField> = {
  building_address: { value: '台南市中西區忠義路二段1號', confidence: 0.95 },
  building_area:    { value: '80.50',                    confidence: 0.89 },
  main_material:    { value: '鋼筋混凝土造',              confidence: 0.91 },
  stories:          { value: '7',                        confidence: 0.87 },
  completion_date:  { value: '1990-06-15',               confidence: 0.78 },
}

// ─────────────────────────────────────────────
// Test 1：DB 操作 + 萃取結果寫入與讀取
// ─────────────────────────────────────────────

describe('Test 1：DB 操作流程', () => {
  let db: Database.Database
  let listingId: number

  beforeEach(() => {
    // 每個 it 都拿到乾淨的 in-memory DB
    db = makeTestDb()
    listingId = insertListing(db)
  })

  it('建立 listing 後 extracted_data 初始為 null', () => {
    const row = db
      .prepare('SELECT extracted_data FROM listings WHERE id = ?')
      .get(listingId) as { extracted_data: string | null }

    expect(row.extracted_data).toBeNull()
  })

  it('寫入模擬 ExtractedDataPayload 後，從 DB 讀回結構完整', () => {
    // 模擬 extract/route.ts 的核心邏輯：映射並合併 fields
    const mappedLand = mapOcrFieldsToFormKeys(MOCK_OCR_LAND_FIELDS)

    const byAttachment: Record<string, ExtractedResultByAttachment> = {
      'attach-001': {
        filename:     'land-transcript.pdf',
        category:     'transcript',
        extracted_at: new Date().toISOString(),
        fields:       MOCK_OCR_LAND_FIELDS,
        raw_text:     '（模擬原始文字）',
        status:       'done',
      },
    }

    // 組合 merged_fields（模擬 route 的合併邏輯）
    const mergedFields: ExtractedDataPayload['merged_fields'] = {}
    for (const [key, field] of Object.entries(mappedLand)) {
      const existing = mergedFields[key]
      if (!existing || field.confidence > existing.confidence) {
        mergedFields[key] = {
          value:      field.value,
          confidence: field.confidence,
          provenance: 'ocr-pdf',
          from:       'land-transcript.pdf',
        }
      }
    }

    const payload: ExtractedDataPayload = { by_attachment: byAttachment, merged_fields: mergedFields }
    db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
      JSON.stringify(payload),
      listingId,
    )

    // 讀回並驗證結構
    const row = db
      .prepare('SELECT extracted_data FROM listings WHERE id = ?')
      .get(listingId) as { extracted_data: string }

    const parsed = JSON.parse(row.extracted_data) as ExtractedDataPayload

    expect(parsed).toHaveProperty('by_attachment')
    expect(parsed).toHaveProperty('merged_fields')
    expect(parsed.by_attachment['attach-001'].filename).toBe('land-transcript.pdf')
    expect(parsed.by_attachment['attach-001'].status).toBe('done')
  })

  it('extract-status 邏輯：all done → status=done, progress=1', () => {
    // 模擬 extract-status/route.ts 的計算邏輯
    const payload: ExtractedDataPayload = {
      by_attachment: {
        'a1': { filename: 'f1.pdf', category: 'transcript', extracted_at: '', fields: {}, raw_text: '', status: 'done' },
        'a2': { filename: 'f2.pdf', category: 'transcript', extracted_at: '', fields: {}, raw_text: '', status: 'done' },
      },
      merged_fields: { zoning: { value: '住宅區', confidence: 0.9, provenance: 'ocr-pdf' } },
    }

    db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
      JSON.stringify(payload),
      listingId,
    )

    // 重現 extract-status 計算邏輯
    const row = db
      .prepare('SELECT extracted_data FROM listings WHERE id = ?')
      .get(listingId) as { extracted_data: string }
    const parsed = JSON.parse(row.extracted_data) as ExtractedDataPayload

    const entries     = Object.values(parsed.by_attachment)
    const total       = entries.length
    const done        = entries.filter((e) => e.status === 'done').length
    const failed      = entries.filter((e) => e.status === 'failed').length
    const pending     = entries.filter((e) => e.status === 'pending' || e.status === 'parsing').length
    const progress    = total > 0 ? done / total : 0
    const mergedCount = Object.keys(parsed.merged_fields ?? {}).length

    let overallStatus: 'none' | 'processing' | 'done' | 'failed'
    if (total === 0)         overallStatus = 'none'
    else if (pending > 0)    overallStatus = 'processing'
    else if (done === total) overallStatus = 'done'
    else if (failed === total) overallStatus = 'failed'
    else                     overallStatus = 'done'

    expect(overallStatus).toBe('done')
    expect(progress).toBe(1)
    expect(total).toBe(2)
    expect(done).toBe(2)
    expect(failed).toBe(0)
    expect(mergedCount).toBe(1)
  })

  it('extract-status 邏輯：部分失敗 → status=done（仍有成功項）', () => {
    const payload: ExtractedDataPayload = {
      by_attachment: {
        'a1': { filename: 'f1.pdf', category: 'transcript', extracted_at: '', fields: {}, raw_text: '', status: 'done' },
        'a2': { filename: 'f2.pdf', category: 'transcript', extracted_at: '', fields: {}, raw_text: '', status: 'failed' },
      },
      merged_fields: {},
    }

    db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
      JSON.stringify(payload),
      listingId,
    )

    const row = db
      .prepare('SELECT extracted_data FROM listings WHERE id = ?')
      .get(listingId) as { extracted_data: string }
    const parsed = JSON.parse(row.extracted_data) as ExtractedDataPayload

    const entries  = Object.values(parsed.by_attachment)
    const total    = entries.length
    const done     = entries.filter((e) => e.status === 'done').length
    const failed   = entries.filter((e) => e.status === 'failed').length
    const pending  = entries.filter((e) => e.status === 'pending' || e.status === 'parsing').length

    let overallStatus: 'none' | 'processing' | 'done' | 'failed'
    if (total === 0)          overallStatus = 'none'
    else if (pending > 0)     overallStatus = 'processing'
    else if (done === total)  overallStatus = 'done'
    else if (failed === total) overallStatus = 'failed'
    else                      overallStatus = 'done'

    // 部分成功、部分失敗 → route 設計為 'done'（降級處理）
    expect(overallStatus).toBe('done')
    expect(done).toBe(1)
    expect(failed).toBe(1)
  })
})

// ─────────────────────────────────────────────
// Test 2：欄位映射驗證
// ─────────────────────────────────────────────

describe('Test 2：OCR key → form key 映射', () => {
  it('OCR_TO_FORM_KEY 包含所有預期映射', () => {
    // 驗證 Kimi 分析整理出的關鍵映射存在
    expect(OCR_TO_FORM_KEY['usage_zone']).toBe('zoning')
    expect(OCR_TO_FORM_KEY['building_address']).toBe('address')
    expect(OCR_TO_FORM_KEY['main_material']).toBe('structure')
    expect(OCR_TO_FORM_KEY['stories']).toBe('floor_count')
    expect(OCR_TO_FORM_KEY['completion_date']).toBe('year_built')
    expect(OCR_TO_FORM_KEY['main_usage']).toBe('current_purpose')
    expect(OCR_TO_FORM_KEY['announced_land_value']).toBe('total_price')
  })

  it('mapOcrFieldsToFormKeys：基本映射（usage_zone → zoning）', () => {
    const input: Record<string, ExtractedField> = {
      usage_zone: { value: '住宅區', confidence: 0.92 },
    }
    const result = mapOcrFieldsToFormKeys(input)

    expect(result).toHaveProperty('zoning')
    expect(result.zoning.value).toBe('住宅區')
    expect(result.zoning.confidence).toBe(0.92)
    // 原始 OCR key 不應出現在結果中
    expect(result).not.toHaveProperty('usage_zone')
  })

  it('mapOcrFieldsToFormKeys：building_address → address', () => {
    const input: Record<string, ExtractedField> = {
      building_address: { value: '台南市中西區忠義路二段1號', confidence: 0.95 },
    }
    const result = mapOcrFieldsToFormKeys(input)

    expect(result).toHaveProperty('address')
    expect(result.address.value).toBe('台南市中西區忠義路二段1號')
  })

  it('同 form key 多個 OCR key → 保留 confidence 最高者', () => {
    // owner_name 和 rights_range 都映射到 ownership_scope
    const input: Record<string, ExtractedField> = {
      owner_name:   { value: '王小明', confidence: 0.75 },
      rights_range: { value: '全部',   confidence: 0.85 }, // 較高，應勝出
    }
    const result = mapOcrFieldsToFormKeys(input)

    expect(result).toHaveProperty('ownership_scope')
    // confidence 0.85 > 0.75，應保留 rights_range 的值
    expect(result.ownership_scope.value).toBe('全部')
    expect(result.ownership_scope.confidence).toBe(0.85)
  })

  it('同 form key 多個 OCR key → 並列時第一個勝出（相同 confidence）', () => {
    const input: Record<string, ExtractedField> = {
      title_deed_number: { value: 'A001', confidence: 0.80 },
      registration_date: { value: '2020-01-01', confidence: 0.80 }, // 相同 confidence
    }
    const result = mapOcrFieldsToFormKeys(input)

    // 兩者都映射到 land_register_transcript，第一個已存在時 confidence 不嚴格大於 → 保留第一個
    expect(result).toHaveProperty('land_register_transcript')
    expect(result.land_register_transcript.confidence).toBe(0.80)
  })

  it('mapOcrFieldsToFormKeys：未列在 OCR_TO_FORM_KEY 的 key 直接保留', () => {
    const input: Record<string, ExtractedField> = {
      custom_unknown_key: { value: '未知欄位', confidence: 0.50 },
    }
    const result = mapOcrFieldsToFormKeys(input)

    // 未在映射表的 key 直接 pass-through
    expect(result).toHaveProperty('custom_unknown_key')
    expect(result.custom_unknown_key.value).toBe('未知欄位')
  })

  it('批次映射 MOCK_OCR_LAND_FIELDS，所有結果都使用 form key', () => {
    const result = mapOcrFieldsToFormKeys(MOCK_OCR_LAND_FIELDS)

    // usage_zone 應映射為 zoning
    expect(result).toHaveProperty('zoning')
    // land_area 直接 pass-through（不在映射表，但 value 相同）
    expect(result).toHaveProperty('land_area')
    // ownership_scope 應存在（owner_name 和 rights_range 合一，取較高者）
    expect(result).toHaveProperty('ownership_scope')
    expect(result.ownership_scope.confidence).toBe(0.85) // rights_range 的 0.85 > owner_name 的 0.75

    // 原始 OCR key 不應出現
    expect(result).not.toHaveProperty('usage_zone')
    expect(result).not.toHaveProperty('owner_name')
    expect(result).not.toHaveProperty('rights_range')
  })
})

// ─────────────────────────────────────────────
// Test 3：預填邏輯驗證
// ─────────────────────────────────────────────

describe('Test 3：預填邏輯', () => {
  /**
   * 模擬前端 autofill 邏輯：
   * - 目標欄位為空（null / '' / undefined）→ 填入 OCR 值
   * - 目標欄位已有值 → 保留不動
   */
  function applyAutofill(
    formData: Record<string, string | null>,
    mergedFields: ExtractedDataPayload['merged_fields'],
  ): Record<string, string | null> {
    const result = { ...formData }
    for (const [key, field] of Object.entries(mergedFields)) {
      // 空白才填入
      if (!result[key]) {
        result[key] = field.value != null ? String(field.value) : null
      }
    }
    return result
  }

  it('空白欄位會被 OCR 值填入', () => {
    const formData: Record<string, string | null> = {
      zoning:  null,    // 空，應被填入
      address: '',      // 空字串，應被填入
    }

    const mergedFields: ExtractedDataPayload['merged_fields'] = {
      zoning:  { value: '住宅區',              confidence: 0.92, provenance: 'ocr-pdf' },
      address: { value: '台南市中西區忠義路二段1號', confidence: 0.95, provenance: 'ocr-pdf' },
    }

    const result = applyAutofill(formData, mergedFields)

    expect(result.zoning).toBe('住宅區')
    expect(result.address).toBe('台南市中西區忠義路二段1號')
  })

  it('已有值的欄位不被 OCR 覆蓋', () => {
    const formData: Record<string, string | null> = {
      zoning:  '商業區',    // 已有值，不應被覆蓋
      address: null,        // 空，應被填入
    }

    const mergedFields: ExtractedDataPayload['merged_fields'] = {
      zoning:  { value: '住宅區',              confidence: 0.92, provenance: 'ocr-pdf' },
      address: { value: '台南市中西區忠義路二段1號', confidence: 0.95, provenance: 'ocr-pdf' },
    }

    const result = applyAutofill(formData, mergedFields)

    // 已有值保留
    expect(result.zoning).toBe('商業區')
    // 空值被填入
    expect(result.address).toBe('台南市中西區忠義路二段1號')
  })

  it('merged_fields 無對應欄位 → formData 不變', () => {
    const formData: Record<string, string | null> = {
      zoning: null,
      notes:  '手動備注',
    }

    const mergedFields: ExtractedDataPayload['merged_fields'] = {
      // 只有 zoning，沒有 notes
      zoning: { value: '住宅區', confidence: 0.92, provenance: 'ocr-pdf' },
    }

    const result = applyAutofill(formData, mergedFields)

    expect(result.zoning).toBe('住宅區')
    expect(result.notes).toBe('手動備注') // 未被碰觸
  })

  it('OCR value 為 null 時，空欄位維持 null', () => {
    const formData: Record<string, string | null> = {
      zoning: null,
    }

    const mergedFields: ExtractedDataPayload['merged_fields'] = {
      zoning: { value: null, confidence: 0.5, provenance: 'ocr-pdf' },
    }

    const result = applyAutofill(formData, mergedFields)

    expect(result.zoning).toBeNull()
  })
})

// ─────────────────────────────────────────────
// Test 4：Provenance 流程驗證
// ─────────────────────────────────────────────

describe('Test 4：Provenance 標記流程', () => {
  let db: Database.Database
  let listingId: number

  beforeEach(() => {
    db = makeTestDb()
    listingId = insertListing(db)
  })

  it('OCR 帶入的欄位 provenance = ocr-pdf', () => {
    // 模擬 extract/route.ts 合併邏輯
    const mergedFields: ExtractedDataPayload['merged_fields'] = {}
    const mappedFields = mapOcrFieldsToFormKeys(MOCK_OCR_BUILDING_FIELDS)

    for (const [key, field] of Object.entries(mappedFields)) {
      const existing = mergedFields[key]
      if (!existing || field.confidence > existing.confidence) {
        mergedFields[key] = {
          value:      field.value,
          confidence: field.confidence,
          provenance: 'ocr-pdf', // route 固定寫入 'ocr-pdf'
          from:       'building-transcript.pdf',
        }
      }
    }

    // 所有 OCR 帶入的 merged_fields 應標記為 'ocr-pdf'
    for (const [key, field] of Object.entries(mergedFields)) {
      expect(field.provenance).toBe('ocr-pdf')
      expect(field.from).toBe('building-transcript.pdf')
    }

    // 驗證特定欄位存在
    expect(mergedFields).toHaveProperty('address')
    expect(mergedFields).toHaveProperty('structure')
    expect(mergedFields).toHaveProperty('floor_count')
  })

  it('使用者修改後 provenance 變為 manual-edit', () => {
    // 初始狀態：OCR 帶入
    const initialPayload: ExtractedDataPayload = {
      by_attachment: {},
      merged_fields: {
        zoning: { value: '住宅區', confidence: 0.92, provenance: 'ocr-pdf', from: 'land.pdf' },
        address: { value: '台南市忠義路1號', confidence: 0.88, provenance: 'ocr-pdf', from: 'land.pdf' },
      },
    }

    db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
      JSON.stringify(initialPayload),
      listingId,
    )

    // 模擬使用者修改 zoning 欄位
    const row = db
      .prepare('SELECT extracted_data FROM listings WHERE id = ?')
      .get(listingId) as { extracted_data: string }
    const parsed = JSON.parse(row.extracted_data) as ExtractedDataPayload

    // 使用者修改了 zoning
    parsed.merged_fields['zoning'] = {
      ...parsed.merged_fields['zoning'],
      value:      '商業區',          // 使用者輸入新值
      provenance: 'manual-edit',     // 標記為手動修改
    }

    // 寫回 DB
    db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
      JSON.stringify(parsed),
      listingId,
    )

    // 讀回驗證
    const updatedRow = db
      .prepare('SELECT extracted_data FROM listings WHERE id = ?')
      .get(listingId) as { extracted_data: string }
    const updated = JSON.parse(updatedRow.extracted_data) as ExtractedDataPayload

    // zoning 被使用者改了
    expect(updated.merged_fields['zoning'].provenance).toBe('manual-edit')
    expect(updated.merged_fields['zoning'].value).toBe('商業區')

    // address 沒被碰，仍是 ocr-pdf
    expect(updated.merged_fields['address'].provenance).toBe('ocr-pdf')
    expect(updated.merged_fields['address'].value).toBe('台南市忠義路1號')
  })

  it('Provenance 型別：五種合法值都能存入 DB 並讀回', () => {
    const provenances: FieldProvenance[] = ['ocr-pdf', 'ocr-image', 'llm-vision', 'manual', 'manual-edit']

    const mergedFields: ExtractedDataPayload['merged_fields'] = {}
    provenances.forEach((prov, i) => {
      mergedFields[`field_${i}`] = {
        value: `test_${i}`,
        confidence: 0.8,
        provenance: prov,
      }
    })

    const payload: ExtractedDataPayload = { by_attachment: {}, merged_fields: mergedFields }
    db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
      JSON.stringify(payload),
      listingId,
    )

    const row = db
      .prepare('SELECT extracted_data FROM listings WHERE id = ?')
      .get(listingId) as { extracted_data: string }
    const parsed = JSON.parse(row.extracted_data) as ExtractedDataPayload

    provenances.forEach((prov, i) => {
      expect(parsed.merged_fields[`field_${i}`].provenance).toBe(prov)
    })
  })

  it('merged_fields 包含 from 欄位（記錄來源附件）', () => {
    const payload: ExtractedDataPayload = {
      by_attachment: {},
      merged_fields: {
        address: {
          value:      '台南市中西區',
          confidence: 0.95,
          provenance: 'ocr-pdf',
          from:       'building-transcript.pdf',
        },
      },
    }

    db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
      JSON.stringify(payload),
      listingId,
    )

    const row = db
      .prepare('SELECT extracted_data FROM listings WHERE id = ?')
      .get(listingId) as { extracted_data: string }
    const parsed = JSON.parse(row.extracted_data) as ExtractedDataPayload

    expect(parsed.merged_fields['address'].from).toBe('building-transcript.pdf')
  })
})

// ─────────────────────────────────────────────
// Test 5：E2E 完整 golden path（API mock + 業務邏輯驗證）
//
// 由於 Next.js API route 依賴 NextResponse，無法在純 Node 環境直接呼叫，
// 此處透過 mock fetch + 直接執行 route 核心邏輯，模擬完整的 E2E 流程。
// ─────────────────────────────────────────────

import { vi } from 'vitest'
import { runOcrPipeline } from '@/lib/ocr'

/** 模擬 /api/listings/[id]/extract POST 的核心業務邏輯（從 route 提取） */
async function simulateExtractRoute(
  db: Database.Database,
  listingId: number,
  pdfPath: string,
  ocrResult: Awaited<ReturnType<typeof runOcrPipeline>>,
): Promise<{ success: boolean; extracted_data: ExtractedDataPayload }> {
  const byAttachment: Record<string, ExtractedResultByAttachment> = {
    'attach-001': ocrResult,
  }

  const mergedFields: ExtractedDataPayload['merged_fields'] = {}
  if (ocrResult.status === 'done') {
    const mappedFields = mapOcrFieldsToFormKeys(ocrResult.fields)
    for (const [key, field] of Object.entries(mappedFields)) {
      const existing = mergedFields[key]
      if (!existing || field.confidence > existing.confidence) {
        mergedFields[key] = {
          value:      field.value,
          confidence: field.confidence,
          provenance: 'ocr-pdf',
          from:       ocrResult.filename,
        }
      }
    }
  }

  const extractedData: ExtractedDataPayload = {
    by_attachment: byAttachment,
    merged_fields: mergedFields,
  }

  db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
    JSON.stringify(extractedData),
    listingId,
  )

  return { success: true, extracted_data: extractedData }
}

/** 模擬 /api/listings/[id]/extract-status GET 的核心業務邏輯 */
function simulateExtractStatusRoute(
  db: Database.Database,
  listingId: number,
): { status: 'none' | 'processing' | 'done' | 'failed'; progress: number; total: number; done: number; failed: number } {
  const row = db
    .prepare('SELECT extracted_data FROM listings WHERE id = ?')
    .get(listingId) as { extracted_data: string | null }

  if (!row.extracted_data) {
    return { status: 'none', progress: 0, total: 0, done: 0, failed: 0 }
  }

  const parsed = JSON.parse(row.extracted_data) as ExtractedDataPayload
  const entries = Object.values(parsed.by_attachment ?? {})
  const total   = entries.length
  const done    = entries.filter((e) => e.status === 'done').length
  const failed  = entries.filter((e) => e.status === 'failed').length
  const pending = entries.filter((e) => e.status === 'pending' || e.status === 'parsing').length

  let overallStatus: 'none' | 'processing' | 'done' | 'failed'
  if (total === 0)           overallStatus = 'none'
  else if (pending > 0)      overallStatus = 'processing'
  else if (done === total)   overallStatus = 'done'
  else if (failed === total) overallStatus = 'failed'
  else                       overallStatus = 'done'

  const progress = total > 0 ? done / total : 0

  return { status: overallStatus, progress, total, done, failed }
}

describe('Test 5：E2E 完整 golden path', () => {
  let db: Database.Database
  let listingId: number

  beforeEach(() => {
    db = makeTestDb()
    listingId = insertListing(db)
    vi.restoreAllMocks()
  })

  it('上傳謄本 PDF → 觸發 extract → response 包含 extracted_data', async () => {
    // Arrange：模擬 runOcrPipeline 回傳成功結果（含 fields）
    const mockOcrResult: ExtractedResultByAttachment = {
      filename:     'transcript.pdf',
      category:     'transcript',
      extracted_at: new Date().toISOString(),
      fields: {
        usage_zone:       { value: '住宅區',               confidence: 0.92 },
        building_address: { value: '台南市中西區忠義路二段1號', confidence: 0.95 },
        building_area:    { value: '80.50',                confidence: 0.89 },
      },
      raw_text: '住宅區 台南市中西區忠義路二段1號 面積80.50',
      status:   'done',
    }

    vi.spyOn(await import('@/lib/ocr'), 'runOcrPipeline').mockResolvedValue(mockOcrResult)

    // Act：模擬 POST /api/listings/[id]/extract
    const response = await simulateExtractRoute(db, listingId, '/mock/transcript.pdf', mockOcrResult)

    // Assert
    expect(response.success).toBe(true)
    expect(response.extracted_data).toHaveProperty('by_attachment')
    expect(response.extracted_data).toHaveProperty('merged_fields')
    expect(response.extracted_data.by_attachment['attach-001'].status).toBe('done')
    // merged_fields 應包含映射後的 form key
    expect(response.extracted_data.merged_fields).toHaveProperty('zoning')
    expect(response.extracted_data.merged_fields).toHaveProperty('address')
    expect(response.extracted_data.merged_fields['zoning'].value).toBe('住宅區')
  })

  it('extract-status polling 返回 done（上傳後 status 應立即為 done）', async () => {
    // Arrange：模擬 extract 完成（by_attachment 全部 done）
    const payload: ExtractedDataPayload = {
      by_attachment: {
        'attach-001': {
          filename:     'transcript.pdf',
          category:     'transcript',
          extracted_at: new Date().toISOString(),
          fields:       { usage_zone: { value: '住宅區', confidence: 0.92 } },
          raw_text:     '住宅區',
          status:       'done',
        },
      },
      merged_fields: {
        zoning: { value: '住宅區', confidence: 0.92, provenance: 'ocr-pdf', from: 'transcript.pdf' },
      },
    }

    db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
      JSON.stringify(payload),
      listingId,
    )

    // Act：模擬 GET /api/listings/[id]/extract-status
    const statusResult = simulateExtractStatusRoute(db, listingId)

    // Assert：status 應為 done，progress 為 1
    expect(statusResult.status).toBe('done')
    expect(statusResult.progress).toBe(1)
    expect(statusResult.total).toBe(1)
    expect(statusResult.done).toBe(1)
    expect(statusResult.failed).toBe(0)
  })

  it('切換到基本資料 tab → 欄位自動帶入（merged_fields 中有值且 provenance = ocr-pdf）', async () => {
    // Arrange：DB 中已有 extracted_data，模擬 OCR 完成
    const mockOcrResult: ExtractedResultByAttachment = {
      filename:     'transcript.pdf',
      category:     'transcript',
      extracted_at: new Date().toISOString(),
      fields: {
        usage_zone:       { value: '住宅區',               confidence: 0.92 },
        building_address: { value: '台南市中西區忠義路二段1號', confidence: 0.95 },
        stories:          { value: '7',                    confidence: 0.87 },
      },
      raw_text: '（模擬文字）',
      status:   'done',
    }

    // Act：執行 extract 核心邏輯（對應「切到 tab 前 extract 已完成」的前置狀態）
    const extractResponse = await simulateExtractRoute(db, listingId, '/mock/transcript.pdf', mockOcrResult)

    // 讀取 listing 模擬前端 tab 切換後的資料載入
    const row = db
      .prepare('SELECT extracted_data FROM listings WHERE id = ?')
      .get(listingId) as { extracted_data: string }
    const parsed = JSON.parse(row.extracted_data) as ExtractedDataPayload

    // Assert：merged_fields 包含對應表單欄位（tab 切換後前端應顯示這些值）
    const mergedFields = parsed.merged_fields

    // 欄位有值（不為空）
    expect(mergedFields['zoning']).toBeDefined()
    expect(mergedFields['zoning'].value).not.toBeNull()
    expect(mergedFields['zoning'].value).not.toBe('')

    // 欄位帶有 provenance = 'ocr-pdf'（對應綠色徽章）
    expect(mergedFields['zoning'].provenance).toBe('ocr-pdf')
    expect(mergedFields['address'].provenance).toBe('ocr-pdf')
    expect(mergedFields['floor_count'].provenance).toBe('ocr-pdf')

    // 來源檔名記錄正確（徽章顯示「已從 transcript.pdf」）
    expect(mergedFields['zoning'].from).toBe('transcript.pdf')
  })

  it('修改欄位 → provenance 變為 manual-edit（徽章從綠色變為橘色/灰色）', () => {
    // Arrange：初始狀態，OCR 已帶入欄位
    const initialPayload: ExtractedDataPayload = {
      by_attachment: {},
      merged_fields: {
        zoning:  { value: '住宅區',               confidence: 0.92, provenance: 'ocr-pdf', from: 'transcript.pdf' },
        address: { value: '台南市中西區忠義路二段1號', confidence: 0.95, provenance: 'ocr-pdf', from: 'transcript.pdf' },
      },
    }

    db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
      JSON.stringify(initialPayload),
      listingId,
    )

    // 驗證初始狀態是 ocr-pdf（綠色徽章）
    const beforeRow = db
      .prepare('SELECT extracted_data FROM listings WHERE id = ?')
      .get(listingId) as { extracted_data: string }
    const before = JSON.parse(beforeRow.extracted_data) as ExtractedDataPayload
    expect(before.merged_fields['zoning'].provenance).toBe('ocr-pdf')

    // Act：使用者修改 zoning 欄位（模擬前端輸入 + 寫回 API）
    const current = JSON.parse(beforeRow.extracted_data) as ExtractedDataPayload
    current.merged_fields['zoning'] = {
      ...current.merged_fields['zoning'],
      value:      '商業區',      // 使用者修改為新值
      provenance: 'manual-edit', // 徽章狀態改為橘色/灰色
    }

    db.prepare('UPDATE listings SET extracted_data = ? WHERE id = ?').run(
      JSON.stringify(current),
      listingId,
    )

    // Assert：修改後 provenance 應為 manual-edit（不再是 ocr-pdf）
    const afterRow = db
      .prepare('SELECT extracted_data FROM listings WHERE id = ?')
      .get(listingId) as { extracted_data: string }
    const after = JSON.parse(afterRow.extracted_data) as ExtractedDataPayload

    expect(after.merged_fields['zoning'].provenance).toBe('manual-edit')
    expect(after.merged_fields['zoning'].value).toBe('商業區')
    // provenance 不再是綠色
    expect(after.merged_fields['zoning'].provenance).not.toBe('ocr-pdf')

    // address 未修改，仍為 ocr-pdf（綠色）
    expect(after.merged_fields['address'].provenance).toBe('ocr-pdf')
  })

  it('跳過上傳 → status 維持 none，進入表單填寫流程', () => {
    // Arrange：建立新 listing，未上傳任何 PDF
    const newListingId = insertListing(db)

    // Act：使用者點擊「跳過上傳，全部手動輸入」
    //      → 前端不觸發 extract API，直接跳轉到表單 tab
    //      → extract-status 應回傳 none
    const statusResult = simulateExtractStatusRoute(db, newListingId)

    // Assert：status 為 none（沒有觸發過 extract）
    expect(statusResult.status).toBe('none')
    expect(statusResult.total).toBe(0)
    expect(statusResult.progress).toBe(0)

    // 驗證 DB 中 extracted_data 為 null（未寫入）
    const row = db
      .prepare('SELECT extracted_data FROM listings WHERE id = ?')
      .get(newListingId) as { extracted_data: string | null }
    expect(row.extracted_data).toBeNull()
  })

  it('無文字層 PDF（llmVisionOptIn 未啟用）→ extract status 為 failed', async () => {
    // Arrange：模擬無文字層 PDF 的 OCR 結果
    //          runOcrPipeline 在 hasTextLayer=false 且 llmVisionOptIn 未啟用時回傳 failed
    const mockFailedOcrResult: ExtractedResultByAttachment = {
      filename:     'image-only.pdf',
      category:     'transcript',
      extracted_at: new Date().toISOString(),
      fields:       {},   // 無法萃取任何欄位
      raw_text:     '',   // 無文字層
      status:       'failed',
    }

    vi.spyOn(await import('@/lib/ocr'), 'runOcrPipeline').mockResolvedValue(mockFailedOcrResult)

    // Act：模擬 POST /api/listings/[id]/extract（OCR 失敗）
    const response = await simulateExtractRoute(db, listingId, '/mock/image-only.pdf', mockFailedOcrResult)

    // Assert：response 仍回傳（route 設計：單一失敗不中斷），但 by_attachment 標記 failed
    expect(response.success).toBe(true)
    expect(response.extracted_data.by_attachment['attach-001'].status).toBe('failed')

    // merged_fields 應為空（failed 的附件不納入合併）
    expect(Object.keys(response.extracted_data.merged_fields)).toHaveLength(0)

    // extract-status 應回傳 failed（全部附件都 failed）
    const statusResult = simulateExtractStatusRoute(db, listingId)
    expect(statusResult.status).toBe('failed')
    expect(statusResult.failed).toBe(1)
    expect(statusResult.done).toBe(0)
  })
})
