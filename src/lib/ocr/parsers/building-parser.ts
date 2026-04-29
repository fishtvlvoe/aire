/**
 * building-parser.ts — 建物謄本規則解析器
 *
 * 從切割後的段落中抽取台灣建物登記謄本的結構化欄位。
 * 涵蓋：建物標示部、建物所有權部、他項權利部。
 *
 * 建物所有權部與他項權利部的欄位 key 加上 `building_` prefix，
 * 避免與 land-parser 合併時發生鍵名衝突。
 */

import type { ExtractedField } from '../index'
import type { Section } from '../section-splitter'
import {
  normalizeDate,
  normalizeRocYear,
  normalizeArea,
  normalizePrice,
  normalizeRightsRange,
  normalizeStories,
  parseLandParcel,
} from '../normalize'

// ─────────────────────────────────────────────
// 內部工具（與 land-parser 相同邏輯，各自獨立，避免循環依賴）
// ─────────────────────────────────────────────

function findSection(sections: Section[], keyword: string): Section | undefined {
  return sections.find((s) => s.name.includes(keyword))
}

function makeField(
  normalizedValue: string | number | string[] | null,
  rawValue: string | null
): ExtractedField | null {
  if (normalizedValue !== null) {
    return { value: normalizedValue, confidence: 0.95 }
  }
  if (rawValue !== null) {
    return { value: rawValue, confidence: 0.7 }
  }
  return null
}

function extractFirst(text: string, re: RegExp): string | null {
  const m = re.exec(text)
  return m ? m[1].trim() : null
}

// ─────────────────────────────────────────────
// 建物標示部
// ─────────────────────────────────────────────

function parseBuildingDescriptionSection(
  section: Section
): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {}
  const t = section.text

  // 建號（格式同地號，用 parseLandParcel 解析）
  const buildingNumMatch = t.match(/([\u4e00-\u9fa5]+段\s*\d{4,5}-\d{3,4}(?:建號)?)/)
  if (buildingNumMatch) {
    const parsed = parseLandParcel(buildingNumMatch[1])
    if (parsed) {
      fields['building_number'] = { value: parsed.number ?? parsed.raw, confidence: 0.95 }
    } else {
      fields['building_number'] = { value: buildingNumMatch[1], confidence: 0.7 }
    }
  }

  // 坐落地址 / 建物門牌（保留原值）
  const addressRaw = extractFirst(t, /(?:坐落地址|建物門牌)[：:]\s*(.+?)(?:\n|$)/)
  if (addressRaw !== null) {
    fields['building_address'] = { value: addressRaw, confidence: 0.95 }
  }

  // 總面積（優先比對「總面積」，再比對一般「面積」）
  const areaRaw = extractFirst(t, /(?:總面積|面\s*積)[：:]\s*\**([\d,]+\.?\d*)\s*平方公尺/)
  if (areaRaw !== null) {
    const f = makeField(normalizeArea(areaRaw), areaRaw)
    if (f) fields['building_area'] = f
  }

  // 主要建材（保留原值）
  const mainMaterialRaw = extractFirst(t, /主要建材[：:]\s*(.+?)(?:\n|$)/)
  if (mainMaterialRaw !== null) {
    fields['main_material'] = { value: mainMaterialRaw, confidence: 0.95 }
  }

  // 主要用途（保留原值）
  const mainUsageRaw = extractFirst(t, /主要用途[：:]\s*(.+?)(?:\n|$)/)
  if (mainUsageRaw !== null) {
    fields['main_usage'] = { value: mainUsageRaw, confidence: 0.95 }
  }

  // 層數
  const storiesRaw = extractFirst(t, /層\s*數[：:]\s*(\d+)/)
  if (storiesRaw !== null) {
    const f = makeField(normalizeStories(storiesRaw), storiesRaw)
    if (f) fields['stories'] = f
  }

  // 建築完成日期
  const completionDateRaw = extractFirst(
    t,
    /建築完成日期[：:]\s*(民國\d{2,3}年\d{1,2}月\d{1,2}日)/
  )
  if (completionDateRaw !== null) {
    const f = makeField(normalizeRocYear(completionDateRaw), completionDateRaw)
    if (f) fields['completion_date'] = f
  }

  return fields
}

// ─────────────────────────────────────────────
// 建物所有權部（key 加 building_ prefix）
// ─────────────────────────────────────────────

function parseBuildingOwnershipSection(
  section: Section
): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {}
  const t = section.text

  // 登記次序
  const regNumRaw = extractFirst(t, /登記次序[：:]\s*(.+?)(?:\n|$)/)
  if (regNumRaw !== null) {
    fields['building_registration_number'] = { value: regNumRaw, confidence: 0.95 }
  }

  // 權狀字號
  const titleDeedRaw = extractFirst(t, /權狀字號[：:]\s*(.+?)(?:\n|$)/)
  if (titleDeedRaw !== null) {
    fields['building_title_deed_number'] = { value: titleDeedRaw, confidence: 0.95 }
  }

  // 登記日期
  const regDateRaw = extractFirst(t, /登記日期[：:]\s*(民國\d{2,3}年\d{1,2}月\d{1,2}日)/)
  if (regDateRaw !== null) {
    const f = makeField(normalizeDate(regDateRaw), regDateRaw)
    if (f) fields['building_registration_date'] = f
  }

  // 登記原因
  const regReasonRaw = extractFirst(t, /登記原因[：:]\s*(.+?)(?:\n|$)/)
  if (regReasonRaw !== null) {
    fields['building_registration_reason'] = { value: regReasonRaw, confidence: 0.95 }
  }

  // 所有權人
  const ownerNameRaw = extractFirst(t, /所有權人[：:]\s*(.+?)(?:\n|$)/)
  if (ownerNameRaw !== null) {
    fields['building_owner_name'] = { value: ownerNameRaw, confidence: 0.95 }
  }

  // 統一編號
  const ownerIdRaw = extractFirst(t, /統一編號[：:]\s*(.+?)(?:\n|$)/)
  if (ownerIdRaw !== null) {
    fields['building_owner_id_number'] = { value: ownerIdRaw, confidence: 0.95 }
  }

  // 權利範圍
  const rightsRaw = extractFirst(t, /權利範圍[：:]\s*\**(.*?)\**(?:\n|$)/)
  if (rightsRaw !== null) {
    const f = makeField(normalizeRightsRange(rightsRaw), rightsRaw)
    if (f) fields['building_rights_range'] = f
  }

  // 原因發生日期
  const reasonDateRaw = extractFirst(
    t,
    /原因發生日期[：:]\s*(民國\d{2,3}年\d{1,2}月\d{1,2}日)/
  )
  if (reasonDateRaw !== null) {
    const f = makeField(normalizeDate(reasonDateRaw), reasonDateRaw)
    if (f) fields['building_reason_occurrence_date'] = f
  }

  return fields
}

// ─────────────────────────────────────────────
// 建物他項權利部（key 加 building_ prefix）
// ─────────────────────────────────────────────

function parseBuildingOtherRightsSection(
  section: Section
): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {}
  const t = section.text

  // 權利種類
  const rightTypeRaw = extractFirst(t, /權利種類[：:]\s*(.+?)(?:\n|$)/)
  if (rightTypeRaw !== null) {
    fields['building_right_type'] = { value: rightTypeRaw, confidence: 0.95 }
  }

  // 權利人
  const rightHolderRaw = extractFirst(t, /權利人[：:]\s*(.+?)(?:\n|$)/)
  if (rightHolderRaw !== null) {
    fields['building_right_holder_name'] = { value: rightHolderRaw, confidence: 0.95 }
  }

  // 設定日期（使用登記日期欄位）
  const mortgageDateRaw = extractFirst(
    t,
    /登記日期[：:]\s*(民國\d{2,3}年\d{1,2}月\d{1,2}日)/
  )
  if (mortgageDateRaw !== null) {
    const f = makeField(normalizeDate(mortgageDateRaw), mortgageDateRaw)
    if (f) fields['building_mortgage_date'] = f
  }

  // 擔保金額
  const mortgageAmountRaw = extractFirst(t, /擔保債權總金額[：:]\s*([\d,]+)/)
  if (mortgageAmountRaw !== null) {
    const f = makeField(normalizePrice(mortgageAmountRaw), mortgageAmountRaw)
    if (f) fields['building_mortgage_amount'] = f
  }

  return fields
}

// ─────────────────────────────────────────────
// 公開入口
// ─────────────────────────────────────────────

/**
 * 解析建物謄本的所有段落，回傳結構化欄位
 *
 * 建物所有權部與他項權利部的欄位 key 統一加上 `building_` prefix，
 * 方便與土地欄位合併時區分來源。
 *
 * @param sections - 由 splitBySections 切割後的段落陣列
 * @returns 欄位名稱 → ExtractedField 的 Record
 */
export function parseBuildingTranscript(
  sections: Section[]
): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {}

  // 建物標示部
  const descSection = findSection(sections, '建物標示')
  if (descSection) {
    Object.assign(fields, parseBuildingDescriptionSection(descSection))
  }

  // 建物所有權部
  const ownerSection = findSection(sections, '建物所有權')
  if (ownerSection) {
    Object.assign(fields, parseBuildingOwnershipSection(ownerSection))
  }

  // 他項權利部（建物謄本亦可含此段落）
  const otherSection = findSection(sections, '他項權利')
  if (otherSection) {
    Object.assign(fields, parseBuildingOtherRightsSection(otherSection))
  }

  return fields
}
