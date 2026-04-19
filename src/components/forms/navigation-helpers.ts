export function findNextNonEmptyChapterId(
  chapters: Array<{ id: string; fields: any[] }>,
  currentChapterId: string
): string | null {
  const nonEmpty = chapters.filter((c) => c.fields.length > 0)
  const currentIndex = nonEmpty.findIndex((c) => c.id === currentChapterId)
  if (currentIndex < 0) return null

  const next = nonEmpty[currentIndex + 1]
  return next ? next.id : null
}

export function hasNextNonEmptyChapter(
  chapters: Array<{ id: string; fields: any[] }>,
  currentChapterId: string
): boolean {
  return findNextNonEmptyChapterId(chapters, currentChapterId) !== null
}
