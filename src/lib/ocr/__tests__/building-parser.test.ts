import { describe, it, expect } from 'vitest'
import { parseBuildingTranscript } from '../parsers/building-parser'
import type { Section } from '../section-splitter'

// ─────────────────────────────────────────────
// 測試用建物謄本段落樣本
// ─────────────────────────────────────────────

const sampleSections: Section[] = [
  {
    name: '建物標示部',
    text: `建號：永康區大灣段 0012-000建號
坐落地址：台南市永康區中山路100號3樓
總面積：85.30平方公尺
主要建材：鋼筋混凝土造
主要用途：住家用
層數：14
建築完成日期：民國90年06月30日`,
  },
  {
    name: '建物所有權部',
    text: `登記次序：0001
權狀字號：103南麻字第005566號
登記日期：民國103年08月20日
登記原因：買賣
所有權人：林＊＊
權利範圍：1分之1`,
  },
]

const sampleWithOtherRights: Section[] = [
  ...sampleSections,
  {
    name: '他項權利部',
    text: `權利種類：最高限額抵押權
權利人：第一銀行
登記日期：民國103年09月01日
擔保債權總金額：3,600,000`,
  },
]

// ─────────────────────────────────────────────
// parseBuildingTranscript
// ─────────────────────────────────────────────

describe('parseBuildingTranscript', () => {
  describe('建物標示部欄位', () => {
    it('building_area.value === 85.3', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['building_area']).toBeDefined()
      expect(fields['building_area'].value).toBe(85.3)
    })

    it('building_area.confidence === 0.95', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['building_area'].confidence).toBe(0.95)
    })

    it('building_number 含地號格式', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['building_number']).toBeDefined()
      expect(String(fields['building_number'].value)).toContain('0012-000')
    })

    it('building_address.value 含門牌號碼', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['building_address']).toBeDefined()
      expect(String(fields['building_address'].value)).toContain('永康區')
    })

    it('main_material.value === "鋼筋混凝土造"', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['main_material']).toBeDefined()
      expect(fields['main_material'].value).toBe('鋼筋混凝土造')
    })

    it('main_usage.value === "住家用"', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['main_usage']).toBeDefined()
      expect(fields['main_usage'].value).toBe('住家用')
    })

    it('stories.value === 14（移除前導零）', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['stories']).toBeDefined()
      expect(fields['stories'].value).toBe(14)
    })

    it('completion_date.value === "2001-06-30"（民國90年）', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['completion_date']).toBeDefined()
      expect(fields['completion_date'].value).toBe('2001-06-30')
    })
  })

  describe('建物所有權部欄位（building_ prefix）', () => {
    it('building_registration_date.value === "2014-08-20"', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['building_registration_date']).toBeDefined()
      expect(fields['building_registration_date'].value).toBe('2014-08-20')
    })

    it('building_registration_date.confidence === 0.95', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['building_registration_date'].confidence).toBe(0.95)
    })

    it('building_rights_range.value === "1/1"（全部 1分之1）', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['building_rights_range']).toBeDefined()
      expect(fields['building_rights_range'].value).toBe('1/1')
    })

    it('building_owner_name.value === "林＊＊"', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['building_owner_name']).toBeDefined()
      expect(fields['building_owner_name'].value).toBe('林＊＊')
    })

    it('building_registration_reason.value === "買賣"', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['building_registration_reason']).toBeDefined()
      expect(fields['building_registration_reason'].value).toBe('買賣')
    })

    it('building_title_deed_number 有值', () => {
      const fields = parseBuildingTranscript(sampleSections)
      expect(fields['building_title_deed_number']).toBeDefined()
      expect(String(fields['building_title_deed_number'].value)).toContain('103南麻字')
    })
  })

  describe('他項權利部欄位（building_ prefix）', () => {
    it('building_right_type.value === "最高限額抵押權"', () => {
      const fields = parseBuildingTranscript(sampleWithOtherRights)
      expect(fields['building_right_type']).toBeDefined()
      expect(fields['building_right_type'].value).toBe('最高限額抵押權')
    })

    it('building_mortgage_date.value === "2014-09-01"（民國103年）', () => {
      const fields = parseBuildingTranscript(sampleWithOtherRights)
      expect(fields['building_mortgage_date']).toBeDefined()
      expect(fields['building_mortgage_date'].value).toBe('2014-09-01')
    })

    it('building_mortgage_amount.value === 3600000', () => {
      const fields = parseBuildingTranscript(sampleWithOtherRights)
      expect(fields['building_mortgage_amount']).toBeDefined()
      expect(fields['building_mortgage_amount'].value).toBe(3600000)
    })
  })

  describe('邊界情況', () => {
    it('空 sections 陣列 → 回傳空 {}', () => {
      const fields = parseBuildingTranscript([])
      expect(Object.keys(fields)).toHaveLength(0)
    })

    it('無建物段落 → 回傳空 {}', () => {
      const landOnlySections: Section[] = [
        { name: '土地標示部', text: '面積：100平方公尺' },
      ]
      const fields = parseBuildingTranscript(landOnlySections)
      expect(Object.keys(fields)).toHaveLength(0)
    })

    it('缺少建物所有權部 → 只解析標示部欄位', () => {
      const onlyDesc: Section[] = [sampleSections[0]]
      const fields = parseBuildingTranscript(onlyDesc)
      expect(fields['building_area']).toBeDefined()
      expect(fields['building_registration_date']).toBeUndefined()
    })

    it('建物欄位 key 帶有 building_ prefix（不與土地欄位衝突）', () => {
      const fields = parseBuildingTranscript(sampleSections)
      // 確認所有所有權部欄位都有 building_ prefix
      const ownershipKeys = Object.keys(fields).filter(
        (k) => k.includes('registration') || k.includes('owner') || k.includes('rights_range')
      )
      ownershipKeys.forEach((k) => {
        expect(k.startsWith('building_')).toBe(true)
      })
    })
  })
})
