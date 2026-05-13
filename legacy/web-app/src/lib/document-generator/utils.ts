/** 從 supplementary_data 取值，缺值時回傳「待補」佔位 */
export function getSupValue(data: Record<string, unknown>, key: string): string {
  const val = data[key]
  return val !== null && val !== undefined && String(val).trim() !== ''
    ? String(val)
    : '**【待補】**'
}
