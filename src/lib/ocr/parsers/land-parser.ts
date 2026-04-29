/**
 * land-parser.ts — 土地謄本規則解析器
 *
 * 從切割後的段落中抽取台灣土地登記謄本的結構化欄位。
 * 涵蓋：土地標示部、土地所有權部、他項權利部。
 */

import type { ExtractedField } from '../index'
import type { Section } from '../section-splitter'
import {
  normalizeDate,
  normalizeArea,
  normalizePrice,
  normalizeRightsRange,
  normalizeOwnershipScope,
  normalizeEmpty,
  parseLandParcel,
} from '../normalize'

// ─────────────────────────────────────────────
// 內部工具
// ─────────────────────────────────────────────

/**
 * 在 sections 中找到名稱包含指定關鍵字的段落
 */
function findSection(sections: Section[], keyword: string): Section | undefined {
  return sections.find((s) => s.name.includes(keyword))
}

/**
 * 建立 ExtractedField，confidence 依解析結果決定：
 * - normalize 回傳非 null → 0.95（高信心）
 * - rawValue 存在但 normalize 失敗 → 0.7（部分匹配）
 */
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
  // 找不到任何值 → 不加入 fields
  return null
}

/**
 * 對文字應用 regex，回傳第 1 個捕捉群組，找不到回傳 null
 */
function extractFirst(text: string, re: RegExp): string | null {
  const m = re.exec(text)
  return m ? m[1].trim() : null
}

// ─────────────────────────────────────────────
// 土地標示部
// ─────────────────────────────────────────────

function parseLandDescriptionSection(
  section: Section
): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {}
  const t = section.text

  // 地段地號
  const landParcelRaw = extractFirst(t, /([\u4e00-\u9fa5]+段)\s*(\d{4,5}-\d{3,4})(?:地號)?/)
  if (landParcelRaw !== null) {
    // 重新抓完整比對字串給 parseLandParcel
    const fullMatch = t.match(/([\u4e00-\u9fa5]+段\s*\d{4,5}-\d{3,4}(?:地號)?)/)
    const raw = fullMatch ? fullMatch[1] : landParcelRaw
    const parsed = parseLandParcel(raw)
    if (parsed) {
      fields['land_number'] = { value: parsed.number ?? parsed.raw, confidence: 0.95 }
    } else {
      fields['land_number'] = { value: raw, confidence: 0.7 }
    }
  }

  // 面積
  const areaRaw = extractFirst(t, /面\s*積[：:]\s*\**([\d,]+\.?\d*)\s*平方公尺/)
  if (areaRaw !== null) {
    const f = makeField(normalizeArea(areaRaw), areaRaw)
    if (f) fields['land_area'] = f
  }

  // 使用分區
  const usageZoneRaw = extractFirst(t, /使用分區[：:]\s*(.+?)(?:\n|$)/)
  if (usageZoneRaw !== null) {
    const normalized = normalizeEmpty(usageZoneRaw)
    const f = makeField(normalized, usageZoneRaw)
    if (f) fields['usage_zone'] = f
  }

  // 使用地類別
  const usageTypeRaw = extractFirst(t, /使用地類別[：:]\s*(.+?)(?:\n|$)/)
  if (usageTypeRaw !== null) {
    const normalized = normalizeEmpty(usageTypeRaw)
    const f = makeField(normalized, usageTypeRaw)
    if (f) fields['usage_type'] = f
  }

  // 公告土地現值
  const announcedLandValueRaw = extractFirst(t, /公告土地現值[：:]\s*([\d,]+)\s*元/)
  if (announcedLandValueRaw !== null) {
    const f = makeField(normalizePrice(announcedLandValueRaw), announcedLandValueRaw)
    if (f) fields['announced_land_value'] = f
  }

  // 公告地價
  const announcedPriceRaw = extractFirst(t, /公告地價[：:]\s*([\d,]+)\s*元/)
  if (announcedPriceRaw !== null) {
    const f = makeField(normalizePrice(announcedPriceRaw), announcedPriceRaw)
    if (f) fields['announced_price'] = f
  }

  // 地上建物建號：逐行掃描，收集符合「建號」格式的行
  const buildingNumbers: string[] = []
  for (const line of t.split('\n')) {
    const trimmed = line.trim()
    // 建號格式：純數字或「數字-數字」，通常出現在「地上建物建號」欄位後的行
    if (/^地上建物建號/.test(trimmed)) {
      // 同行有值時直接取
      const inline = trimmed.replace(/^地上建物建號[：:]\s*/, '').trim()
      if (inline) buildingNumbers.push(inline)
    } else if (buildingNumbers.length > 0 && /^\d{4,6}(?:-\d{3,4})?$/.test(trimmed)) {
      buildingNumbers.push(trimmed)
    }
  }
  if (buildingNumbers.length > 0) {
    fields['buildings_on_land'] = { value: buildingNumbers, confidence: 0.95 }
  }

  return fields
}

// ─────────────────────────────────────────────
// 土地所有權部
// ─────────────────────────────────────────────

function parseLandOwnershipSection(
  section: Section
): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {}
  const t = section.text

  // 登記次序（保留原值）
  const regNumRaw = extractFirst(t, /登記次序[：:]\s*(.+?)(?:\n|$)/)
  if (regNumRaw !== null) {
    fields['registration_number'] = { value: regNumRaw, confidence: 0.95 }
  }

  // 權狀字號（保留原值）
  const titleDeedRaw = extractFirst(t, /權狀字號[：:]\s*(.+?)(?:\n|$)/)
  if (titleDeedRaw !== null) {
    fields['title_deed_number'] = { value: titleDeedRaw, confidence: 0.95 }
  }

  // 登記日期
  const regDateRaw = extractFirst(t, /登記日期[：:]\s*(民國\d{2,3}年\d{1,2}月\d{1,2}日)/)
  if (regDateRaw !== null) {
    const f = makeField(normalizeDate(regDateRaw), regDateRaw)
    if (f) fields['registration_date'] = f
  }

  // 登記原因（保留原值）
  const regReasonRaw = extractFirst(t, /登記原因[：:]\s*(.+?)(?:\n|$)/)
  if (regReasonRaw !== null) {
    fields['registration_reason'] = { value: regReasonRaw, confidence: 0.95 }
  }

  // 所有權人（保留原值）
  const ownerNameRaw = extractFirst(t, /所有權人[：:]\s*(.+?)(?:\n|$)/)
  if (ownerNameRaw !== null) {
    fields['owner_name'] = { value: ownerNameRaw, confidence: 0.95 }
  }

  // 統一編號（保留原值）
  const ownerIdRaw = extractFirst(t, /統一編號[：:]\s*(.+?)(?:\n|$)/)
  if (ownerIdRaw !== null) {
    fields['owner_id_number'] = { value: ownerIdRaw, confidence: 0.95 }
  }

  // 權利範圍
  const rightsRaw = extractFirst(t, /權利範圍[：:]\s*\**(.*?)\**(?:\n|$)/)
  if (rightsRaw !== null) {
    const f = makeField(normalizeRightsRange(rightsRaw), rightsRaw)
    if (f) fields['rights_range'] = f

    const scope = normalizeOwnershipScope(rightsRaw)
    if (scope !== null) fields['ownership_scope'] = { value: scope, confidence: 0.95 }
  }

  // 原因發生日期
  const reasonDateRaw = extractFirst(t, /原因發生日期[：:]\s*(民國\d{2,3}年\d{1,2}月\d{1,2}日)/)
  if (reasonDateRaw !== null) {
    const f = makeField(normalizeDate(reasonDateRaw), reasonDateRaw)
    if (f) fields['reason_occurrence_date'] = f
  }

  return fields
}

// ─────────────────────────────────────────────
// 他項權利部
// ─────────────────────────────────────────────

function parseLandOtherRightsSection(
  section: Section
): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {}
  const t = section.text

  // 權利種類（保留原值）
  const rightTypeRaw = extractFirst(t, /權利種類[：:]\s*(.+?)(?:\n|$)/)
  if (rightTypeRaw !== null) {
    fields['right_type'] = { value: rightTypeRaw, confidence: 0.95 }
  }

  // 權利人（保留原值）
  const rightHolderRaw = extractFirst(t, /權利人[：:]\s*(.+?)(?:\n|$)/)
  if (rightHolderRaw !== null) {
    fields['right_holder_name'] = { value: rightHolderRaw, confidence: 0.95 }
  }

  // 設定日期（使用登記日期欄位）
  const mortgageDateRaw = extractFirst(t, /登記日期[：:]\s*(民國\d{2,3}年\d{1,2}月\d{1,2}日)/)
  if (mortgageDateRaw !== null) {
    const f = makeField(normalizeDate(mortgageDateRaw), mortgageDateRaw)
    if (f) fields['mortgage_date'] = f
  }

  // 擔保金額
  const mortgageAmountRaw = extractFirst(t, /擔保債權總金額[：:]\s*([\d,]+)/)
  if (mortgageAmountRaw !== null) {
    const f = makeField(normalizePrice(mortgageAmountRaw), mortgageAmountRaw)
    if (f) fields['mortgage_amount'] = f
  }

  return fields
}

// ─────────────────────────────────────────────
// 公開入口
// ─────────────────────────────────────────────

/**
 * 解析土地謄本的所有段落，回傳結構化欄位
 *
 * @param sections - 由 splitBySections 切割後的段落陣列
 * @returns 欄位名稱 → ExtractedField 的 Record
 */
export function parseLandTranscript(
  sections: Section[]
): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {}

  // 土地標示部
  const descSection = findSection(sections, '土地標示')
  if (descSection) {
    Object.assign(fields, parseLandDescriptionSection(descSection))
  }

  // 土地所有權部
  const ownerSection = findSection(sections, '土地所有權')
  if (ownerSection) {
    Object.assign(fields, parseLandOwnershipSection(ownerSection))
  }

  // 他項權利部
  const otherSection = findSection(sections, '他項權利')
  if (otherSection) {
    Object.assign(fields, parseLandOtherRightsSection(otherSection))
  }

  return fields
}
