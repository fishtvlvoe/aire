import type { PropertyTypeId } from "@/lib/property-type-registry";
import { getCoverageDecision } from "@/lib/moi-service-catalog";

export type FieldSourceKind =
  | "registry_api"
  | "gis_layer"
  | "public_data"
  | "field_visit"
  | "manual_document"
  | "derived"
  | "unsupported";

export type AutomationState =
  | "filled_from_registry"
  | "mapping_gap"
  | "integration_gap"
  | "manual_required"
  | "not_supported";

export type FieldGapDetail =
  | "filled"
  | "unmapped"
  | "missing_client"
  | "manual_confirmation"
  | "unsupported_source"
  | "empty_success";

export interface DisclosureFieldSourceMatrixRow {
  fieldKey: string;
  documentArea: string;
  propertyTypes: PropertyTypeId[];
  sourceKind: FieldSourceKind;
  automationState: AutomationState;
  serviceCodes: string[];
  requiredForCompletion: boolean;
  reviewNote: string;
  sourcePayloadPaths?: string[];
}

export interface FieldGapContext {
  fieldKey: string;
  propertyType: PropertyTypeId;
  value?: unknown;
  lookupStatus?: "success" | "empty_success" | "failure" | "not_run";
  sourcePayloadPath?: string;
  mappedSourceField?: string;
}

export interface FieldGapResolution {
  fieldKey: string;
  automationState: AutomationState;
  gapDetail: FieldGapDetail;
  reason: string;
  serviceCodes: string[];
}

const IMPLEMENTED_SERVICE_CODES = new Set([
  "MOI_API_001",
  "MOI_API_002",
  "MOI_API_003",
  "MOI_API_004",
  "MOI_API_005",
  "MOI_API_006",
  "MOI_API_007",
  "MOI_API_009",
  "MOI_API_013",
  "MOI_API_014",
  "MOI_API_015",
  "MOI_API_016",
  "MOI_API_017",
  "MOI_API_023",
  "MOI_API_026",
  "MOI_API_028",
  "MOI_API_036",
  "MOI_API_041",
  "MOI_API_043",
]);

export const DISCLOSURE_FIELD_SOURCE_MATRIX: DisclosureFieldSourceMatrixRow[] = [
  {
    fieldKey: "land_lot_no",
    documentArea: "land.identification",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land", "farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_001", "MOI_API_015"],
    requiredForCompletion: true,
    reviewNote: "土地地號由地籍土地標示部或建號反查結果帶入。",
    sourcePayloadPaths: ["land_registry.NO", "building_registry.LANDNO"],
  },
  {
    fieldKey: "building_lot_no",
    documentArea: "building.identification",
    propertyTypes: ["farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_004", "MOI_API_026"],
    requiredForCompletion: true,
    reviewNote: "建號由建物標示部或門牌查建號結果帶入。",
    sourcePayloadPaths: ["building_registry.NO", "address_to_parcel.building_number"],
  },
  {
    fieldKey: "land_area",
    documentArea: "land.identification",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land", "farmhouse", "townhouse"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_001"],
    requiredForCompletion: true,
    reviewNote: "地籍土地標示部可直接帶入土地面積。",
    sourcePayloadPaths: ["land_registry.AREA", "land_registry.area"],
  },
  {
    fieldKey: "zoning_use",
    documentArea: "land.identification",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land"],
    sourceKind: "gis_layer",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_014", "MOI_WMS_005"],
    requiredForCompletion: false,
    reviewNote: "使用分區可由 GIS 與公告現值補強。",
  },
  {
    fieldKey: "urban_district",
    documentArea: "land.identification",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land"],
    sourceKind: "public_data",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_013"],
    requiredForCompletion: false,
    reviewNote: "都市計畫或行政區資料可由公開資料補齊。",
  },
  {
    fieldKey: "land_category",
    documentArea: "land.identification",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land"],
    sourceKind: "registry_api",
    automationState: "integration_gap",
    serviceCodes: ["MOI_API_018"],
    requiredForCompletion: false,
    reviewNote: "地類別屬地政註記服務，但本地尚未串接對應 client。",
  },
  {
    fieldKey: "ownership_type",
    documentArea: "rights",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land", "farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_002", "MOI_API_005"],
    requiredForCompletion: true,
    reviewNote: "所有權型態可由土地或建物所有權部帶入。",
  },
  {
    fieldKey: "mortgage_status",
    documentArea: "rights",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land", "farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_003", "MOI_API_006"],
    requiredForCompletion: true,
    reviewNote: "他項權利部可顯示抵押與擔保狀態。",
  },
  {
    fieldKey: "other_rights",
    documentArea: "rights",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land", "farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_003", "MOI_API_006"],
    requiredForCompletion: false,
    reviewNote: "其他權利事項可由他項權利部帶入。",
  },
  {
    fieldKey: "tax_land_value",
    documentArea: "tax",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land", "farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_014"],
    requiredForCompletion: true,
    reviewNote: "公告地價與公告現值是稅費與成本計算的核心。",
  },
  {
    fieldKey: "tax_announced_present_value",
    documentArea: "tax",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_014"],
    requiredForCompletion: false,
    reviewNote: "公告現值可由地價服務帶入。",
  },
  {
    fieldKey: "tax_building_value",
    documentArea: "tax",
    propertyTypes: ["farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_026"],
    requiredForCompletion: false,
    reviewNote: "建物評定現值需對應建物標示及權利範圍資料。",
  },
  {
    fieldKey: "tax_property_tax_annual",
    documentArea: "tax",
    propertyTypes: ["farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "derived",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_026", "MOI_API_014"],
    requiredForCompletion: false,
    reviewNote: "房屋稅屬衍生計算欄位，可從價值與稅率推導。",
  },
  {
    fieldKey: "tax_land_value_tax_annual",
    documentArea: "tax",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land", "farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "derived",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_014", "MOI_API_016"],
    requiredForCompletion: false,
    reviewNote: "地價稅為公告現值與稅率的衍生結果。",
  },
  {
    fieldKey: "floor_area",
    documentArea: "building.identification",
    propertyTypes: ["farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_004", "MOI_API_026"],
    requiredForCompletion: true,
    reviewNote: "建物面積可由建物標示部帶入。",
    sourcePayloadPaths: ["building_registry.AREA", "building_registry.area", "building_ownership.AREA"],
  },
  {
    fieldKey: "building_age",
    documentArea: "building.identification",
    propertyTypes: ["farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "derived",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_004", "MOI_API_026"],
    requiredForCompletion: false,
    reviewNote: "屋齡由建築完成日推導。",
  },
  {
    fieldKey: "building_structure",
    documentArea: "building.identification",
    propertyTypes: ["farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_004", "MOI_API_026"],
    requiredForCompletion: false,
    reviewNote: "建物結構屬建物標示部欄位。",
  },
  {
    fieldKey: "floor_total",
    documentArea: "building.identification",
    propertyTypes: ["farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_004", "MOI_API_026"],
    requiredForCompletion: false,
    reviewNote: "總樓層可由建物標示部或地籍建物資料帶入。",
  },
  {
    fieldKey: "floor_this",
    documentArea: "building.identification",
    propertyTypes: ["farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "registry_api",
    automationState: "filled_from_registry",
    serviceCodes: ["MOI_API_004", "MOI_API_026"],
    requiredForCompletion: false,
    reviewNote: "本戶樓層通常可由門牌與建物標示對應。",
  },
  {
    fieldKey: "owner_name",
    documentArea: "rights",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land", "farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "manual_document",
    automationState: "manual_required",
    serviceCodes: ["MOI_API_009"],
    requiredForCompletion: true,
    reviewNote: "私人屋主姓名只能由屋主提供、正式文件、OCR 或人工輸入。",
  },
  {
    fieldKey: "owner_id",
    documentArea: "rights",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land", "farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "manual_document",
    automationState: "manual_required",
    serviceCodes: ["MOI_API_009"],
    requiredForCompletion: true,
    reviewNote: "個人統一編號不做反查，只能由文件或人工提供。",
  },
  {
    fieldKey: "owner_birth_date",
    documentArea: "rights",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land", "farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "manual_document",
    automationState: "manual_required",
    serviceCodes: ["MOI_API_009"],
    requiredForCompletion: false,
    reviewNote: "出生日期屬個資，不可從地政反查。",
  },
  {
    fieldKey: "owner_address",
    documentArea: "rights",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land", "farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "manual_document",
    automationState: "manual_required",
    serviceCodes: ["MOI_API_009"],
    requiredForCompletion: false,
    reviewNote: "屋主地址屬個資，不可做反查來源。",
  },
  {
    fieldKey: "condition_access",
    documentArea: "land.condition",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land"],
    sourceKind: "field_visit",
    automationState: "manual_required",
    serviceCodes: [],
    requiredForCompletion: false,
    reviewNote: "通行情形必須由現場確認。",
  },
  {
    fieldKey: "condition_boundary_clear",
    documentArea: "land.condition",
    propertyTypes: ["farmland", "residential-land", "industrial-land", "commercial-land", "village-land", "other-land"],
    sourceKind: "field_visit",
    automationState: "manual_required",
    serviceCodes: [],
    requiredForCompletion: false,
    reviewNote: "界址是否清楚必須由現場確認。",
  },
  {
    fieldKey: "condition_leakage",
    documentArea: "building.condition",
    propertyTypes: ["farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "field_visit",
    automationState: "manual_required",
    serviceCodes: [],
    requiredForCompletion: false,
    reviewNote: "漏水、壁癌等現況必須現場確認。",
  },
  {
    fieldKey: "condition_illegal_addition",
    documentArea: "building.condition",
    propertyTypes: ["farmhouse", "townhouse", "apartment", "highrise", "studio", "storefront", "factory"],
    sourceKind: "field_visit",
    automationState: "manual_required",
    serviceCodes: [],
    requiredForCompletion: false,
    reviewNote: "違章增建屬現場必問。",
  },
  {
    fieldKey: "garage_present",
    documentArea: "building.condition",
    propertyTypes: ["farmhouse", "townhouse"],
    sourceKind: "field_visit",
    automationState: "manual_required",
    serviceCodes: [],
    requiredForCompletion: false,
    reviewNote: "車庫型態只能靠現場與屋主確認。",
  },
  {
    fieldKey: "farm_road_condition",
    documentArea: "building.condition",
    propertyTypes: ["farmhouse"],
    sourceKind: "field_visit",
    automationState: "manual_required",
    serviceCodes: [],
    requiredForCompletion: false,
    reviewNote: "農路狀況無法由地政謄本直接確認。",
  },
  {
    fieldKey: "road_width",
    documentArea: "land.condition",
    propertyTypes: ["farmhouse", "townhouse", "apartment", "highrise", "storefront", "factory"],
    sourceKind: "field_visit",
    automationState: "manual_required",
    serviceCodes: [],
    requiredForCompletion: false,
    reviewNote: "道路寬度屬現況判斷，不是謄本可直接確認項目。",
  },
];

export function listDisclosureFieldSourceMatrix(): DisclosureFieldSourceMatrixRow[] {
  return DISCLOSURE_FIELD_SOURCE_MATRIX.slice();
}

export function getDisclosureFieldSourceRow(
  fieldKey: string,
  propertyType?: PropertyTypeId,
): DisclosureFieldSourceMatrixRow | undefined {
  return DISCLOSURE_FIELD_SOURCE_MATRIX.find((row) => {
    if (row.fieldKey !== fieldKey) return false;
    return propertyType ? row.propertyTypes.includes(propertyType) : true;
  });
}

export function getFieldGapResolution(
  context: FieldGapContext,
): FieldGapResolution {
  const row = getDisclosureFieldSourceRow(context.fieldKey, context.propertyType);
  if (!row) {
    return {
      fieldKey: context.fieldKey,
      automationState: "not_supported",
      gapDetail: "unsupported_source",
      reason: "field is not supported by the current disclosure matrix",
      serviceCodes: [],
    };
  }

  if (context.value !== undefined && context.value !== null && `${context.value}`.trim() !== "") {
    return {
      fieldKey: context.fieldKey,
      automationState: "filled_from_registry",
      gapDetail: "filled",
      reason: "field already has a value",
      serviceCodes: row.serviceCodes,
    };
  }

  if (row.sourceKind === "manual_document" || row.sourceKind === "field_visit") {
    return {
      fieldKey: context.fieldKey,
      automationState: "manual_required",
      gapDetail: "manual_confirmation",
      reason: row.reviewNote,
      serviceCodes: row.serviceCodes,
    };
  }

  if (row.sourceKind === "unsupported") {
    return {
      fieldKey: context.fieldKey,
      automationState: "not_supported",
      gapDetail: "unsupported_source",
      reason: row.reviewNote,
      serviceCodes: row.serviceCodes,
    };
  }

  const coverage = getCoverageDecision(row.serviceCodes);
  if (coverage.status === "missing") {
    return {
      fieldKey: context.fieldKey,
      automationState: "integration_gap",
      gapDetail: "missing_client",
      reason: `missing local client for ${row.serviceCodes.join(", ")}`,
      serviceCodes: row.serviceCodes,
    };
  }

  if (context.lookupStatus === "empty_success") {
    return {
      fieldKey: context.fieldKey,
      automationState: "mapping_gap",
      gapDetail: "empty_success",
      reason: `successful lookup returned no data for ${context.fieldKey}`,
      serviceCodes: row.serviceCodes,
    };
  }

  if (!context.mappedSourceField) {
    return {
      fieldKey: context.fieldKey,
      automationState: "mapping_gap",
      gapDetail: "unmapped",
      reason: `registry payload exists but ${context.fieldKey} is not mapped`,
      serviceCodes: row.serviceCodes,
    };
  }

  if (row.sourceKind === "registry_api" && row.serviceCodes.some((code) => !IMPLEMENTED_SERVICE_CODES.has(code))) {
    return {
      fieldKey: context.fieldKey,
      automationState: "integration_gap",
      gapDetail: "missing_client",
      reason: `missing local client for ${row.serviceCodes.find((code) => !IMPLEMENTED_SERVICE_CODES.has(code))}`,
      serviceCodes: row.serviceCodes,
    };
  }

  return {
    fieldKey: context.fieldKey,
    automationState: row.automationState,
    gapDetail: "unmapped",
    reason: row.reviewNote,
    serviceCodes: row.serviceCodes,
  };
}

export function getFieldCoverageReport(propertyType: PropertyTypeId): Array<
  DisclosureFieldSourceMatrixRow & { coverageDecision: ReturnType<typeof getCoverageDecision>["status"] }
> {
  return DISCLOSURE_FIELD_SOURCE_MATRIX.filter((row) => row.propertyTypes.includes(propertyType)).map(
    (row) => ({
      ...row,
      coverageDecision: getCoverageDecision(row.serviceCodes).status,
    }),
  );
}
