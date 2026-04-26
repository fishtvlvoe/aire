import { describe, it, expect } from 'vitest'
import {
  normalizeDate,
  normalizeArea,
  normalizePrice,
  normalizeRightsRange,
  normalizeEmpty,
  normalizeStories,
  parseLandParcel,
} from '../normalize'

// ─────────────────────────────────────────────
// normalizeDate
// ─────────────────────────────────────────────

describe('normalizeDate', () => {
  it('民國115年04月02日 → 2026-04-02', () => {
    expect(normalizeDate('民國115年04月02日')).toBe('2026-04-02')
  })

  it('民國90年7月13日（個位數月日）→ 2001-07-13', () => {
    expect(normalizeDate('民國90年7月13日')).toBe('2001-07-13')
  })

  it('105年05月19日（省略「民國」前綴）→ 2016-05-19', () => {
    expect(normalizeDate('105年05月19日')).toBe('2016-05-19')
  })

  it('null 輸入 → null', () => {
    expect(normalizeDate(null as unknown as string)).toBeNull()
  })

  it('空字串 → null', () => {
    expect(normalizeDate('')).toBeNull()
  })

  it('格式錯誤（無「年月日」）→ null', () => {
    expect(normalizeDate('2026/04/02')).toBeNull()
  })

  it('含雜訊前後文字仍能解析', () => {
    expect(normalizeDate('登記日期：民國105年03月01日 其他文字')).toBe('2016-03-01')
  })
})

// ─────────────────────────────────────────────
// normalizeArea
// ─────────────────────────────────────────────

describe('normalizeArea', () => {
  it('千分位字串 "1,223.00 平方公尺" → 1223', () => {
    expect(normalizeArea('1,223.00 平方公尺')).toBe(1223)
  })

  it('"0.5" → 0.5', () => {
    expect(normalizeArea('0.5')).toBe(0.5)
  })

  it('"56.78" → 56.78', () => {
    expect(normalizeArea('56.78')).toBe(56.78)
  })

  it('null 輸入 → null', () => {
    expect(normalizeArea(null as unknown as string)).toBeNull()
  })

  it('空字串 → null', () => {
    expect(normalizeArea('')).toBeNull()
  })

  it('純文字無數字 → null', () => {
    expect(normalizeArea('無面積資料')).toBeNull()
  })
})

// ─────────────────────────────────────────────
// normalizePrice
// ─────────────────────────────────────────────

describe('normalizePrice', () => {
  it('"71,812 元/平方公尺" → 71812', () => {
    expect(normalizePrice('71,812 元/平方公尺')).toBe(71812)
  })

  it('"1,100" → 1100', () => {
    expect(normalizePrice('1,100')).toBe(1100)
  })

  it('"500" → 500（無逗號）', () => {
    expect(normalizePrice('500')).toBe(500)
  })

  it('null 輸入 → null', () => {
    expect(normalizePrice(null as unknown as string)).toBeNull()
  })

  it('空字串 → null', () => {
    expect(normalizePrice('')).toBeNull()
  })

  it('純文字無數字 → null', () => {
    expect(normalizePrice('不詳')).toBeNull()
  })
})

// ─────────────────────────────────────────────
// normalizeRightsRange
// ─────────────────────────────────────────────

describe('normalizeRightsRange', () => {
  it('"10000分之91" → "91/10000"', () => {
    expect(normalizeRightsRange('10000分之91')).toBe('91/10000')
  })

  it('"全部 1分之1" → "1/1"', () => {
    expect(normalizeRightsRange('全部 1分之1')).toBe('1/1')
  })

  it('"2分之1" → "1/2"', () => {
    expect(normalizeRightsRange('2分之1')).toBe('1/2')
  })

  it('null 輸入 → null', () => {
    expect(normalizeRightsRange(null as unknown as string)).toBeNull()
  })

  it('空字串 → null', () => {
    expect(normalizeRightsRange('')).toBeNull()
  })

  it('找不到「分之」格式 → null', () => {
    expect(normalizeRightsRange('全部')).toBeNull()
  })
})

// ─────────────────────────────────────────────
// normalizeEmpty
// ─────────────────────────────────────────────

describe('normalizeEmpty', () => {
  it('"(空白)" → null', () => {
    expect(normalizeEmpty('(空白)')).toBeNull()
  })

  it('"[(空白)]"（方括號 + 圓括號混用）→ 回傳原值（regex 不匹配此格式）', () => {
    // 實作 regex：^[\(（\[【]?\s*空\s*白\s*[\)）\]】]?$ 只匹配單一括號包圍
    // "[(空白)]" 含兩層括號，不被視為空值
    expect(normalizeEmpty('[(空白)]')).toBe('[(空白)]')
  })

  it('"（空白）"（全形括號）→ null', () => {
    expect(normalizeEmpty('（空白）')).toBeNull()
  })

  it('空字串 → null', () => {
    expect(normalizeEmpty('')).toBeNull()
  })

  it('null → null', () => {
    expect(normalizeEmpty(null)).toBeNull()
  })

  it('undefined → null', () => {
    expect(normalizeEmpty(undefined)).toBeNull()
  })

  it('"有值" → 回傳原字串', () => {
    expect(normalizeEmpty('農牧用地')).toBe('農牧用地')
  })

  it('純空白字串 → null', () => {
    expect(normalizeEmpty('   ')).toBeNull()
  })
})

// ─────────────────────────────────────────────
// normalizeStories
// ─────────────────────────────────────────────

describe('normalizeStories', () => {
  it('"010層" → 10（移除前導零）', () => {
    expect(normalizeStories('010層')).toBe(10)
  })

  it('"3" → 3', () => {
    expect(normalizeStories('3')).toBe(3)
  })

  it('"14層" → 14', () => {
    expect(normalizeStories('14層')).toBe(14)
  })

  it('null 輸入 → null', () => {
    expect(normalizeStories(null as unknown as string)).toBeNull()
  })

  it('空字串 → null', () => {
    expect(normalizeStories('')).toBeNull()
  })

  it('無數字文字 → null', () => {
    expect(normalizeStories('無資料')).toBeNull()
  })
})

// ─────────────────────────────────────────────
// parseLandParcel
// ─────────────────────────────────────────────

describe('parseLandParcel', () => {
  it('標準格式 "永康區大灣段 6338-0000地號" → section 含區名，number 正確', () => {
    // 實作 regex ([\u4e00-\u9fa5]+段) 貪婪匹配，會取到「永康區大灣段」
    const result = parseLandParcel('永康區大灣段 6338-0000地號')
    expect(result).not.toBeNull()
    expect(result!.section).toContain('大灣段')
    expect(result!.number).toBe('6338-0000')
  })

  it('僅有段名無地號 → section 有值，number 為 undefined', () => {
    const result = parseLandParcel('大灣段')
    expect(result).not.toBeNull()
    expect(result!.section).toBe('大灣段')
    expect(result!.number).toBeUndefined()
  })

  it('含 raw 欄位為 trimmed 原始文字', () => {
    const result = parseLandParcel('  安南區海東段 0012-0001  ')
    expect(result).not.toBeNull()
    expect(result!.raw).toBe('安南區海東段 0012-0001')
  })

  it('null 輸入 → null', () => {
    expect(parseLandParcel(null as unknown as string)).toBeNull()
  })

  it('空字串 → null', () => {
    expect(parseLandParcel('')).toBeNull()
  })

  it('無段名也無地號格式 → null', () => {
    expect(parseLandParcel('無效文字')).toBeNull()
  })
})
