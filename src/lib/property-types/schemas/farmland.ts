export const farmlandSchema = {
  common: [
    { key: 'total_price', label: '委託總價', type: 'number', required: true },
    { key: 'address', label: '物件地址', type: 'text', required: true },
    { key: 'usage', label: '用途', type: 'text', required: false },
    { key: 'current_status', label: '現況', type: 'text', required: false },
    { key: 'pros_cons', label: '優缺點', type: 'textarea', required: false },
  ],
  land_common: [
    { key: 'land_number', label: '地號', type: 'text', required: false },
    { key: 'land_area', label: '面積', type: 'number', required: true },
    { key: 'land_shape', label: '地形', type: 'text', required: false },
    { key: 'road_width', label: '路寬', type: 'number', required: false },
  ],
  type_specific: [],
};
