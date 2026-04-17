export const townhouseSchema = {
  common: [
    { key: 'total_price', label: '委託總價', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'address', label: '物件地址', type: 'text', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'usage', label: '用途', type: 'text', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'current_status', label: '現況', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'pros_cons', label: '優缺點', type: 'textarea', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
  building_common: [
    { key: 'building_area', label: '建物面積', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'floor_count', label: '層數', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'year_built', label: '年份', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'structure', label: '結構', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  type_specific: [],
  supplementary_specific: [
    { key: 'parking_spaces', label: '停車位數', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'renovation_notes', label: '裝潢備註', type: 'textarea', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
};
