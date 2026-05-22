import { describe, expect, it } from "vitest";

import {
  buildRegistryPreviewSections,
  calculateBuildingAge,
  summarizeRegistryPreview,
} from "../registry-preview";

describe("registry-preview", () => {
  it("builds readable sections from persisted MOI/COP payloads and nested row arrays", () => {
    const sections = buildRegistryPreviewSections(
      {
        land_registry: {
          data: {
            lot_number: "大安段一小段 123-4",
            area: 1223.45,
            zoning: "住宅區",
          },
        },
        co_owners: {
          owners: [
            {
              OWNER: { LNAME: "陳小美" },
              registration_date: "2015-08-20",
              numerator: 1,
              denominator: 1,
            },
          ],
        },
        building_registry: {
          data: {
            building_number: "建號 556-1",
            building_address: "台北市大安區和平東路一段 100 號五樓之三",
            purpose: "住家用",
            material: "鋼筋混凝土造",
            building_floor: "013層",
            area: 84.13,
            construction_date: "083/10/18",
            main_building_area: 84.13,
            auxiliary_area: 11.09,
            common_area: 31.24,
          },
        },
        building_ownership: {
          owner_name: "陳小美",
          numerator: "1",
          denominator: "1",
        },
        building_other_rights: {
          rights: [
            {
              right_type: "抵押權",
              creditor: "台灣銀行",
              amount: 3_000_000,
              collateral_building_numbers: ["大安段一小段-556-1"],
            },
          ],
        },
      },
      new Date("2026-05-20T00:00:00+08:00"),
    );

    const text = JSON.stringify(sections);
    const landOwnership = sections.find((section) => section.id === "land_ownership");
    expect(landOwnership?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "所有權人", value: "陳小美" }),
        expect.objectContaining({ label: "權利範圍", value: "1/1" }),
      ]),
    );
    expect(text).toContain("土地所有權部");
    expect(text).toContain("陳小美");
    expect(text).toContain("建物標示部");
    expect(text).toContain("住家用");
    expect(text).toContain("31 年");
    expect(text).toContain("抵押權");
    expect(text).toContain("台灣銀行");
    expect(text).toContain("大安段一小段-556-1");
    expect(summarizeRegistryPreview(sections).statusText).toMatch(/^已讀到 \d+ 個欄位$/);
  });

  it("calculates building age from ROC and ISO-like completion dates", () => {
    const now = new Date("2026-05-20T00:00:00+08:00");

    expect(calculateBuildingAge("083/10/18", now)).toBe("31 年");
    expect(calculateBuildingAge("2015-06-15", now)).toBe("10 年");
  });

  it("reads trusted provenance envelope and ignores untrusted entries in preview", () => {
    const sections = buildRegistryPreviewSections({
      schema: "aire.registry-provenance.v1",
      generatedAt: "2026-05-22T00:00:00.000Z",
      entries: {
        building_registry: {
          apiId: "building_registry",
          source: "moi_api",
          status: "success",
          trustedForPdf: true,
          data: { building_number: "建號 778-2", purpose: "住家用" },
        },
        raw_probe: {
          apiId: "raw_probe",
          source: "raw_probe",
          status: "probe",
          trustedForPdf: false,
          data: { purpose: "不可顯示" },
        },
      },
    });

    const text = JSON.stringify(sections);
    expect(text).toContain("建號 778-2");
    expect(text).toContain("住家用");
    expect(text).not.toContain("不可顯示");
  });
});
