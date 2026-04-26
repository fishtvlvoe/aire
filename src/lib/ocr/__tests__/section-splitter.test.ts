import { describe, it, expect } from 'vitest'
import { splitBySections } from '../section-splitter'

// ─────────────────────────────────────────────
// splitBySections
// ─────────────────────────────────────────────

describe('splitBySections', () => {
  it('含「土地標示部」「土地所有權部」→ 正確切分為兩個段落', () => {
    const input = `土地標示部
地號：大灣段 6338-0000地號
面積：1,223.00平方公尺
土地所有權部
登記日期：民國105年05月19日
所有權人：顏＊＊`

    const sections = splitBySections(input)
    expect(sections).toHaveLength(2)
    expect(sections[0].name).toBe('土地標示部')
    expect(sections[0].text).toContain('大灣段')
    expect(sections[1].name).toBe('土地所有權部')
    expect(sections[1].text).toContain('所有權人')
  })

  it('含星號包圍的標題（如 *土地標示部*）仍可正確識別', () => {
    const input = `*土地標示部*
面積：100平方公尺
*土地所有權部*
所有權人：王＊＊`

    const sections = splitBySections(input)
    expect(sections).toHaveLength(2)
    expect(sections[0].name).toBe('土地標示部')
    expect(sections[1].name).toBe('土地所有權部')
  })

  it('三個段落（標示部、所有權部、他項權利部）', () => {
    const input = `土地標示部
地號：大灣段 0001-0000
土地所有權部
所有權人：張＊＊
他項權利部
權利種類：抵押權`

    const sections = splitBySections(input)
    expect(sections).toHaveLength(3)
    expect(sections[2].name).toBe('他項權利部')
    expect(sections[2].text).toContain('抵押權')
  })

  it('每個段落的 text 不包含該段落標題本身', () => {
    const input = `土地標示部
面積：500平方公尺`

    const sections = splitBySections(input)
    expect(sections[0].text).not.toContain('土地標示部')
    expect(sections[0].text).toContain('面積')
  })

  it('找不到 header → 回傳 [{ name: "unknown", text }]', () => {
    const input = '這是一段沒有標題的文字內容'
    const sections = splitBySections(input)
    expect(sections).toHaveLength(1)
    expect(sections[0].name).toBe('unknown')
    expect(sections[0].text).toBe(input)
  })

  it('空字串 → [{ name: "unknown", text: "" }]', () => {
    const sections = splitBySections('')
    expect(sections).toHaveLength(1)
    expect(sections[0].name).toBe('unknown')
    expect(sections[0].text).toBe('')
  })

  it('段落內容正確 trim（無前後多餘空白）', () => {
    const input = `土地標示部
    地號：大灣段 6338-0000地號

土地所有權部
    所有權人：顏＊＊`

    const sections = splitBySections(input)
    // 每個段落 text 不應以空白開頭或結尾
    sections.forEach((s) => {
      expect(s.text).toBe(s.text.trim())
    })
  })
})
