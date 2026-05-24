import { describe, expect, it } from "vitest";

import {
  getDisclosureFieldSourceRow,
  getFieldCoverageReport,
  getFieldGapResolution,
} from "../disclosure-field-source-matrix";

describe("disclosure-field-source-matrix", () => {
  it("classifies registry-backed fields and manual-only fields", () => {
    expect(getDisclosureFieldSourceRow("building_lot_no", "townhouse")).toMatchObject({
      sourceKind: "registry_api",
      automationState: "filled_from_registry",
    });
    expect(getDisclosureFieldSourceRow("owner_name", "townhouse")).toMatchObject({
      sourceKind: "manual_document",
      automationState: "manual_required",
    });
  });

  it("exposes integration gaps, mapping gaps, and manual required reasons", () => {
    expect(
      getFieldGapResolution({
        fieldKey: "land_category",
        propertyType: "farmland",
        lookupStatus: "success",
        mappedSourceField: "land_category",
      }),
    ).toMatchObject({
      automationState: "integration_gap",
      gapDetail: "missing_client",
    });

    expect(
      getFieldGapResolution({
        fieldKey: "building_lot_no",
        propertyType: "townhouse",
        lookupStatus: "empty_success",
        mappedSourceField: "building_number",
      }),
    ).toMatchObject({
      automationState: "mapping_gap",
      gapDetail: "empty_success",
    });

    expect(
      getFieldGapResolution({
        fieldKey: "owner_name",
        propertyType: "townhouse",
      }),
    ).toMatchObject({
      automationState: "manual_required",
      gapDetail: "manual_confirmation",
    });
  });

  it("builds a coverage report for farmland", () => {
    const report = getFieldCoverageReport("farmland");
    expect(report.some((row) => row.fieldKey === "land_lot_no")).toBe(true);
    expect(report.some((row) => row.fieldKey === "condition_access")).toBe(true);
  });
});
