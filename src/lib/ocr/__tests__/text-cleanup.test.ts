import { describe, it, expect } from 'vitest'
import { stripFillerChars } from '../text-cleanup'

// ─────────────────────────────────────────────
// stripFillerChars
// ─────────────────────────────────────────────

describe('stripFillerChars', () => {
  it('移除半形星號 *', () => {
    const result = stripFillerChars('*****1,223.00*****')
    expect(result).toBe('1,223.00')
  })

  it('移除全形星號 ＊', () => {
    const result = stripFillerChars('＊＊面積＊＊')
    expect(result).toBe('面積')
  })

  it('移除全形空白 U+3000（直接刪除，不留空白）', () => {
    // \u3000 為全形空白，實作直接 replace 為空字串
    const result = stripFillerChars('土地\u3000標示')
    expect(result).toBe('土地標示')
  })

  it('壓縮連續半形空白為單一空白', () => {
    const result = stripFillerChars('面積：   1223')
    expect(result).toBe('面積： 1223')
  })

  it('保留 Tab → 轉為單一空白', () => {
    const result = stripFillerChars('地號：\t6338-0000')
    expect(result).toBe('地號： 6338-0000')
  })

  it('中文之間的孤立 \\n 移除（避免斷詞）', () => {
    // 「大\n灣」→「大灣」
    const result = stripFillerChars('大\n灣段')
    expect(result).toBe('大灣段')
  })

  it('數字之間的孤立 \\n 移除', () => {
    const result = stripFillerChars('123\n456')
    expect(result).toBe('123456')
  })

  it('保留 \\n\\n（段落分隔）', () => {
    const result = stripFillerChars('第一段\n\n第二段')
    expect(result).toBe('第一段\n\n第二段')
  })

  it('空字串 → 空字串', () => {
    expect(stripFillerChars('')).toBe('')
  })

  it('同時含星號、全形空白、連續空白', () => {
    const input = '***面積：\u3000  1,223***'
    const result = stripFillerChars(input)
    expect(result).toBe('面積： 1,223')
  })
})
