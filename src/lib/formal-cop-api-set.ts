import type { CasePropertyType } from "./cases-api";
import { getMoiServiceCatalogEntry } from "./moi-service-catalog";

export const FORMAL_COP_PRICING_SOURCE = "moi-service-catalog";

export const BUILDING_FORMAL_COP_API_SET = [
  "building_registry",
  "building_ownership",
] as const;

export const LAND_FORMAL_COP_API_SET = ["land_registry"] as const;

export type FormalCopApiId =
  | (typeof BUILDING_FORMAL_COP_API_SET)[number]
  | (typeof LAND_FORMAL_COP_API_SET)[number];

export interface FormalCopApiSetInput {
  buildingNo?: string | null;
  propertyType?: CasePropertyType | null;
}

export interface FormalCopApiPrice {
  apiId: string;
  serviceCode: string;
  unitPrice: number;
  pricingEvidence: string;
  pricingAvailable: boolean;
}

const FORMAL_COP_SERVICE_CODE_BY_API_ID: Record<string, string> = {
  land_registry: "MOI_API_001",
  land_value: "MOI_API_014",
  building_registry: "MOI_API_004",
  building_ownership: "MOI_API_005",
  building_other_rights: "MOI_API_006",
  address_to_building: "MOI_API_036",
  MOI_API_037: "MOI_API_037",
};

export function selectFormalCopApiSet(input: FormalCopApiSetInput): string[] {
  const buildingNo = input.buildingNo?.trim();
  if (buildingNo) return [...BUILDING_FORMAL_COP_API_SET];
  return [...LAND_FORMAL_COP_API_SET];
}

export function getFormalCopApiPrice(apiId: string): FormalCopApiPrice {
  const serviceCode = FORMAL_COP_SERVICE_CODE_BY_API_ID[apiId];
  if (!serviceCode) {
    return {
      apiId,
      serviceCode: apiId,
      unitPrice: 0,
      pricingEvidence: "服務目錄未對應，請先補齊計價設定",
      pricingAvailable: false,
    };
  }
  const catalogEntry = getMoiServiceCatalogEntry(serviceCode);
  if (!catalogEntry || typeof catalogEntry.unitPrice !== "number") {
    return {
      apiId,
      serviceCode,
      unitPrice: 0,
      pricingEvidence: catalogEntry?.pricingEvidence ?? "服務目錄未對應，請先補齊計價設定",
      pricingAvailable: false,
    };
  }
  return {
    apiId,
    serviceCode,
    unitPrice: catalogEntry.unitPrice,
    pricingEvidence: catalogEntry.pricingEvidence,
    pricingAvailable: true,
  };
}

export function listFormalCopApiPrices(apiIds: readonly string[]): FormalCopApiPrice[] {
  return apiIds.map((apiId) => getFormalCopApiPrice(apiId));
}

export function estimateFormalCopCost(apiIds: readonly string[]): number {
  return listFormalCopApiPrices(apiIds).reduce((sum, item) => sum + item.unitPrice, 0);
}
