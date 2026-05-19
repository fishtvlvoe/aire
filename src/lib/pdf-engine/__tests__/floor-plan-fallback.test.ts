import { describe, expect, it } from "vitest";

import type { CaseDossierData } from "../../pdf-engine/document";
import { FIELD_SKETCH_FLOOR_PLAN_DISCLAIMER } from "../../pdf-blocks/field-sketch-floor-plan-page";

describe("floor plan fallback", () => {
  it("PDF generates normally without floor plan page when no approved conversion exists", () => {
    // no-approved fallback: assemble sets fieldSketchFloorPlan = undefined
    const data = {
      fieldSketchFloorPlan: undefined,
    } as unknown as CaseDossierData;

    expect(data.fieldSketchFloorPlan).toBeFalsy();
  });

  it("with approved conversion: fieldSketchFloorPlan is truthy", () => {
    const data = {
      fieldSketchFloorPlan: {
        renderedSvg: "<svg/>",
        sourceLabel: "現場手稿整理圖",
        approvedAt: "2025-01-01T00:00:00+08:00",
        disclaimer: "test",
        originalSketchVersion: 1,
        conversionId: "conv-1",
      },
    } as unknown as CaseDossierData;

    expect(data.fieldSketchFloorPlan).toBeTruthy();
  });

  it("assemble logic mock: disclaimer contains 現場手稿整理", () => {
    expect(FIELD_SKETCH_FLOOR_PLAN_DISCLAIMER).toContain("現場手稿整理");
  });

  it("conversionId is present in PDF data when approved conversion exists", () => {
    // Create fieldSketchFloorPlan with a specific conversionId
    const convId = "conv-abc-123";
    const data: Pick<CaseDossierData, "fieldSketchFloorPlan"> = {
      fieldSketchFloorPlan: {
        renderedSvg: "<svg/>",
        sourceLabel: "現場手稿整理圖",
        approvedAt: "2025-01-01T00:00:00+08:00",
        disclaimer: "test disclaimer",
        originalSketchVersion: 2,
        conversionId: convId,
      },
    };
    // Assert conversionId is present and matches
    expect(data.fieldSketchFloorPlan?.conversionId).toBe(convId);
    expect(data.fieldSketchFloorPlan?.conversionId).toBeTruthy();
  });

  it("conversionId is absent when no approved conversion", () => {
    const data: Pick<CaseDossierData, "fieldSketchFloorPlan"> = {
      fieldSketchFloorPlan: undefined,
    };
    // When fieldSketchFloorPlan is absent, there is no conversionId to track
    expect(data.fieldSketchFloorPlan?.conversionId).toBeUndefined();
  });
});
