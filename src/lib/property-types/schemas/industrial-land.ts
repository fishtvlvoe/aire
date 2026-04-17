export const industrialLandSchema = {
  common: [
    { key: 'total_price', label: '委託總價', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'address', label: '物件地址', type: 'text', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'usage', label: '用途', type: 'text', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'current_status', label: '現況', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'pros_cons', label: '優缺點', type: 'textarea', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
  land_common: [
    { key: 'land_number', label: '地號', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'land_area', label: '面積', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'road_width', label: '臨路寬度', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  type_specific: [
    { key: 'zoning_detail', label: '使用分區（乙工/丙工等）', type: 'text', required: false, sourceType: 'secretary', displayMode: 'fixed' },
    { key: 'floor_area_ratio', label: '容積率', type: 'number', required: false, sourceType: 'secretary', displayMode: 'fixed' },
    { key: 'has_factory_building', label: '有無廠房', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'utilities_status', label: '水電情況', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  supplementary_specific: [
    { key: 'industrial_zone_cert', label: '工業區證明', type: 'file', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'use_license', label: '使用執照', type: 'file', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
};
