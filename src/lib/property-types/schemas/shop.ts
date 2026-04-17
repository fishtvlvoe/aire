export const shopSchema = {
  common: [
    { key: 'total_price', label: '委託總價', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'address', label: '物件地址', type: 'text', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'usage', label: '用途', type: 'text', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'current_status', label: '現況', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'pros_cons', label: '優缺點', type: 'textarea', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
  building_common: [
    { key: 'building_area', label: '建物面積', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'shop_frontage', label: '店面寬度', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'floor_count', label: '樓層（通常 1F）', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'year_built', label: '年份', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  type_specific: [
    { key: 'rental_market_price', label: '月租金行情', type: 'number', required: false, sourceType: 'secretary', displayMode: 'estimate' },
    { key: 'arcade_area', label: '騎樓面積', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'parking_space', label: '停車位', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'current_use', label: '使用現況（自用/出租）', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  supplementary_specific: [
    { key: 'signage_cost', label: '招牌費用', type: 'number', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'renovation_status', label: '裝潢現況', type: 'textarea', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
};
