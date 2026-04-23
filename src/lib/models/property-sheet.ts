export interface PropertySheetData {
  // Three-Layer Data Sources（標注來源）
  fields: PropertySheetField[];
  data_priority: 'L1_user' | 'L2_system' | 'L3_manual';
}

export interface PropertySheetField {
  key: string;
  label: string;
  value: unknown;
  display_value: string; // 格式化顯示（萬元、坪等）
  source: 'L1_user' | 'L2_system' | 'L3_manual' | 'pending';
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

function formatDisplay(key: string, value: unknown): string {
  if (isEmpty(value)) return '待補';
  if (typeof value === 'number') {
    if (key.includes('price')) return `${value} 萬元`;
    if (key.includes('registered_area')) return `${value.toFixed(2)} 坪`;
    if (key.includes('area')) return `${value} ㎡`;
  }
  return String(value);
}

// 三層資料合併函式（L1 > L2 > L3；但 L1 空值可被後層補齊）
export function mergeDataLayers(
  l1: Record<string, unknown>,
  l2: Record<string, unknown>,
  l3: Record<string, unknown>
): PropertySheetData {
  const keys = new Set([...Object.keys(l1), ...Object.keys(l2), ...Object.keys(l3)]);
  const fields: PropertySheetField[] = [];

  for (const key of [...keys].sort()) {
    const v1 = l1[key];
    const v2 = l2[key];
    const v3 = l3[key];

    let value: unknown;
    let source: PropertySheetField['source'];

    if (!isEmpty(v1)) {
      value = v1;
      source = 'L1_user';
    } else if (!isEmpty(v2)) {
      value = v2;
      source = 'L2_system';
    } else if (!isEmpty(v3)) {
      value = v3;
      source = 'L3_manual';
    } else {
      value = undefined;
      source = 'pending';
    }

    fields.push({
      key,
      label: key,
      value,
      display_value: formatDisplay(key, value),
      source,
    });
  }

  const used = new Set(fields.map((f) => f.source));
  const data_priority: PropertySheetData['data_priority'] = used.has('L1_user')
    ? 'L1_user'
    : used.has('L2_system')
      ? 'L2_system'
      : 'L3_manual';

  return { fields, data_priority };
}
