import { describe, expect, it } from "vitest";

import {
  BUILDING_FORMAL_COP_API_SET,
  LAND_FORMAL_COP_API_SET,
  estimateFormalCopCost,
  selectFormalCopApiSet,
} from "@/lib/formal-cop-api-set";

describe("formal COP API set selection", () => {
  it("includes land registry together with building APIs when a building number is confirmed", () => {
    expect(selectFormalCopApiSet({ buildingNo: "00165000", propertyType: "highrise" })).toEqual(
      BUILDING_FORMAL_COP_API_SET,
    );
    expect(selectFormalCopApiSet({ buildingNo: "00165000", propertyType: "highrise" })).toContain(
      "land_registry",
    );
    expect(selectFormalCopApiSet({ buildingNo: "00165000", propertyType: "land" })).not.toContain("land_value");
  });

  it("selects the minimal land API set when no building number is confirmed", () => {
    expect(selectFormalCopApiSet({ buildingNo: null, propertyType: "land" })).toEqual(
      LAND_FORMAL_COP_API_SET,
    );
    expect(selectFormalCopApiSet({ buildingNo: "", propertyType: "residential" })).toEqual(
      LAND_FORMAL_COP_API_SET,
    );
  });

  it("estimates cost before paid lookup from the selected API set", () => {
    expect(estimateFormalCopCost(BUILDING_FORMAL_COP_API_SET)).toBe(3);
    expect(estimateFormalCopCost(LAND_FORMAL_COP_API_SET)).toBe(1);
  });
});
