export const factorySchema = {
  common: [
    { key: 'total_price', label: '委託總價', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'address', label: '物件地址', type: 'text', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'usage', label: '用途', type: 'text', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'current_status', label: '現況', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'pros_cons', label: '優缺點', type: 'textarea', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
  building_common: [
    { key: 'building_area', label: '廠房面積', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'floor_height', label: '層高', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'factory_type', label: '廠房類型（鋼構/RC）', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'year_built', label: '年份', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  type_specific: [
    { key: 'power_capacity_kva', label: '用電容量（KVA）', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'water_source', label: '水源', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'entrance_width', label: '進出口寬度', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'has_crane', label: '有無吊車', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  supplementary_specific: [
    { key: 'use_license', label: '使用執照', type: 'file', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'environmental_assessment', label: '環評資料', type: 'file', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
};
