export const farmlandSchema = {
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
    { key: 'land_shape', label: '地形', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'road_width', label: '路寬', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  type_specific: [],
  supplementary_specific: [
    { key: 'additional_documents', label: '補充文件', type: 'file', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'seller_notes', label: '賣方備註', type: 'textarea', required: false, sourceType: 'secretary', displayMode: 'blank' },
  ],
};
