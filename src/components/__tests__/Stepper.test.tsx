import { describe, expect, it } from 'vitest'
import { getStepperItemStates } from '@/components/Stepper'

describe('Stepper.getStepperItemStates', () => {
  // 純邏輯測試（4 步驟版：選類型→現勘→產生中→文件輸出，補件已獨立）

  it("listingStatus='draft', currentStep=2 → [綠不可點, 藍可點, 灰不可點 x2]", () => {
    const result = getStepperItemStates(2, 'draft')

    expect(result).toEqual([
      { step: 1, state: 'green', clickable: false },
      { step: 2, state: 'blue', clickable: true },
      { step: 3, state: 'gray', clickable: false },
      { step: 4, state: 'gray', clickable: false },
    ])
  })

  it("listingStatus='field-visit-complete', currentStep=3 → [綠不可點, 綠可點, 藍可點, 灰不可點]", () => {
    const result = getStepperItemStates(3, 'field-visit-complete')

    expect(result).toEqual([
      { step: 1, state: 'green', clickable: false },
      { step: 2, state: 'green', clickable: true },
      { step: 3, state: 'blue', clickable: true },
      { step: 4, state: 'gray', clickable: false },
    ])
  })

  it("listingStatus='ready-for-generation', currentStep=3 → [綠不可點, 綠可點, 藍可點, 灰不可點]", () => {
    const result = getStepperItemStates(3, 'ready-for-generation')

    expect(result).toEqual([
      { step: 1, state: 'green', clickable: false },
      { step: 2, state: 'green', clickable: true },
      { step: 3, state: 'blue', clickable: true },
      { step: 4, state: 'gray', clickable: false },
    ])
  })

  it("listingStatus='documents-ready', currentStep=4 → [綠不可點, 綠可點 x2, 藍可點]", () => {
    const result = getStepperItemStates(4, 'documents-ready')

    expect(result).toEqual([
      { step: 1, state: 'green', clickable: false },
      { step: 2, state: 'green', clickable: true },
      { step: 3, state: 'green', clickable: true },
      { step: 4, state: 'blue', clickable: true },
    ])
  })

  it('listingStatus=null, currentStep=1（新增頁）→ [藍可點, 灰不可點 x3]', () => {
    const result = getStepperItemStates(1, null)

    expect(result).toEqual([
      { step: 1, state: 'blue', clickable: true },
      { step: 2, state: 'gray', clickable: false },
      { step: 3, state: 'gray', clickable: false },
      { step: 4, state: 'gray', clickable: false },
    ])
  })

  it('規則：格1 在 listing 已存在（listingStatus !== null）一律 clickable=false（即使是綠）', () => {
    const result = getStepperItemStates(4, 'documents-ready')

    expect(result[0]).toEqual({ step: 1, state: 'green', clickable: false })
  })
})
