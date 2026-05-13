export const ruralLandSchema = {
  common: [
    { key: 'total_price', label: '委託總價', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'address', label: '物件地址', type: 'text', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'usage', label: '用途', type: 'text', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'current_status', label: '現況', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'pros_cons', label: '優缺點', type: 'textarea', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'ownership_scope', label: '持分/單獨所有', type: 'select', options: ['單獨所有', '持分共有'], required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'other_rights', label: '他項權利登記', type: 'textarea', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'restriction_records', label: '限制登記事項', type: 'textarea', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'public_acquisition', label: '公共徵收/重劃', type: 'select', options: ['無', '有'], required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'nearby_facilities', label: '嫌惡設施與重要設施', type: 'textarea', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  land_common: [
    { key: 'land_number', label: '地號', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'land_area', label: '面積', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'land_shape', label: '地形', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'road_width', label: '臨路寬度', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'zoning', label: '使用分區', type: 'text', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'building_coverage_ratio', label: '建蔽率', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'floor_area_ratio', label: '容積率', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  type_specific: [
    { key: 'zoning_detail', label: '使用分區（鄉村區）', type: 'text', required: false, sourceType: 'secretary', displayMode: 'fixed' },
    { key: 'utilities_connection', label: '水電接管情況', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  supplementary_specific: [
    { key: 'agricultural_use_status', label: '農地農用或非農用', type: 'text', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'land_register_transcript', label: '地籍謄本', type: 'file', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
  media: [
    { key: 'photos', label: '物件照片', type: 'file', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
};
