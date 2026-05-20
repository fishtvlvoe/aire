import { describe, expect, it } from "vitest";
import { renderDisclosureHtml } from "../html-renderer";
import type { CaseDossierData } from "../document";

function baseDossier(overrides: Partial<CaseDossierData> = {}): CaseDossierData {
  return {
    caseNo: "AIRE-HTML-FLOOR-PLAN",
    address: "台北市大安區和平東路一段100號",
    propertyType: "building",
    landLotNo: "大安段一小段123-4",
    ownerName: "陳小美",
    companyName: "AIRE 測試公司",
    generatedAt: "2026-05-20",
    landArea: 100,
    floorPlanPhoto: null,
    ...overrides,
  };
}

describe("renderDisclosureHtml — floor-plan photo preview", () => {
  it("renders residential floor-plan photo as a data URL image", () => {
    const html = renderDisclosureHtml(
      baseDossier({
        floorPlanPhoto: new Uint8Array([0x89, 0x50, 0x4E, 0x47]),
      }),
      { themeId: "theme-a-minimal", generatedAt: "2026-05-20" },
    );

    expect(html).toContain("格局圖");
    expect(html).toContain('alt="格局圖"');
    expect(html).toContain("data:image/png;base64,");
  });

  it("renders land planning-map placeholder when no upload exists", () => {
    const html = renderDisclosureHtml(
      baseDossier({
        propertyType: "land",
        floorPlanPhoto: null,
      }),
      { themeId: "theme-a-minimal", generatedAt: "2026-05-20" },
    );

    expect(html).toContain("土地規劃圖");
    expect(html).toContain("請上傳規劃圖");
  });
});
