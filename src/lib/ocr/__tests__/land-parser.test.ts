import { describe, it, expect } from 'vitest'
import { parseLandTranscript } from '../parsers/land-parser'
import type { Section } from '../section-splitter'

// ─────────────────────────────────────────────
// 測試用謄本段落樣本（模擬真實謄本 OCR 後清洗的文字）
// ─────────────────────────────────────────────

const sampleSections: Section[] = [
  {
    name: '土地標示部',
    text: `地號：永康區大灣段 6338-0000地號
面積：1,223.00平方公尺
使用分區：特定農業區
使用地類別：農牧用地
公告土地現值：1,100 元/平方公尺`,
  },
  {
    name: '土地所有權部',
    text: `登記次序：0001
權狀字號：105南麻字第011717號
登記日期：民國105年05月19日
登記原因：買賣
所有權人：顏＊＊
權利範圍：10000分之91`,
  },
]

const sampleWithOtherRights: Section[] = [
  ...sampleSections,
  {
    name: '他項權利部',
    text: `權利種類：抵押權
權利人：台灣銀行
登記日期：民國106年01月15日
擔保債權總金額：5,000,000`,
  },
]

// ─────────────────────────────────────────────
// parseLandTranscript
// ─────────────────────────────────────────────

describe('parseLandTranscript', () => {
  describe('土地標示部欄位', () => {
    it('land_area.value === 1223', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['land_area']).toBeDefined()
      expect(fields['land_area'].value).toBe(1223)
    })

    it('land_area.confidence === 0.95（normalize 成功）', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['land_area'].confidence).toBe(0.95)
    })

    it('land_number 解析出地號', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['land_number']).toBeDefined()
      // 值可以是解析後的地號或含段名的字串
      expect(String(fields['land_number'].value)).toContain('6338-0000')
    })

    it('usage_zone.value === "特定農業區"', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['usage_zone']).toBeDefined()
      expect(fields['usage_zone'].value).toBe('特定農業區')
    })

    it('usage_type.value === "農牧用地"', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['usage_type']).toBeDefined()
      expect(fields['usage_type'].value).toBe('農牧用地')
    })

    it('announced_land_value.value === 1100', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['announced_land_value']).toBeDefined()
      expect(fields['announced_land_value'].value).toBe(1100)
    })
  })

  describe('土地所有權部欄位', () => {
    it('registration_date.value === "2016-05-19"（民國105年05月19日）', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['registration_date']).toBeDefined()
      expect(fields['registration_date'].value).toBe('2016-05-19')
    })

    it('registration_date.confidence === 0.95', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['registration_date'].confidence).toBe(0.95)
    })

    it('rights_range.value 包含 "91/10000"', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['rights_range']).toBeDefined()
      expect(fields['rights_range'].value).toBe('91/10000')
    })

    it('rights_range.confidence === 0.95', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['rights_range'].confidence).toBe(0.95)
    })

    it('owner_name.value === "顏＊＊"', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['owner_name']).toBeDefined()
      expect(fields['owner_name'].value).toBe('顏＊＊')
    })

    it('registration_reason.value === "買賣"', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['registration_reason']).toBeDefined()
      expect(fields['registration_reason'].value).toBe('買賣')
    })

    it('title_deed_number 有值', () => {
      const fields = parseLandTranscript(sampleSections)
      expect(fields['title_deed_number']).toBeDefined()
      expect(String(fields['title_deed_number'].value)).toContain('105南麻字')
    })
  })

  describe('他項權利部欄位', () => {
    it('right_type.value === "抵押權"', () => {
      const fields = parseLandTranscript(sampleWithOtherRights)
      expect(fields['right_type']).toBeDefined()
      expect(fields['right_type'].value).toBe('抵押權')
    })

    it('mortgage_date.value === "2017-01-15"（民國106年01月15日）', () => {
      const fields = parseLandTranscript(sampleWithOtherRights)
      expect(fields['mortgage_date']).toBeDefined()
      expect(fields['mortgage_date'].value).toBe('2017-01-15')
    })

    it('mortgage_amount.value === 5000000', () => {
      const fields = parseLandTranscript(sampleWithOtherRights)
      expect(fields['mortgage_amount']).toBeDefined()
      expect(fields['mortgage_amount'].value).toBe(5000000)
    })
  })

  describe('邊界情況', () => {
    it('空 sections 陣列 → 回傳空 {}', () => {
      const fields = parseLandTranscript([])
      expect(Object.keys(fields)).toHaveLength(0)
    })

    it('sections 皆為 unknown → 不解析任何欄位（無匹配段落名稱）', () => {
      const unknownSections: Section[] = [{ name: 'unknown', text: '無結構的文字' }]
      const fields = parseLandTranscript(unknownSections)
      // 沒有「土地標示」「土地所有權」「他項權利」段落，fields 應為空
      expect(Object.keys(fields)).toHaveLength(0)
    })

    it('缺少「土地所有權部」→ 只解析標示部欄位', () => {
      const onlyDesc: Section[] = [sampleSections[0]]
      const fields = parseLandTranscript(onlyDesc)
      expect(fields['land_area']).toBeDefined()
      expect(fields['registration_date']).toBeUndefined()
    })

    it('公告現值含星號包圍（已清洗樣本）→ 仍能解析', () => {
      // 模擬清洗後的文字（星號已移除）
      const withCleanedStars: Section[] = [
        {
          name: '土地標示部',
          text: `面積：1,223.00平方公尺
公告土地現值：1,100 元/平方公尺`,
        },
      ]
      const fields = parseLandTranscript(withCleanedStars)
      expect(fields['announced_land_value'].value).toBe(1100)
    })
  })
})
