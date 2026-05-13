/**
 * mixed-parser.ts — 混合謄本解析器
 *
 * 自動偵測 sections 中包含的段落類型，
 * 依序呼叫土地或建物 parser，最後合併結果。
 *
 * 合併無衝突：建物欄位已加 `building_` prefix（見 building-parser.ts）。
 */

import type { ExtractedField } from '../index'
import type { Section } from '../section-splitter'
import { parseLandTranscript } from './land-parser'
import { parseBuildingTranscript } from './building-parser'

/**
 * 解析混合謄本（可同時含土地與建物段落）
 *
 * 邏輯：
 * 1. 掃描 sections，判斷是否含「土地」相關段落
 * 2. 掃描 sections，判斷是否含「建物」相關段落
 * 3. 有土地 → 跑 parseLandTranscript，結果合入 fields
 * 4. 有建物 → 跑 parseBuildingTranscript，結果合入 fields
 * 5. 兩者都沒找到 → 回傳空 {}
 *
 * @param sections - 由 splitBySections 切割後的段落陣列
 * @returns 欄位名稱 → ExtractedField 的 Record（土地 + 建物欄位合併）
 */
export function parseMixedTranscript(
  sections: Section[]
): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {}

  // 判斷是否含土地相關段落（標示部或所有權部皆算）
  const hasLand = sections.some((s) => s.name.includes('土地'))

  // 判斷是否含建物相關段落
  const hasBuilding = sections.some((s) => s.name.includes('建物'))

  if (!hasLand && !hasBuilding) {
    // 找不到任何已知段落類型，回傳空結果
    return {}
  }

  // 土地欄位（key 無 prefix，如 land_area、owner_name 等）
  if (hasLand) {
    Object.assign(fields, parseLandTranscript(sections))
  }

  // 建物欄位（key 有 building_ prefix，無衝突）
  if (hasBuilding) {
    Object.assign(fields, parseBuildingTranscript(sections))
  }

  return fields
}
