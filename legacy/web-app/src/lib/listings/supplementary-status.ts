export type SupplementaryStatus = 'not-started' | 'missing' | 'complete';

/**
 * 三態計算：根據物件狀態和補件資料判斷補件完成度。
 * - not-started: 物件仍在 draft，尚未進入補件階段
 * - missing: 物件已進入進行中以上，補件資料為空
 * - complete: 補件資料已有填寫內容
 */
export function getSupplementaryStatus(
  listingStatus: string,
  supplementaryData: string | null | undefined,
): SupplementaryStatus {
  if (listingStatus === 'draft') return 'not-started';

  if (!supplementaryData) return 'missing';

  try {
    const data = JSON.parse(supplementaryData) as Record<string, unknown>;
    const hasValues = Object.values(data).some(
      v => v !== null && v !== undefined && v !== '',
    );
    return hasValues ? 'complete' : 'missing';
  } catch {
    return 'missing';
  }
}
