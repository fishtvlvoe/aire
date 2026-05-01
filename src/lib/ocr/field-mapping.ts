/**
 * OCR parser key → 表單 field key 映射表
 *
 * parser 產出的 key（左）對應到表單 schema 的 key（右）。
 * 直接相同的 key 不需列在這裡（如 building_area → building_area）。
 *
 * 【映射規則說明】
 * - 「映射到真實 form key」：會寫入 field_visit_data，供前端表單使用
 * - 「映射到 __extracted_only__」：只存在 extracted_data，不寫入表單，供文件生成器使用
 */
export const OCR_TO_FORM_KEY: Record<string, string> = {
  // 土地
  land_number: 'land_number',
  land_area: 'land_area',
  usage_zone: 'zoning',
  usage_type: 'land_purpose',

  // 謄本解析欄位（部分僅供 extracted_data 使用，不進入表單）
  announced_land_value: '__extracted_only__',
  rights_range: '__extracted_only__',
  land_section: 'land_section',

  // 所有權（ownership_scope 由 parser 直接產出，不需映射）
  title_deed_number: 'land_register_transcript',
  registration_date: 'land_register_transcript',

  // 他項權利
  right_type: 'other_rights',
  right_holder_name: 'other_rights',
  mortgage_amount: 'other_rights',

  // 建物
  building_number: 'land_number',
  building_address: 'address',
  building_area: 'building_area',
  main_material: 'structure',
  stories: 'floor_count',
  completion_date: 'year_built',
  main_usage: 'current_purpose',

  // 建物所有權（ownership_scope 由 parser 直接產出，不需映射）
  building_title_deed_number: 'land_register_transcript',
  building_registration_date: 'land_register_transcript',

  // 建物他項權利
  building_right_type: 'other_rights',
  building_right_holder_name: 'other_rights',
  building_mortgage_amount: 'other_rights',
}

/**
 * 將 OCR parser 的 fields 轉換為表單 field key
 * 同一個 form key 被多個 OCR key 映射時，保留 confidence 最高的
 */
export function mapOcrFieldsToFormKeys<T extends { confidence: number }>(
  ocrFields: Record<string, T>,
): Record<string, T> {
  const result: Record<string, T> = {}

  for (const [ocrKey, field] of Object.entries(ocrFields)) {
    let formKey = OCR_TO_FORM_KEY[ocrKey] ?? ocrKey

    // 映射到 __extracted_only__ 表示該欄位無對應表單欄位，保留原始 OCR key
    if (formKey === '__extracted_only__') {
      formKey = ocrKey
    }

    const existing = result[formKey]

    if (!existing || field.confidence > existing.confidence) {
      result[formKey] = field
    }
  }

  return result
}
