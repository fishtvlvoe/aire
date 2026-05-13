export const farmhouseSchema = {
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
    { key: 'floor_count', label: '層數', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'year_built', label: '年份', type: 'number', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'structure', label: '結構', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'non_natural_death', label: '凶宅/非自然死亡', type: 'select', options: ['無', '有'], required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'leak_damage', label: '漏水/滲水/海砂屋', type: 'textarea', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'chloride_radiation', label: '輻射/氯離子', type: 'textarea', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  land_common: [
    { key: 'zoning', label: '使用分區', type: 'text', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'building_coverage_ratio', label: '建蔽率', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
    { key: 'floor_area_ratio', label: '容積率', type: 'number', required: true, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  type_specific: [],
  supplementary_specific: [
    { key: 'farm_details', label: '農場詳細說明', type: 'textarea', required: false, sourceType: 'secretary', displayMode: 'blank' },
    { key: 'irrigation_status', label: '灌溉設施', type: 'text', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
  media: [
    { key: 'photos', label: '物件照片', type: 'file', required: false, sourceType: 'field-visit', displayMode: 'fixed' },
  ],
};
