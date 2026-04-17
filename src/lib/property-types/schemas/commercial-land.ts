export const commercialLandSchema = {
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
    { key: 'land_shape', label: '地形', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  type_specific: [
    { key: 'zoning_detail', label: '使用分區（商業區細分）', type: 'text', required: false, sourceType: 'secretary', displayMode: 'fixed' },
    { key: 'floor_area_ratio', label: '容積率', type: 'number', required: false, sourceType: 'secretary', displayMode: 'fixed' },
    { key: 'building_coverage_ratio', label: '建蔽率', type: 'number', required: false, sourceType: 'secretary', displayMode: 'fixed' },
    { key: 'current_purpose', label: '目前用途', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  supplementary_specific: [
    { key: 'urban_plan_document', label: '都市計畫資料', type: 'file', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'cadastral_map', label: '地籍圖', type: 'file', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
};
