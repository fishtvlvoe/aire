import { describe, expect, it } from "vitest";

import {
  getPropertyTypeCoverageProfile,
  getPropertyTypeDefinition,
  listPropertyTypeDefinitions,
} from "../property-type-registry";

describe("property-type-registry", () => {
  it("defines 13 property types with coverage profiles", () => {
    const definitions = listPropertyTypeDefinitions();
    expect(definitions).toHaveLength(13);
    expect(getPropertyTypeDefinition("farmland")).toMatchObject({
      displayName: "農地",
      category: "land",
    });
    expect(getPropertyTypeDefinition("townhouse")).toMatchObject({
      displayName: "透天別墅",
      category: "building",
    });
  });

  it("returns coverage profiles for farmhouse and townhouse", () => {
    expect(getPropertyTypeCoverageProfile("farmhouse")).toMatchObject({
      propertyType: "farmhouse",
    });
    expect(getPropertyTypeCoverageProfile("townhouse")).toMatchObject({
      propertyType: "townhouse",
    });
    expect(getPropertyTypeCoverageProfile("farmhouse").registryBackedFields).toContain("building_lot_no");
    expect(getPropertyTypeCoverageProfile("townhouse").manualOnlyFields).toContain("condition_defects_notes");
  });
});
