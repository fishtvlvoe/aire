export const shopSchema = {
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
  building_common: [
    { key: 'building_area', label: '建物面積', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'layout', label: '格局', type: 'layout', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'shop_frontage', label: '店面寬度', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'floor_count', label: '樓層（通常 1F）', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'year_built', label: '年份', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'non_natural_death', label: '凶宅/非自然死亡', type: 'select', options: ['無', '有'], required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'leak_damage', label: '漏水/滲水/海砂屋', type: 'textarea', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'chloride_radiation', label: '輻射/氯離子', type: 'textarea', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
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
  media: [
    { key: 'photos', label: '物件照片', type: 'file', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
};
