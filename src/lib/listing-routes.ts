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
