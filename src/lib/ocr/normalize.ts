/**
 * normalize.ts — 欄位值標準化工具函式
 *
 * 所有函式為純函式，無副作用。
 * 無法解析時回傳 null，不拋出例外。
 * 輸入為 null/undefined 時一律回傳 null。
 */

/**
 * 民國日期轉西元日期字串
 * 例：民國115年04月02日 → 2026-04-02
 */
export function normalizeDate(raw: string): string | null {
  if (!raw) return null

  // 民國年格式：民國? + 數字 + 年 + 月 + 日
  const match = raw.match(/(?:民國)?(\d{2,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
  if (!match) return null

  const rocYear = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const day = parseInt(match[3], 10)

  const year = rocYear + 1911

  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')

  return `${year}-${mm}-${dd}`
}

/**
 * 面積字串轉數字（平方公尺）
 * 例：1,223.00 平方公尺 → 1223.00
 */
export function normalizeArea(raw: string): number | null {
  if (!raw) return null

  // 移除千分位逗號，擷取數字部分
  const match = raw.match(/([\d,]+(?:\.\d+)?)/)
  if (!match) return null

  const cleaned = match[1].replace(/,/g, '')
  const value = parseFloat(cleaned)

  return isNaN(value) ? null : value
}

/**
 * 價格字串轉數字
 * 例：71,812 元/平方公尺 → 71812
 */
export function normalizePrice(raw: string): number | null {
  if (!raw) return null

  const match = raw.match(/([\d,]+(?:\.\d+)?)/)
  if (!match) return null

  const cleaned = match[1].replace(/,/g, '')
  const value = parseFloat(cleaned)

  return isNaN(value) ? null : value
}

/**
 * 持分字串轉標準分數格式
 * 例：10000分之91 → 91/10000
 *     全部 1分之1 → 1/1
 */
export function normalizeRightsRange(raw: string): string | null {
  if (!raw) return null

  // 格式：N分之M
  const match = raw.match(/(\d+)\s*分之\s*(\d+)/)
  if (!match) return null

  const denominator = match[1]
  const numerator = match[2]

  return `${numerator}/${denominator}`
}

/**
 * 空值標準化：將各種形式的「空」轉為 null
 * 例：(空白) / [(空白)] / 空字串 → null；否則回傳原值
 */
export function normalizeEmpty(value: string | null | undefined): null | string {
  if (value === null || value === undefined) return null

  const trimmed = value.trim()

  // 空字串
  if (trimmed === '') return null

  // 常見「無值」佔位符：(空白)、（空白）、[ ]、[空白] 等
  if (/^[\(（\[【]?\s*空\s*白\s*[\)）\]】]?$/.test(trimmed)) return null

  return value
}

/**
 * 樓層字串轉數字，移除前導零
 * 例：010層 → 10
 */
export function normalizeStories(raw: string): number | null {
  if (!raw) return null

  const match = raw.match(/(\d+)/)
  if (!match) return null

  const value = parseInt(match[1], 10)

  return isNaN(value) ? null : value
}

/**
 * 地號解析：從文字中擷取段名與地號
 * 例：永康區大灣段 6338-0000地號 → { section: '大灣段', number: '6338-0000', raw: '...' }
 */
export function parseLandParcel(
  text: string
): { section?: string; number?: string; raw: string } | null {
  if (!text) return null

  const trimmed = text.trim()
  if (!trimmed) return null

  // 擷取段名：任何中文 + 「段」
  const sectionMatch = trimmed.match(/([\u4e00-\u9fa5]+段)/)
  const section = sectionMatch ? sectionMatch[1] : undefined

  // 擷取地號：數字-數字 格式（可能有「地號」後綴）
  const numberMatch = trimmed.match(/(\d{1,6}-\d{4})/)
  const number = numberMatch ? numberMatch[1] : undefined

  // 至少要有段名或地號才算有效
  if (!section && !number) return null

  return { section, number, raw: trimmed }
}
