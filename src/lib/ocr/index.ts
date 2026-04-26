/**
 * index.ts — OCR 管線抽象層與型別定義
 *
 * 提供統一入口 runOcrPipeline，串接以下步驟：
 * 1. 讀取 PDF 檔案
 * 2. 萃取文字層
 * 3. 清洗文字
 * 4. 切割段落
 * 5. 欄位正規化（通用邏輯，parser 之後再擴充）
 */

import { readFile } from 'fs/promises'
import { basename } from 'path'
import { extractTextLayer } from './pdf-text-layer'
import { stripFillerChars } from './text-cleanup'
import { splitBySections } from './section-splitter'

// ─────────────────────────────────────────────
// 型別定義
// ─────────────────────────────────────────────

/** 單一萃取欄位：值與信心分數 */
export type ExtractedField = {
  value: string | number | null | string[]
  confidence: number
}

/** 欄位來源標記 */
export type FieldProvenance =
  | 'ocr-pdf'     // PDF 文字層直接萃取
  | 'ocr-image'   // 圖片 OCR（Tesseract 等）
  | 'llm-vision'  // LLM 視覺模型推斷
  | 'manual'      // 人工輸入
  | 'manual-edit' // 人工修正自動萃取值

/** 帶來源標記的欄位 */
export type FieldWithProvenance = ExtractedField & {
  provenance: FieldProvenance
  /** 來源說明（例如檔名、頁碼） */
  from?: string
}

/** 附件類型 */
export type AttachmentCategory =
  | 'transcript'    // 謄本
  | 'title-deed'    // 權狀
  | 'cadastral-map' // 地籍圖
  | 'photo'         // 照片
  | 'contract'      // 合約
  | 'other'         // 其他

/** 單一文件的萃取狀態 */
export type ExtractionStatus = 'pending' | 'parsing' | 'done' | 'failed'

/** 單一附件的萃取結果 */
export type ExtractedResultByAttachment = {
  /** 原始檔名 */
  filename: string
  /** 附件類型 */
  category: AttachmentCategory
  /** 萃取時間（ISO 8601） */
  extracted_at: string
  /** 欄位萃取結果 */
  fields: Record<string, ExtractedField>
  /** 清洗後的原始文字（供除錯用） */
  raw_text: string
  /** 萃取狀態 */
  status: ExtractionStatus
}

/** 整批附件的萃取結果 Payload */
export type ExtractedDataPayload = {
  /** 以 attachment key 為主的個別結果 */
  by_attachment: Record<string, ExtractedResultByAttachment>
  /** 跨附件合併後的欄位（含來源標記） */
  merged_fields: Record<string, FieldWithProvenance>
}

// ─────────────────────────────────────────────
// 管線入口
// ─────────────────────────────────────────────

/**
 * 執行單一 PDF 附件的 OCR 管線
 *
 * @param attachmentPath - PDF 檔案的絕對路徑
 * @param category - 附件類型，用於選擇對應 parser
 * @returns 萃取結果
 * @throws 若 PDF 不含文字層（掃描圖片 PDF）
 */
export async function runOcrPipeline(
  attachmentPath: string,
  category: AttachmentCategory
): Promise<ExtractedResultByAttachment> {
  const filename = basename(attachmentPath)
  const extractedAt = new Date().toISOString()

  // 步驟 1：讀取檔案
  const buffer = await readFile(attachmentPath)

  // 步驟 2：萃取文字層
  const { text, hasTextLayer, pageCount: _pageCount } = await extractTextLayer(buffer)

  if (!hasTextLayer) {
    throw new Error('無文字層：此 PDF 為掃描圖片，請使用 LLM Vision 模式')
  }

  // 步驟 3：清洗文字
  const cleaned = stripFillerChars(text)

  // 步驟 4：切割段落
  const sections = splitBySections(cleaned)

  // 步驟 5：欄位萃取（通用邏輯，之後依 category 擴充 parser）
  const fields = extractFieldsFromSections(sections, category)

  return {
    filename,
    category,
    extracted_at: extractedAt,
    fields,
    raw_text: cleaned,
    status: 'done',
  }
}

// ─────────────────────────────────────────────
// 內部：通用欄位萃取邏輯
// ─────────────────────────────────────────────

import type { Section } from './section-splitter'

/**
 * 從段落陣列萃取欄位（通用邏輯）
 *
 * 目前僅將段落文字作為 raw_section 欄位保存，
 * 待各 category parser 實作後替換。
 */
function extractFieldsFromSections(
  sections: Section[],
  _category: AttachmentCategory
): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {}

  for (const section of sections) {
    // 每個段落的文字作為暫存欄位，confidence 設低以標示「未解析」
    const key = `section_${section.name}`
    fields[key] = {
      value: section.text,
      confidence: 0.3,
    }
  }

  return fields
}
