export type ListingStatus =
  | 'draft'
  | 'field-visit-complete'
  | 'ready-for-generation'
  | 'documents-ready'

export type Listing = {
  id: number
  status: ListingStatus
}

// 依目前需求：只有 documents-ready 走文件頁，其餘皆回到填寫頁
export function resolveListingHref(listing: Listing): string {
  if (listing.status === 'documents-ready') {
    return `/listings/${listing.id}/documents`
  }
  return `/listings/${listing.id}/fill`
}

export function resolveListingActionLabel(listing: Listing): string {
  if (listing.status === 'documents-ready') {
    return '查看文件'
  }
  return '進入填寫'
}

// Decision: 列表次要按鈕用純函式 resolveListingSecondaryAction
// documents-ready 列出主按鈕（查看文件）+ 次要按鈕（回去補件）；其他狀態無次要按鈕
export function resolveListingSecondaryAction(listing: Listing): { href: string; label: string } | null {
  if (listing.status === 'documents-ready') {
    return { href: `/listings/${listing.id}/fill`, label: '回去補件' }
  }
  return null
}
