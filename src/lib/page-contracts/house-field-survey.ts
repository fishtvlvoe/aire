export type HousePropertySurveyType =
  | "大樓華廈"
  | "公寓"
  | "透天別墅"
  | "店面"
  | "套房"
  | "農舍"
  | "廠房";

export type FieldSurveyFieldKind = "text" | "choice" | "textarea";

export interface FieldSurveyFieldTemplate {
  key: string;
  label: string;
  kind: FieldSurveyFieldKind;
  options?: string[];
  source: "field_visit";
}

export interface FieldSurveyTypeTemplate {
  propertyType: HousePropertySurveyType;
  commonFields: readonly FieldSurveyFieldTemplate[];
  parkingOptions: readonly FieldSurveyFieldTemplate[];
  typeFields: readonly FieldSurveyFieldTemplate[];
  strengthWeaknessFields: readonly FieldSurveyFieldTemplate[];
  photoFields: readonly FieldSurveyFieldTemplate[];
}

export interface HouseFieldSurveyDraft {
  propertyType: HousePropertySurveyType;
  values: Record<string, string>;
}

function textField(key: string, label: string): FieldSurveyFieldTemplate {
  return { key, label, kind: "text", source: "field_visit" };
}

function textareaField(key: string, label: string): FieldSurveyFieldTemplate {
  return { key, label, kind: "textarea", source: "field_visit" };
}

function choiceField(key: string, label: string, options: string[]): FieldSurveyFieldTemplate {
  return { key, label, kind: "choice", options, source: "field_visit" };
}

export const HOUSE_FIELD_SURVEY_COMMON_FIELDS: readonly FieldSurveyFieldTemplate[] = [
  textField("asking_price", "委託總價"),
  textField("parking_method", "車位停車方式"),
  textField("parking_number", "車位號碼"),
  textField("address", "物件地址"),
  textField("balcony_orientation", "陽台座向"),
  textField("building_orientation", "大樓座向"),
  textField("sale_floor", "銷售樓別"),
  textField("legal_use", "用途"),
  textField("current_status", "現況"),
  textField("rent", "租金"),
  textField("management_method", "管理方式"),
  textField("management_fee", "管理費"),
  textField("units_per_floor", "每層幾戶"),
  textField("elevator_count", "電梯數"),
  textField("builder", "建設公司"),
  textField("community_name", "社區大樓名稱"),
  textField("nearest_school", "最近的學校"),
  textField("nearest_park", "最近的公園"),
  textField("nearest_market", "最近的市場"),
  textField("business_district", "商圈名稱"),
];

export const HOUSE_FIELD_SURVEY_PARKING_OPTIONS: readonly FieldSurveyFieldTemplate[] = [
  choiceField("ramp_flat", "坡道平面", ["是", "否", "補充"]),
  choiceField("ramp_mechanical", "坡道機械", ["是", "否", "補充"]),
  choiceField("lift_mechanical", "升降機械", ["是", "否", "補充"]),
  choiceField("first_floor_flat", "一樓平面", ["是", "否", "補充"]),
];

export const HOUSE_FIELD_SURVEY_STRENGTH_WEAKNESS_FIELDS: readonly FieldSurveyFieldTemplate[] = [
  textareaField("strength_1", "優點1"),
  textareaField("strength_2", "優點2"),
  textareaField("strength_3", "優點3"),
  textareaField("weakness_1", "缺點1"),
  textareaField("weakness_2", "缺點2"),
  textareaField("weakness_3", "缺點3"),
];

export const HOUSE_FIELD_SURVEY_PHOTO_FIELDS: readonly FieldSurveyFieldTemplate[] = [
  textField("front_exterior_photo", "正門外觀圖"),
  textField("left_exterior_photo", "左側外觀圖"),
  textField("right_exterior_photo", "右側外觀圖"),
  textField("rear_exterior_photo", "背面外觀圖"),
  textField("living_room_photo", "客廳圖（四角往中心）"),
  textField("bedroom_photo", "房間圖（四角往中心）"),
  textField("kitchen_photo", "廚房圖"),
  textField("balcony_photo", "陽台圖"),
  textField("public_facility_photo", "公設圖"),
  textField("road_photo", "臨路圖（四角往中心）"),
  textField("community_entrance_photo", "社區出入口圖"),
];

const typeFieldMap: Record<HousePropertySurveyType, readonly FieldSurveyFieldTemplate[]> = {
  大樓華廈: [
    textField("total_units", "總戶數"),
    textField("building_units_per_floor", "每層幾戶"),
    textField("building_elevator_count", "電梯數"),
    textField("public_facility_ratio", "公設比"),
    textField("management_fee_amount", "管理費金額"),
    textField("management_unit_name", "管理單位名稱"),
    textField("parking_ownership", "車位權屬"),
    textField("package_collection", "是否有集中收包裹"),
    textField("gym", "是否有健身房"),
    textField("garbage_collection_location", "垃圾集中在哪裡"),
    textField("mixed_residential_commercial", "是否住商混合"),
    textField("water_tank", "是否有中繼水箱"),
    textField("machine_room", "是否有機房"),
    textField("maisonette", "是否有樓中樓"),
    textField("high_ceiling", "是否有挑高"),
    textareaField("special_conditions", "是否有其他特殊條件"),
  ],
  公寓: [
    textField("rooftop_addition", "是否有頂加"),
    textField("metal_roof_location", "鐵皮在哪裡"),
    textField("balcony_extension", "外推在哪裡"),
    textField("illegal_addition_location", "違建在哪裡"),
    textField("mezzanine_location", "夾層在哪裡"),
    textareaField("stairwell_usage", "樓梯間使用狀況"),
    textField("shared_management", "是否有管委或共管"),
    textField("shared_balcony", "是否共用陽台"),
    textField("independent_water_meter", "水表是否獨立"),
    textField("independent_electric_meter", "電表是否獨立"),
    textField("independent_gas_meter", "瓦斯是否獨立"),
    textareaField("roof_waterproofing", "屋頂防水狀況"),
    textareaField("soundproofing", "隔音狀況"),
    textField("whole_floor_rental", "是否整層出租"),
    textField("sublet_units", "分租幾戶"),
    textareaField("public_space_rights", "公共空間使用權與維護狀況"),
  ],
  透天別墅: [
    textField("arcade", "是否有騎樓"),
    textField("arcade_area", "騎樓面積"),
    textField("garage_width", "車庫寬度"),
    textField("garage_depth", "車庫深度"),
    textField("parking_capacity", "可停幾台車"),
    textField("side_by_side_or_front_back", "並排或前後"),
    textField("front_yard", "前院是否有"),
    textField("rear_yard", "後院是否有"),
    textField("side_yard", "側院是否有"),
    textareaField("floor_use_plan", "樓層用途分配"),
    textField("master_bedroom_floor", "主臥在哪一樓"),
    textField("living_room_floor", "客廳在哪一樓"),
    textField("shrine_room_floor", "神明廳在哪一樓"),
    textField("kitchen_floor", "廚房在哪一樓"),
    textField("elder_room", "是否有孝親房"),
    textField("mezzanine_height", "夾層高度"),
    textField("road_frontage", "臨路面寬"),
    textField("road_width", "巷寬或路寬"),
    textField("corner_lot", "是否角地"),
    textField("dual_road_frontage", "是否雙面臨路"),
    textField("dead_end_alley", "是否無尾巷"),
    textField("leakage", "是否有漏水"),
    textField("wall_cancer", "是否有壁癌"),
    textareaField("roof_waterproofing_issue", "是否有屋頂防水問題"),
  ],
  店面: [
    textField("storefront_width", "店面寬"),
    textField("store_depth", "店面深度"),
    textField("road_width", "臨路寬"),
    textField("corner_shop", "是否角間"),
    textField("front_triangle_corner", "是否正三角窗"),
    textField("reverse_triangle_corner", "是否逆三角窗"),
    textField("front_parking", "門前能否停車"),
    textField("arcade", "是否有騎樓"),
    textField("setback_space", "是否有退縮空地"),
    textField("signage_allowed", "招牌可不可以掛"),
    textField("mixed_store_residential", "是否可店住混合"),
    textField("three_phase_power", "是否有三相電"),
    textField("floor_height", "樓高"),
    textField("first_floor_height", "一樓挑高"),
    textField("mezzanine", "是否有夾層"),
    textField("mezzanine_height", "夾層高度"),
    textField("business_status", "現況：空店 / 出租中 / 營業中"),
    textField("lease_end_date", "若出租中，租約到何時"),
    textField("business_showing_time", "若營業中，營業時間與配合帶看時間"),
    textareaField("people_flow", "周遭人流特性"),
    textareaField("traffic_flow", "周遭車流特性"),
    textField("main_business_district", "主要商圈名稱"),
  ],
  套房: [
    textField("independent_address", "是否獨立門牌"),
    textField("sublet", "是否分租"),
    textField("independent_bathroom", "是否獨立衛浴"),
    textField("bathroom_type", "衛浴全套或半套"),
    textField("independent_water_meter", "是否獨立水表"),
    textField("independent_electric_meter", "是否獨立電表"),
    textField("rent_subsidy", "是否可租補"),
    textField("tenant", "是否有租客"),
    textField("lease_end_date", "租期到何時"),
    textField("short_term_rental", "是否可短租"),
    textField("long_term_rental", "是否可長租"),
    textField("student_rental", "是否可學生租"),
    textField("office_worker_rental", "是否可上班族租"),
    textField("partition_material", "隔間材質（輕隔間 / 實牆）"),
    textField("public_area_camera", "公共區是否有監視器"),
    textField("coin_laundry", "公共區是否有投幣洗衣機"),
    textField("water_dispenser", "公共區是否有飲水機"),
    textField("elevator", "是否有電梯"),
    textField("elevator_capacity_vendor", "電梯公斤數與維護單位"),
    textField("fire_escape", "消防逃生是否正常"),
  ],
  農舍: [
    textField("legal_farmhouse", "是否合法農舍"),
    textField("separate_land_building_ownership", "土地與建物權屬是否分開"),
    textField("farming_qualification", "是否有農用資格"),
    textField("farming_restriction", "是否有農用限制"),
    textField("irrigation", "灌溉是否正常"),
    textField("drainage", "排水是否正常"),
    textField("water_supply", "供水是否正常"),
    textField("power_supply", "供電是否正常"),
    textField("taipower", "是否台電"),
    textField("temporary_power", "是否臨時電"),
    textField("road_type", "是否為產業道路 / 計畫道路 / 繼承道路"),
    textField("farm_road_width", "農路幾米"),
    textField("first_floor_area", "農舍一樓面積"),
    textField("surrounding_use", "周邊使用狀況：林地 / 農耕 / 其他"),
    textField("crops", "是否有農作物"),
    textField("fruit_trees", "是否有果樹"),
    textField("greenhouse", "是否有溫室"),
    textField("residential_use", "是否作住家"),
    textField("leisure_use", "是否作休閒"),
    textField("studio_use", "是否作工作室"),
    textareaField("use_legality_notes", "使用型態合法性補充"),
  ],
  廠房: [
    textField("three_phase_power", "三相電"),
    textField("voltage", "電壓"),
    textField("power_capacity", "電力容量"),
    textField("ceiling_height", "挑高"),
    textField("beam_clear_height", "樑下高度"),
    textField("crane", "天車"),
    textField("truck_access", "貨車可否進出"),
    textField("trailer_access", "聯結車可否進出"),
    textField("road_width", "臨路幾米"),
    textField("door_width", "門寬"),
    textField("door_height", "門高"),
    textField("turning_lane", "是否有回車道"),
    textField("turning_area", "是否有回車區"),
    textField("loading_platform", "卸貨平台"),
    textField("dock", "碼頭"),
    textField("turning_space", "回車空間"),
    textField("floor_load", "地坪承重"),
    textField("fire_equipment", "是否有消防設備"),
    textField("smoke_exhaust", "排煙"),
    textField("drainage", "排水"),
    textField("sewage", "排污"),
    textField("zoning", "使用分區"),
    textField("legal_use", "合法用途"),
    textField("industrial_land_type", "甲 / 乙 / 丙種工業地"),
    textField("sublease", "是否可分租"),
    textField("immediate_use", "是否可立即使用"),
    textField("ready_time", "若不可立即使用，最短多久可用"),
    textField("equipment_leftover", "是否有雜物機具"),
    textField("noise", "是否有噪音"),
    textField("environmental_restriction", "是否有環評限制"),
    textField("neighbor_damage_restriction", "是否有鄰損限制"),
  ],
};

export const HOUSE_FIELD_SURVEY_TEMPLATES: Record<HousePropertySurveyType, FieldSurveyTypeTemplate> =
  Object.fromEntries(
    (Object.keys(typeFieldMap) as HousePropertySurveyType[]).map((propertyType) => [
      propertyType,
      {
        propertyType,
        commonFields: HOUSE_FIELD_SURVEY_COMMON_FIELDS,
        parkingOptions: HOUSE_FIELD_SURVEY_PARKING_OPTIONS,
        typeFields: typeFieldMap[propertyType],
        strengthWeaknessFields: HOUSE_FIELD_SURVEY_STRENGTH_WEAKNESS_FIELDS,
        photoFields: HOUSE_FIELD_SURVEY_PHOTO_FIELDS,
      },
    ]),
  ) as Record<HousePropertySurveyType, FieldSurveyTypeTemplate>;

export function getHouseFieldSurveyTemplate(propertyType: HousePropertySurveyType): FieldSurveyTypeTemplate {
  return HOUSE_FIELD_SURVEY_TEMPLATES[propertyType];
}

export function createHouseFieldSurveyDraft(
  propertyType: HousePropertySurveyType = "大樓華廈",
): HouseFieldSurveyDraft {
  return {
    propertyType,
    values: {},
  };
}
