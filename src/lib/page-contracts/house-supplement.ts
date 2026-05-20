import type { FieldSurveyFieldTemplate, HousePropertySurveyType } from "@/lib/page-contracts/house-field-survey";

function textField(key: string, label: string): FieldSurveyFieldTemplate {
  return { key, label, kind: "text", source: "field_visit" };
}

function textareaField(key: string, label: string): FieldSurveyFieldTemplate {
  return { key, label, kind: "textarea", source: "field_visit" };
}

export interface HouseSupplementDraft {
  values: Record<string, string>;
}

export const HOUSE_SUPPLEMENT_COMMON_FIELDS: readonly FieldSurveyFieldTemplate[] = [
  textField("building_number", "建號"),
  textField("registered_area_ping", "權狀坪數"),
  textField("main_building_area_ping", "主建物坪數"),
  textField("auxiliary_area_ping", "附屬建物坪數"),
  textField("common_area_ping", "共有部分坪數"),
  textField("land_building_number_check", "地號 / 建號核對"),
  textField("other_rights", "他項權利"),
  textField("floor_check", "樓層 / 總樓層核對"),
  textField("legal_use_check", "法定用途核對"),
  textField("completion_date_check", "建築完成日期核對"),
  textareaField("addition_scope", "增建 / 頂加 / 外推 / 夾層範圍整理"),
  textareaField("tenant_terms", "租客 / 租期 / 押金 / 可否提前交付核對"),
  textareaField("contract_terms", "合約書條件核對"),
  textareaField("photo_naming", "照片命名整理"),
  textareaField("marketing_consistency", "591 / DM / FB / 說明書一致性檢核"),
];

const supplementTypeFieldMap: Record<HousePropertySurveyType, readonly FieldSurveyFieldTemplate[]> = {
  大樓華廈: [
    textareaField("community_management_check", "總戶數 / 公設比 / 管理費核對"),
    textareaField("parking_rights_check", "車位權屬與獨立性核對"),
    textareaField("community_facilities_check", "社區公設與集中收包裹資訊整理"),
  ],
  公寓: [
    textareaField("apartment_addition_check", "頂加 / 鐵皮 / 外推 / 違建 / 夾層範圍核對"),
    textareaField("stairwell_photo_check", "樓梯間與公共空間照片整理"),
    textareaField("shared_management_check", "共管 / 管委資料核對"),
  ],
  透天別墅: [
    textareaField("townhouse_scope_check", "騎樓、車庫、夾層、頂夾範圍核對"),
    textareaField("floor_use_photo_check", "樓層用途分配與照片整理"),
    textareaField("road_condition_check", "臨路、巷寬、角地資料核對"),
  ],
  店面: [
    textareaField("shop_size_check", "面寬 / 深度 / 臨路寬核對"),
    textareaField("shop_signage_check", "角間 / 三角窗 / 招牌條件整理"),
    textareaField("shop_lease_check", "營業中租約與配合帶看整理"),
  ],
  套房: [
    textareaField("suite_address_sublet_check", "獨立門牌與分租狀態核對"),
    textareaField("suite_meter_check", "獨立水電表核對"),
    textareaField("suite_rent_subsidy_check", "租補資格核對"),
    textareaField("suite_tenant_check", "租客資料與租約整理"),
  ],
  農舍: [
    textareaField("farmhouse_legal_check", "合法農舍與土地建物權屬核對"),
    textareaField("farm_use_check", "農用資格 / 農用限制整理"),
    textareaField("farm_utility_check", "農路、供水、供電、灌排資訊核對"),
  ],
  廠房: [
    textareaField("factory_power_check", "三相電 / 電壓 / 容量核對"),
    textareaField("factory_zoning_check", "使用分區 / 合法用途 / 工業地型別核對"),
    textareaField("factory_safety_check", "排煙 / 排水 / 排污 / 消防資料整理"),
  ],
};

export function getHouseSupplementTypeFields(
  propertyType: HousePropertySurveyType,
): readonly FieldSurveyFieldTemplate[] {
  return supplementTypeFieldMap[propertyType];
}

export function createHouseSupplementDraft(): HouseSupplementDraft {
  return { values: {} };
}
