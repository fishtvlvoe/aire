export const highriseSchema = {
  common: [
    { key: 'total_price', label: '委託總價', type: 'number', required: true },
    { key: 'address', label: '物件地址', type: 'text', required: true },
    { key: 'usage', label: '用途', type: 'text', required: false },
    { key: 'current_status', label: '現況', type: 'text', required: false },
    { key: 'pros_cons', label: '優缺點', type: 'textarea', required: false },
  ],
  building_common: [
    { key: 'building_area', label: '建物面積', type: 'number', required: true },
    { key: 'floor_count', label: '層數', type: 'number', required: false },
    { key: 'year_built', label: '年份', type: 'number', required: false },
    { key: 'structure', label: '結構', type: 'text', required: false },
  ],
  type_specific: [],
  supplementary_specific: [
    { key: 'security_system', label: '保全系統', type: 'text', required: false },
    { key: 'amenities', label: '公設說明', type: 'textarea', required: false },
  ],
};
