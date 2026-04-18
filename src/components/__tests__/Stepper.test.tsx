import { describe, expect, it } from 'vitest'
import { getStepperItemStates } from '@/components/Stepper'

describe('Stepper.getStepperItemStates', () => {
  // 這裡改成「純邏輯測試」：
  // - 不 render React
  // - 不依賴 @testing-library/react / jsdom
  // - 只驗證狀態計算（顏色 + 是否可點）

  it("listingStatus='draft', currentStep=2 → [綠不可點, 藍可點, 灰不可點 x3]", () => {
    const result = getStepperItemStates(2, 'draft')

    expect(result).toEqual([
      { step: 1, state: 'green', clickable: false },
      { step: 2, state: 'blue', clickable: true },
      { step: 3, state: 'gray', clickable: false },
      { step: 4, state: 'gray', clickable: false },
      { step: 5, state: 'gray', clickable: false },
    ])
  })

  it("listingStatus='field-visit-complete', currentStep=3 → [綠不可點, 綠可點, 藍可點, 灰不可點 x2]", () => {
    const result = getStepperItemStates(3, 'field-visit-complete')

    expect(result).toEqual([
      { step: 1, state: 'green', clickable: false },
      { step: 2, state: 'green', clickable: true },
      { step: 3, state: 'blue', clickable: true },
      { step: 4, state: 'gray', clickable: false },
      { step: 5, state: 'gray', clickable: false },
    ])
  })

  it("listingStatus='ready-for-generation', currentStep=4 → [綠不可點, 綠可點 x2, 藍可點, 灰不可點]", () => {
    const result = getStepperItemStates(4, 'ready-for-generation')

    expect(result).toEqual([
      { step: 1, state: 'green', clickable: false },
      { step: 2, state: 'green', clickable: true },
      { step: 3, state: 'green', clickable: true },
      { step: 4, state: 'blue', clickable: true },
      { step: 5, state: 'gray', clickable: false },
    ])
  })

  it("listingStatus='documents-ready', currentStep=5 → [綠不可點, 綠可點 x3, 藍可點]", () => {
    const result = getStepperItemStates(5, 'documents-ready')

    expect(result).toEqual([
      { step: 1, state: 'green', clickable: false },
      { step: 2, state: 'green', clickable: true },
      { step: 3, state: 'green', clickable: true },
      { step: 4, state: 'green', clickable: true },
      { step: 5, state: 'blue', clickable: true },
    ])
  })

  it('listingStatus=null, currentStep=1（新增頁）→ [藍可點, 灰不可點 x4]', () => {
    const result = getStepperItemStates(1, null)

    expect(result).toEqual([
      { step: 1, state: 'blue', clickable: true },
      { step: 2, state: 'gray', clickable: false },
      { step: 3, state: 'gray', clickable: false },
      { step: 4, state: 'gray', clickable: false },
      { step: 5, state: 'gray', clickable: false },
    ])
  })

  it('規則：格1 在 listing 已存在（listingStatus !== null）一律 clickable=false（即使是綠）', () => {
    // 這裡用任一「listing 已存在」狀態即可；重點是格1必定不可點
    const result = getStepperItemStates(5, 'documents-ready')

    expect(result[0]).toEqual({ step: 1, state: 'green', clickable: false })
  })
})
