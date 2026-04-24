/**
 * 表單欄位顯示單位對照表（label 後綴 + placeholder 提示）。
 *
 * 加在 label 後（「委託總價（萬元）」）讓業務輸入時一眼知道單位，
 * 避免「585」到底是 585 萬還是 5,850,000 元的歧義。
 *
 * 若 schema 未來加 `unit?: string` 欄位，此 mapping 可逐步遷移過去；目前用 key-based 統一管理最簡單。
 */
const FIELD_UNIT_MAP: Record<string, string> = {
  total_price: '萬元',
  building_area: '坪',
  area_ping: '坪',
  land_area: '坪',
  registered_area: '坪',
  total_area: '坪',
  floor_count: '樓',
  total_floors: '樓',
  floor: '樓',
  year_built: '年',
  building_age: '年',
  management_fee: '元/月',
  parking_fee: '元/月',
};

/** 取得欄位顯示單位（無對應回 null） */
export function getFieldUnit(key: string): string | null {
  return FIELD_UNIT_MAP[key] ?? null;
}

/** 組裝含單位的 label：「委託總價（萬元）」 */
export function formatLabelWithUnit(label: string, key: string): string {
  const unit = getFieldUnit(key);
  return unit ? `${label}（${unit}）` : label;
}
