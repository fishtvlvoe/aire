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
  it("combines location map and life amenities into one HTML page", () => {
    const html = renderDisclosureHtml(
      baseDossier({
        locationMapImage: new Uint8Array([0x89, 0x50, 0x4E, 0x47]),
        nearbyAmenities: [
          { name: "大安國小", category: "學校", distanceM: 300, address: "臺北市大安區" },
        ],
      }),
      { themeId: "theme-a-minimal", generatedAt: "2026-05-20" },
    );

    expect(html).toContain("位置圖與生活機能");
    expect(html).toContain("大安國小");
    expect((html.match(/key=\"life-amenities\"/g) ?? []).length).toBeLessThanOrEqual(1);
  });

  it("keeps the location and life amenities page with placeholders when map data is missing", () => {
    const html = renderDisclosureHtml(
      baseDossier({
        locationMapImage: null,
        nearbyAmenities: [],
      }),
      { themeId: "theme-a-minimal", generatedAt: "2026-05-20" },
    );

    expect(html).toContain("位置圖與生活機能");
    expect(html).toContain("自動產生失敗時可手動上傳覆蓋");
    expect(html).toContain("尚未查詢周邊設施");
  });


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

  it("renders a blank planning-map frame when no upload exists", () => {
    const html = renderDisclosureHtml(
      baseDossier({
        propertyType: "land",
        floorPlanPhoto: null,
      }),
      { themeId: "theme-a-minimal", generatedAt: "2026-05-20" },
    );

    expect(html).toContain("土地規劃圖");
    expect(html).toContain('aria-label="土地規劃圖空白框"');
    expect(html).not.toContain("請上傳規劃圖");
    expect(html).not.toContain("請上傳格局圖");
  });
});
