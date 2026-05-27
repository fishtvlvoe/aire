import type { CasePropertyType } from "./cases-api";

export const FORMAL_COP_UNIT_COST_TWD = 10;

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

export function selectFormalCopApiSet(input: FormalCopApiSetInput): string[] {
  const buildingNo = input.buildingNo?.trim();
  if (buildingNo) return [...BUILDING_FORMAL_COP_API_SET];
  return [...LAND_FORMAL_COP_API_SET];
}

export function estimateFormalCopCost(apiIds: readonly string[]): number {
  return apiIds.length * FORMAL_COP_UNIT_COST_TWD;
}
