import { describe, it, expect } from "vitest";
import FieldSketchFloorPlanPage, {
  FIELD_SKETCH_FLOOR_PLAN_DISCLAIMER,
} from "../field-sketch-floor-plan-page";

describe("FieldSketchFloorPlanPage", () => {
  it("exports a valid component", () => {
    expect(FieldSketchFloorPlanPage).toBeTruthy();
    expect(typeof FieldSketchFloorPlanPage).toBe("function");
  });

  it("includes the required disclaimer literal", () => {
    expect(FIELD_SKETCH_FLOOR_PLAN_DISCLAIMER).toContain("本圖依現場手稿整理，供空間配置參考");
    expect(FieldSketchFloorPlanPage.toString()).toContain("本圖依現場手稿整理，供空間配置參考");
  });
});
