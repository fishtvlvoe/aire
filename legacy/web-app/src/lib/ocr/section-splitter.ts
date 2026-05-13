/**
 * section-splitter.ts — 謄本段落切割器
 *
 * 依照台灣地政謄本的標準段落標題（如「土地標示部」）
 * 將文字切割為具名段落，方便後續 parser 處理。
 */

export type Section = {
  /** 段落名稱，例如「土地標示部」 */
  name: string
  /** 段落內容文字 */
  text: string
}

/**
 * 段落標題 regex
 * 符合格式：可選前導空白與星號，接著純中文 + 「部」，再接可選星號
 * 例：「土地標示部」「土地所有權部」「他項權利部」「建物標示部」「建物所有權部」
 */
const SECTION_HEADER_RE = /^\s*[＊*]*\s*([\u4e00-\u9fa5]+部)\s*[＊*]*\s*$/gm

/**
 * 將已清洗的謄本文字切割為段落陣列
 *
 * 找不到任何段落標題時，回傳單一 unknown 段落。
 */
export function splitBySections(text: string): Section[] {
  const headers: Array<{ name: string; index: number }> = []

  // 找出所有段落標題與其在文字中的位置
  let match: RegExpExecArray | null
  const re = new RegExp(SECTION_HEADER_RE.source, 'gm')

  while ((match = re.exec(text)) !== null) {
    headers.push({
      name: match[1],
      index: match.index,
    })
  }

  // 找不到任何段落標題 → 視為單一未知段落
  if (headers.length === 0) {
    return [{ name: 'unknown', text }]
  }

  const sections: Section[] = []

  for (let i = 0; i < headers.length; i++) {
    const current = headers[i]
    const next = headers[i + 1]

    // 當前段落的內容從標題結尾到下一個標題開始
    const contentStart = current.index + current.name.length
    const contentEnd = next ? next.index : text.length

    const sectionText = text.slice(contentStart, contentEnd).trim()

    sections.push({
      name: current.name,
      text: sectionText,
    })
  }

  return sections
}
