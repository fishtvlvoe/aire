import { describe, expect, it } from 'vitest'

// 注意：此檔採 TDD「紅燈」流程。
// 目前 src/lib/listing-routes.ts 尚未存在，因此 import 會失敗是「預期行為」。
import {
  resolveListingActionLabel,
  resolveListingHref,
} from '@/lib/listing-routes'

// 注意：此型別需與實作一致（此處僅為測試可讀性）。
type ListingStatus =
  | 'draft'
  | 'field-visit-complete'
  | 'ready-for-generation'
  | 'documents-ready'

// 依需求：listing 物件 shape 必須是 { id: number, status: ListingStatus }。
type Listing = { id: number; status: ListingStatus }

describe('listing-routes（TDD 紅燈）', () => {
  it('resolveListingHref / resolveListingActionLabel：應依 status 回傳正確 href 與按鈕文案', () => {
    const cases: Array<{
      status: ListingStatus
      expectedHref: string
      expectedLabel: string
    }> = [
      {
        status: 'documents-ready',
        expectedHref: '/listings/10/documents',
        expectedLabel: '查看文件',
      },
      {
        status: 'draft',
        expectedHref: '/listings/10/fill',
        expectedLabel: '進入填寫',
      },
      {
        status: 'field-visit-complete',
        expectedHref: '/listings/10/fill',
        expectedLabel: '進入填寫',
      },
      {
        status: 'ready-for-generation',
        expectedHref: '/listings/10/fill',
        expectedLabel: '進入填寫',
      },
    ]

    for (const tc of cases) {
      const listing: Listing = { id: 10, status: tc.status }

      expect(resolveListingHref(listing)).toBe(tc.expectedHref)
      expect(resolveListingActionLabel(listing)).toBe(tc.expectedLabel)
    }
  })
})
