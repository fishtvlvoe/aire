export const suiteSchema = {
  common: [
    { key: 'total_price', label: '委託總價', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'address', label: '物件地址', type: 'text', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'usage', label: '用途', type: 'text', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'current_status', label: '現況', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'pros_cons', label: '優缺點', type: 'textarea', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
  building_common: [
    { key: 'building_area', label: '建物面積', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'layout', label: '格局（幾房幾廳）', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'floor_count', label: '樓層', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'year_built', label: '年份', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'structure', label: '結構', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  type_specific: [
    { key: 'bathroom_count', label: '衛浴數量', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'has_balcony', label: '有無陽台', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'rental_market_price', label: '租金行情', type: 'number', required: false, sourceType: 'secretary', displayMode: 'estimate' },
    { key: 'has_tenant', label: '有無租客', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  supplementary_specific: [
    { key: 'management_fee', label: '管理費', type: 'number', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'utility_notes', label: '水電費備註', type: 'textarea', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
};
