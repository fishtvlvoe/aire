import { describe, expect, it } from 'vitest'

import { findNextNonEmptyChapterId, hasNextNonEmptyChapter } from '../navigation-helpers'

type Chapter = { id: string; fields: unknown[] }

describe('FieldVisitForm navigation helpers', () => {
  it('all non-empty: middle chapter can find next', () => {
    const chapters: Chapter[] = [
      { id: 'c1', fields: [1] },
      { id: 'c2', fields: [1] },
      { id: 'c3', fields: [1] },
      { id: 'c4', fields: [1] },
      { id: 'c5', fields: [1] },
    ]

    expect(findNextNonEmptyChapterId(chapters, 'c2')).toBe('c3')
    expect(hasNextNonEmptyChapter(chapters, 'c2')).toBe(true)
  })

  it('skips empty chapters in the middle', () => {
    const chapters: Chapter[] = [
      { id: 'c1', fields: [1] },
      { id: 'c2', fields: [1] },
      { id: 'c3', fields: [] },
      { id: 'c4', fields: [1] },
      { id: 'c5', fields: [1] },
    ]

    expect(findNextNonEmptyChapterId(chapters, 'c2')).toBe('c4')
    expect(hasNextNonEmptyChapter(chapters, 'c2')).toBe(true)
  })

  it('last chapter: returns null/false', () => {
    const chapters: Chapter[] = [
      { id: 'c1', fields: [1] },
      { id: 'c2', fields: [1] },
      { id: 'c3', fields: [] },
      { id: 'c4', fields: [1] },
    ]

    expect(findNextNonEmptyChapterId(chapters, 'c4')).toBe(null)
    expect(hasNextNonEmptyChapter(chapters, 'c4')).toBe(false)
  })

  it('currentChapterId not found: returns null/false', () => {
    const chapters: Chapter[] = [
      { id: 'c1', fields: [1] },
      { id: 'c2', fields: [] },
      { id: 'c3', fields: [1] },
    ]

    expect(findNextNonEmptyChapterId(chapters, 'missing')).toBe(null)
    expect(hasNextNonEmptyChapter(chapters, 'missing')).toBe(false)
  })
})
