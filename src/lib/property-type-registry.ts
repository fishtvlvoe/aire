export type PropertyTypeId =
  | "farmland"
  | "townhouse"
  | "apartment"
  | "highrise"
  | "residential-land"
  | "farmhouse"
  | "studio"
  | "storefront"
  | "factory"
  | "industrial-land"
  | "commercial-land"
  | "village-land"
  | "other-land";

export type PropertyCategory = "land" | "building";

export interface PropertyTypeDefinition {
  id: PropertyTypeId;
  displayName: string;
  category: PropertyCategory;
  fieldSchemaRef: string;
  registryCoverageProfileRef: string;
}

export interface PropertyTypeCoverageProfile {
  id: string;
  propertyType: PropertyTypeId;
  registryBackedFields: string[];
  manualOnlyFields: string[];
  phasedImplementationPriority: 1 | 2 | 3 | 4;
  note: string;
}

export const PROPERTY_TYPE_REGISTRY: PropertyTypeDefinition[] = [
  {
    id: "farmland",
    displayName: "農地",
    category: "land",
    fieldSchemaRef: "landSchema",
    registryCoverageProfileRef: "coverage-farmland",
  },
  {
    id: "townhouse",
    displayName: "透天別墅",
    category: "building",
    fieldSchemaRef: "residentialSchema",
    registryCoverageProfileRef: "coverage-townhouse",
  },
  {
    id: "apartment",
    displayName: "公寓",
    category: "building",
    fieldSchemaRef: "residentialSchema",
    registryCoverageProfileRef: "coverage-apartment",
  },
  {
    id: "highrise",
    displayName: "大樓華廈",
    category: "building",
    fieldSchemaRef: "residentialSchema",
    registryCoverageProfileRef: "coverage-highrise",
  },
  {
    id: "residential-land",
    displayName: "建地/住宅地",
    category: "land",
    fieldSchemaRef: "landSchema",
    registryCoverageProfileRef: "coverage-residential-land",
  },
  {
    id: "farmhouse",
    displayName: "農舍",
    category: "building",
    fieldSchemaRef: "residentialSchema",
    registryCoverageProfileRef: "coverage-farmhouse",
  },
  {
    id: "studio",
    displayName: "套房",
    category: "building",
    fieldSchemaRef: "residentialSchema",
    registryCoverageProfileRef: "coverage-studio",
  },
  {
    id: "storefront",
    displayName: "店面",
    category: "building",
    fieldSchemaRef: "residentialSchema",
    registryCoverageProfileRef: "coverage-storefront",
  },
  {
    id: "factory",
    displayName: "廠房",
    category: "building",
    fieldSchemaRef: "residentialSchema",
    registryCoverageProfileRef: "coverage-factory",
  },
  {
    id: "industrial-land",
    displayName: "工業地",
    category: "land",
    fieldSchemaRef: "landSchema",
    registryCoverageProfileRef: "coverage-industrial-land",
  },
  {
    id: "commercial-land",
    displayName: "商業地",
    category: "land",
    fieldSchemaRef: "landSchema",
    registryCoverageProfileRef: "coverage-commercial-land",
  },
  {
    id: "village-land",
    displayName: "鄉村區建地",
    category: "land",
    fieldSchemaRef: "landSchema",
    registryCoverageProfileRef: "coverage-village-land",
  },
  {
    id: "other-land",
    displayName: "其他土地",
    category: "land",
    fieldSchemaRef: "landSchema",
    registryCoverageProfileRef: "coverage-other-land",
  },
];

export const PROPERTY_TYPE_COVERAGE_PROFILES: Record<PropertyTypeId, PropertyTypeCoverageProfile> = {
  farmland: {
    id: "coverage-farmland",
    propertyType: "farmland",
    registryBackedFields: [
      "land_lot_no",
      "land_area",
      "zoning_use",
      "urban_district",
      "land_category",
      "tax_land_value",
      "tax_announced_present_value",
    ],
    manualOnlyFields: [
      "condition_access",
      "condition_boundary_clear",
      "condition_tenant_present",
      "condition_defects_notes",
    ],
    phasedImplementationPriority: 1,
    note: "農地先以地號、面積、分區與公告現值為核心。",
  },
  townhouse: {
    id: "coverage-townhouse",
    propertyType: "townhouse",
    registryBackedFields: [
      "building_lot_no",
      "land_lot_no",
      "floor_area",
      "building_age",
      "building_structure",
      "floor_total",
      "floor_this",
      "ownership_type",
      "mortgage_status",
      "other_rights",
    ],
    manualOnlyFields: [
      "condition_leakage",
      "condition_renovation",
      "condition_illegal_addition",
      "condition_defects_notes",
    ],
    phasedImplementationPriority: 1,
    note: "透天別墅要優先補齊建號、地號、樓層與權利資訊，車庫與現場狀況仍需人工確認。",
  },
  apartment: {
    id: "coverage-apartment",
    propertyType: "apartment",
    registryBackedFields: [
      "building_lot_no",
      "land_lot_no",
      "floor_area",
      "building_age",
      "building_structure",
      "floor_total",
      "floor_this",
    ],
    manualOnlyFields: [
      "condition_leakage",
      "condition_renovation",
      "condition_illegal_addition",
    ],
    phasedImplementationPriority: 2,
    note: "公寓以樓層、面積與權利部為主，現況資料仍需現場補件。",
  },
  highrise: {
    id: "coverage-highrise",
    propertyType: "highrise",
    registryBackedFields: [
      "building_lot_no",
      "land_lot_no",
      "floor_area",
      "building_age",
      "building_structure",
      "floor_total",
      "floor_this",
      "ownership_type",
    ],
    manualOnlyFields: ["condition_defects_notes"],
    phasedImplementationPriority: 1,
    note: "大樓華廈以建物標示與權利部為主，適合先做完整自動化。",
  },
  "residential-land": {
    id: "coverage-residential-land",
    propertyType: "residential-land",
    registryBackedFields: [
      "land_lot_no",
      "land_area",
      "zoning_use",
      "urban_district",
      "tax_land_value",
      "tax_announced_present_value",
    ],
    manualOnlyFields: ["condition_defects_notes"],
    phasedImplementationPriority: 1,
    note: "住宅地可直接以地號、面積、公告現值與使用分區帶入。",
  },
  farmhouse: {
    id: "coverage-farmhouse",
    propertyType: "farmhouse",
    registryBackedFields: [
      "building_lot_no",
      "land_lot_no",
      "floor_area",
      "building_age",
      "building_structure",
      "ownership_type",
      "mortgage_status",
    ],
    manualOnlyFields: [
      "condition_leakage",
      "condition_renovation",
      "condition_illegal_addition",
      "condition_defects_notes",
      "farm_road_condition",
      "garage_present",
    ],
    phasedImplementationPriority: 1,
    note: "農舍除謄本外，農路與現場條件仍屬必問。",
  },
  studio: {
    id: "coverage-studio",
    propertyType: "studio",
    registryBackedFields: [
      "building_lot_no",
      "land_lot_no",
      "floor_area",
      "floor_total",
      "floor_this",
      "ownership_type",
    ],
    manualOnlyFields: ["condition_defects_notes"],
    phasedImplementationPriority: 3,
    note: "套房以權利部與樓層資訊為主，屬中後段擴充類型。",
  },
  storefront: {
    id: "coverage-storefront",
    propertyType: "storefront",
    registryBackedFields: [
      "building_lot_no",
      "land_lot_no",
      "floor_area",
      "building_structure",
      "floor_total",
      "floor_this",
      "ownership_type",
    ],
    manualOnlyFields: ["condition_defects_notes", "garage_present"],
    phasedImplementationPriority: 2,
    note: "店面除基礎謄本外，也會受現場出入口與車位型態影響。",
  },
  factory: {
    id: "coverage-factory",
    propertyType: "factory",
    registryBackedFields: [
      "building_lot_no",
      "land_lot_no",
      "floor_area",
      "building_structure",
      "ownership_type",
      "mortgage_status",
    ],
    manualOnlyFields: ["condition_defects_notes"],
    phasedImplementationPriority: 2,
    note: "廠房以建物標示與權利狀態為主，現場狀況仍需補件。",
  },
  "industrial-land": {
    id: "coverage-industrial-land",
    propertyType: "industrial-land",
    registryBackedFields: [
      "land_lot_no",
      "land_area",
      "zoning_use",
      "urban_district",
      "tax_land_value",
    ],
    manualOnlyFields: ["condition_defects_notes"],
    phasedImplementationPriority: 1,
    note: "工業地優先補地號、分區與公告現值。",
  },
  "commercial-land": {
    id: "coverage-commercial-land",
    propertyType: "commercial-land",
    registryBackedFields: [
      "land_lot_no",
      "land_area",
      "zoning_use",
      "urban_district",
      "tax_land_value",
    ],
    manualOnlyFields: ["condition_defects_notes"],
    phasedImplementationPriority: 2,
    note: "商業地與使用分區強相關，適合與 GIS 一起帶入。",
  },
  "village-land": {
    id: "coverage-village-land",
    propertyType: "village-land",
    registryBackedFields: [
      "land_lot_no",
      "land_area",
      "zoning_use",
      "urban_district",
      "tax_land_value",
    ],
    manualOnlyFields: ["condition_defects_notes"],
    phasedImplementationPriority: 2,
    note: "鄉村區建地可先跟住宅地共用核心欄位。",
  },
  "other-land": {
    id: "coverage-other-land",
    propertyType: "other-land",
    registryBackedFields: ["land_lot_no", "land_area", "tax_land_value"],
    manualOnlyFields: ["condition_defects_notes"],
    phasedImplementationPriority: 4,
    note: "其他土地先保持保守覆蓋，避免過度自動推導。",
  },
};

export function listPropertyTypeDefinitions(): PropertyTypeDefinition[] {
  return PROPERTY_TYPE_REGISTRY.slice();
}

export function getPropertyTypeDefinition(id: PropertyTypeId): PropertyTypeDefinition {
  const definition = PROPERTY_TYPE_REGISTRY.find((item) => item.id === id);
  if (!definition) {
    throw new Error(`Unknown property type: ${id}`);
  }
  return definition;
}

export function getPropertyTypeCoverageProfile(id: PropertyTypeId): PropertyTypeCoverageProfile {
  return PROPERTY_TYPE_COVERAGE_PROFILES[id];
}

export function listPropertyTypeCoverageProfiles(): PropertyTypeCoverageProfile[] {
  return PROPERTY_TYPE_REGISTRY.map((item) => PROPERTY_TYPE_COVERAGE_PROFILES[item.id]);
}
