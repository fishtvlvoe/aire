import { describe, expect, it } from "vitest";

import { autofillDisclosureDraft } from "../registry-autofill-engine";
import { listDisclosureFieldSourceMatrix } from "../disclosure-field-source-matrix";
import { listMoiServiceCatalog } from "../moi-service-catalog";

describe("registry-autofill-engine", () => {
  it("fills empty registry-backed fields without overwriting manual input", () => {
    const result = autofillDisclosureDraft({
      propertyType: "townhouse",
      draftFields: [
        { fieldKey: "floor_area" },
        { fieldKey: "floor_this", value: 5, manuallyEdited: true },
        { fieldKey: "owner_name" },
      ],
      matrixRows: listDisclosureFieldSourceMatrix(),
      catalog: listMoiServiceCatalog(),
      lookupResults: [
        {
          serviceCode: "MOI_API_004",
          success: true,
          payload: {
            building_registry: {
              area: 83.61,
              floor_this: 8,
            },
          },
          source: "api",
          returnRows: 1,
        },
      ],
    });

    expect(result.fields.find((field) => field.fieldKey === "floor_area")).toMatchObject({
      value: 83.61,
      automationState: "filled_from_registry",
      sourceMetadata: {
        serviceCode: "MOI_API_004",
        appliedFrom: "registry",
      },
    });
    expect(result.fields.find((field) => field.fieldKey === "floor_this")).toMatchObject({
      value: 5,
      sourceKind: "manual_edit",
      automationState: "manual_required",
      sourceMetadata: {
        appliedFrom: "manual",
      },
    });
    expect(result.fields.find((field) => field.fieldKey === "owner_name")).toMatchObject({
      automationState: "manual_required",
      sourceKind: "manual_document",
    });
    expect(result.appliedCount).toBe(1);
  });

  it("keeps private owner identity fields empty when registry only returns ownership status", () => {
    const result = autofillDisclosureDraft({
      propertyType: "townhouse",
      draftFields: [{ fieldKey: "owner_name" }],
      matrixRows: listDisclosureFieldSourceMatrix(),
      catalog: listMoiServiceCatalog(),
      lookupResults: [
        {
          serviceCode: "MOI_API_005",
          success: true,
          payload: {
            ownership_type: "全部",
          },
          source: "api",
          returnRows: 1,
        },
      ],
    });

    expect(result.fields[0]).toMatchObject({
      fieldKey: "owner_name",
      automationState: "manual_required",
      value: "",
    });
  });

  it("uses the caller-provided matrix instead of the global matrix", () => {
    const result = autofillDisclosureDraft({
      propertyType: "townhouse",
      draftFields: [{ fieldKey: "custom_field" }],
      matrixRows: [
        {
          fieldKey: "custom_field",
          documentArea: "building.identification",
          propertyTypes: ["townhouse"],
          sourceKind: "registry_api",
          automationState: "filled_from_registry",
          serviceCodes: ["MOI_API_004"],
          requiredForCompletion: false,
          reviewNote: "custom mapping",
          sourcePayloadPaths: ["building_registry.custom"],
        },
      ],
      catalog: listMoiServiceCatalog(),
      lookupResults: [
        {
          serviceCode: "MOI_API_004",
          success: true,
          payload: { building_registry: { custom: "from custom matrix" } },
        },
      ],
    });

    expect(result.fields[0]).toMatchObject({
      fieldKey: "custom_field",
      value: "from custom matrix",
      automationState: "filled_from_registry",
    });
  });

  it("falls back to later service codes when the first service has no lookup result", () => {
    const result = autofillDisclosureDraft({
      propertyType: "townhouse",
      draftFields: [{ fieldKey: "floor_area" }],
      matrixRows: listDisclosureFieldSourceMatrix(),
      catalog: listMoiServiceCatalog(),
      lookupResults: [
        {
          serviceCode: "MOI_API_026",
          success: true,
          payload: {
            building_registry: {
              area: 91.2,
            },
          },
          source: "api",
          returnRows: 1,
        },
      ],
    });

    expect(result.fields[0]).toMatchObject({
      value: 91.2,
      sourceMetadata: {
        serviceCode: "MOI_API_026",
      },
    });
  });
});
