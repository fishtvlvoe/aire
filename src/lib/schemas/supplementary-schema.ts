/**
 * supplementary-schema.ts
 *
 * 補件資料欄位定義。
 * 所有欄位皆為 optional string，不影響現有必填驗證。
 *
 * 欄位分為四組：
 *  - 身份資訊 (identity)
 *  - 交易資訊 (transaction)
 *  - 建物補充 (building)
 *  - 周遭機能 (surroundings)
 */

export type SupplementaryFieldGroup = 'identity' | 'transaction' | 'building' | 'surroundings';

export type SupplementaryField = {
  key: string;
  label: string;
  type: 'text';
  required: false;
  group: SupplementaryFieldGroup;
};

/** 所有補件欄位定義 */
export const supplementaryFields: SupplementaryField[] = [
  // 身份資訊
  { key: 'company_name', label: '公司名稱', type: 'text', required: false, group: 'identity' },
  { key: 'property_name', label: '物件名稱', type: 'text', required: false, group: 'identity' },
  { key: 'case_number', label: '案件編號', type: 'text', required: false, group: 'identity' },
  { key: 'agent_name', label: '經紀人姓名', type: 'text', required: false, group: 'identity' },
  { key: 'agent_phone', label: '經紀人電話', type: 'text', required: false, group: 'identity' },

  // 交易資訊
  { key: 'sale_price_text', label: '成交價（萬元）', type: 'text', required: false, group: 'transaction' },
  { key: 'transaction_type', label: '交易類型', type: 'text', required: false, group: 'transaction' },
  { key: 'deed_fee_split', label: '契稅分擔方式', type: 'text', required: false, group: 'transaction' },
  { key: 'other_terms', label: '其他條款', type: 'text', required: false, group: 'transaction' },

  // 建物補充
  { key: 'ancillary_building_area', label: '附屬建物面積', type: 'text', required: false, group: 'building' },
  { key: 'common_area_ping', label: '公設面積（坪）', type: 'text', required: false, group: 'building' },
  { key: 'land_use_zone', label: '使用分區', type: 'text', required: false, group: 'building' },
  { key: 'announced_land_value', label: '公告土地現值', type: 'text', required: false, group: 'building' },

  // 周遭機能
  { key: 'school_distance', label: '學校距離', type: 'text', required: false, group: 'surroundings' },
  { key: 'park_distance', label: '公園距離', type: 'text', required: false, group: 'surroundings' },
  { key: 'transport_description', label: '交通說明', type: 'text', required: false, group: 'surroundings' },
  { key: 'shopping_description', label: '購物說明', type: 'text', required: false, group: 'surroundings' },
];

/** 依分組取得補件欄位 */
export function getSupplementaryFieldsByGroup(group: SupplementaryFieldGroup): SupplementaryField[] {
  return supplementaryFields.filter((f) => f.group === group);
}

/**
 * SupplementaryData 型別 — 所有欄位皆為 optional string。
 * 供 document-generator / build-input 等模組使用。
 */
export type SupplementaryData = {
  // 身份資訊
  company_name?: string;
  property_name?: string;
  case_number?: string;
  agent_name?: string;
  agent_phone?: string;

  // 交易資訊
  sale_price_text?: string;
  transaction_type?: string;
  deed_fee_split?: string;
  other_terms?: string;

  // 建物補充
  ancillary_building_area?: string;
  common_area_ping?: string;
  land_use_zone?: string;
  announced_land_value?: string;

  // 周遭機能
  school_distance?: string;
  park_distance?: string;
  transport_description?: string;
  shopping_description?: string;

  // 允許其他任意欄位（與現有 supplementary_data: Record<string, unknown> 相容）
  [key: string]: string | undefined;
};
