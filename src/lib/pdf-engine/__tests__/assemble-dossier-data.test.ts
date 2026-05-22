import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  assembleDossierData,
  computeRecentSaleStats,
  ZONING_RESTRICTIONS,
} from "../assemble-dossier-data";
import type { CaseRow } from "@/lib/cases-api";

// ─────────────────────────────────────────────────────────────────────────────
// Mock tauri-bridge safeInvoke
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("@/lib/tauri-bridge", () => ({
  safeInvoke: vi.fn(),
}));

import { safeInvoke } from "@/lib/tauri-bridge";
const mockInvoke = vi.mocked(safeInvoke);

// ─────────────────────────────────────────────────────────────────────────────
// 測試資料
// ─────────────────────────────────────────────────────────────────────────────

const landCaseRow: CaseRow = {
  id: "test-id-001",
  case_no: "AIRE-2026-LAND",
  property_type: "land",
  land_lot_no: "板橋段88-1",
    land_lots: ["板橋段88-1"],
  address: "新北市板橋區文化路一段188號",
  owner_name: "林大仁",
  status: "draft",
  created_at: 1700000000,
  updated_at: 1700000000,
};

const buildingCaseRow: CaseRow = {
  id: "test-id-002",
  case_no: "AIRE-2026-BLDG",
  property_type: "residential",
  land_lot_no: "板橋段100-2",
    land_lots: ["板橋段100-2"],
  address: "新北市板橋區中山路一段50號",
  owner_name: "王建國",
  status: "draft",
  created_at: 1700000000,
  updated_at: 1700000000,
};

const mockPullResultLand = {
  results: {
    land_registry: {
      data: { area: 250.5, purpose: "田" },
    },
    zoning: {
      data: { zoning_type: "農業區", usage_category: "農牧用地" },
    },
    land_value: {
      data: { announced_value: 50000, assessed_value: 45000 },
    },
    mortgages: {
      data: [
        { creditor: "台灣銀行", amount: 5000000 },
        { creditor: "合作金庫", amount: 2000000 },
      ],
    },
  },
  total_cost: 4,
};

const mockLegalClauses = [
  "依不動產經紀業管理條例第 23 條規定，不動產經紀人員應依本說明書說明標的物狀況。",
  "本說明書所載資料以簽約當日前最新調查資料為準。",
];

const mockRealPriceRecords = [
  { unit_price: 100000 },
  { unit_price: 120000 },
  { unit_price: 110000 },
  { unit_price: 130000 },
  { unit_price: 90000 },
];

const mockRealPriceRecordsWithDate = [
  {
    address: "台南市永康區勝利街58巷6號",
    area: 30.2,
    total_price: 11800000,
    unit_price: 390728,
    date: "2024-02-18",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// computeRecentSaleStats
// ─────────────────────────────────────────────────────────────────────────────

describe("computeRecentSaleStats", () => {
  it("5 筆 unit_price → avg = 110000，count = 5", () => {
    const result = computeRecentSaleStats(mockRealPriceRecords);
    expect(result.avg).toBe(110000);
    expect(result.count).toBe(5);
  });

  it("空陣列 → avg = undefined，count = 0", () => {
    const result = computeRecentSaleStats([]);
    expect(result.avg).toBeUndefined();
    expect(result.count).toBe(0);
  });

  it("非陣列輸入 → avg = undefined，count = 0", () => {
    const result = computeRecentSaleStats(null as unknown as unknown[]);
    expect(result.avg).toBeUndefined();
    expect(result.count).toBe(0);
  });

  it("記錄缺少 unit_price → 忽略無效記錄", () => {
    const result = computeRecentSaleStats([{ price: 100000 }, { unit_price: 200000 }]);
    expect(result.avg).toBe(200000);
    expect(result.count).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ZONING_RESTRICTIONS lookup
// ─────────────────────────────────────────────────────────────────────────────

describe("ZONING_RESTRICTIONS", () => {
  it("農業區 soilConservation 為非空字串", () => {
    expect(ZONING_RESTRICTIONS["農業區"].soilConservation).toBeTruthy();
    expect(typeof ZONING_RESTRICTIONS["農業區"].soilConservation).toBe("string");
  });

  it("包含至少 5 個分區", () => {
    expect(Object.keys(ZONING_RESTRICTIONS).length).toBeGreaterThanOrEqual(5);
  });

  it("未知分區（未知X）不在 ZONING_RESTRICTIONS 中", () => {
    expect(ZONING_RESTRICTIONS["未知X"]).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// assembleDossierData — 土地版成功路徑
// ─────────────────────────────────────────────────────────────────────────────

describe("assembleDossierData — 土地版成功路徑", () => {
  it("(a) 所有 land 欄位有值", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "land_registry_pull_data") return mockPullResultLand;
      if (cmd === "get_legal_clause") return mockLegalClauses;
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return mockRealPriceRecords;
      throw new Error(`Unexpected invoke: ${cmd}`);
    });

    const result = await assembleDossierData(landCaseRow);

    expect(result.propertyType).toBe("land");
    expect(result.caseNo).toBe("AIRE-2026-LAND");
    expect(result.landArea).toBe(250.5);
    expect(result.landPurpose).toBe("田");
    expect(result.zoningType).toBe("農業區");
    expect(result.usageCategory).toBe("農牧用地");
    expect(result.soilConservation).toBe(ZONING_RESTRICTIONS["農業區"].soilConservation);
    expect(result.buildingLineNote).toBe(ZONING_RESTRICTIONS["農業區"].buildingLineNote);
    expect(result.announcedLandValue).toBe(50000);
    expect(result.assessedLandValue).toBe(45000);
    expect(result.mortgages).toHaveLength(2);
    expect(result.mortgages![0].creditor).toBe("台灣銀行");
    expect(result.legalClauses).toHaveLength(2);
    expect(result.recentSalePricePerSqm).toBe(110000);
    expect(result.recentSaleCount).toBe(5);
  });

  it("實價登錄 date 欄位會帶入 PDF 成交日期，不顯示空白", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "land_registry_pull_data") return mockPullResultLand;
      if (cmd === "get_legal_clause") return mockLegalClauses;
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return mockRealPriceRecordsWithDate;
      throw new Error(`Unexpected invoke: ${cmd}`);
    });

    const result = await assembleDossierData({
      ...landCaseRow,
      address: "台南市永康區勝利街58巷4號1樓",
    });

    expect(result.transactionHistory?.[0]).toMatchObject({
      address: "台南市永康區勝利街58巷6號",
      transactionDate: "2024-02-18",
    });
  });
});

describe("assembleDossierData — 建物謄本自動帶入", () => {
  it("真實地址 PDF 使用案件名稱，且不把 mock 權狀字號與樓層當成真實資料", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      throw new Error(`Unexpected invoke: ${cmd}`);
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      case_name: "裕農路測試案",
      case_no: "AIRE-REAL-TEST-001",
      address: "台南市東區裕農路288巷17號8樓之1",
      owner_name: "余啟彰",
      land_registry_data: {
        building_registry: {
          building_area: 85.5,
          building_floor: "013層",
        },
        building_ownership: {
          certificate_no: "北松字第012345號",
          numerator: "1",
          denominator: "1",
        },
      },
    });

    expect(result.cover?.propertyName).toBe("裕農路測試案");
    expect(result.address).toBe("台南市東區裕農路288巷17號8樓之1");
    expect(result.buildingCertificateNo).toBeUndefined();
    expect(result.propertySheet?.floor).toBe("8樓之1");
  });

  it("未保存正式地政資料時，不把 browser-dev mock pull payload 輸出成官方 PDF 欄位", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      if (cmd === "land_registry_pull_data") {
        return {
          total_cost: 30,
          results: {
            building_registry: {
              success: true,
              source: "mock",
              data: {
                building_area: 85.5,
                building_purpose: "住家用",
                construction_date: "2015-06-15",
              },
            },
            building_ownership: {
              success: true,
              source: "mock",
              data: {
                certificate_no: "北松字第012345號",
                ownership_date: "2015-08-20",
              },
            },
            mortgages: {
              success: true,
              source: "mock",
              data: [{ creditor: "台灣銀行", amount: 3000000 }],
            },
          },
        };
      }
      throw new Error(`Unexpected invoke: ${cmd}`);
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      case_name: "裕農路測試案",
      address: "台南市東區裕農路288巷17號8樓之1",
      owner_name: "余啟彰",
      land_registry_data: null,
    });

    expect(result.buildingArea).toBeUndefined();
    expect(result.constructionDate).toBeUndefined();
    expect(result.buildingCertificateNo).toBeUndefined();
    expect(result.mortgages).toBeUndefined();
    expect(result.propertySheet?.registeredArea).toBeUndefined();
    expect(result.propertySheet?.constructionDate).toBeUndefined();
    expect(result.propertySheet?.owner).toBe("余啟彰");
  });

  it("使用本機保存的 API payload 帶入建物面積、用途、完成日、屋齡與權利範圍", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return mockLegalClauses;
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      throw new Error(`Unexpected invoke: ${cmd}`);
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      land_registry_data: {
        land_registry: {
          area: 1223,
          ZONING: "住宅區",
        },
        co_owners: {
          owner_name: "陳小美",
          numerator: "91",
          denominator: "10000",
        },
        building_registry: {
          building_area: 84.13,
          building_purpose: "住家用",
          material: "鋼筋混凝土造",
          building_floor: "013層",
          construction_date: "083/10/18",
          main_building_area: 84.13,
          auxiliary_area: 11.09,
          common_area: 31.24,
        },
        building_ownership: {
          owner_name: "陳小美",
          ownership_date: "083/12/13",
          numerator: "1",
          denominator: "1",
        },
      },
    });

    expect(result.propertySheet?.registeredArea).toBe(25.45);
    expect(result.propertySheet?.mainBuildingArea).toBe(25.45);
    expect(result.propertySheet?.auxiliaryArea).toBe(3.35);
    expect(result.propertySheet?.commonArea).toBe(9.45);
    expect(result.propertySheet?.legalUse).toBe("住家用");
    expect(result.propertySheet?.material).toBe("鋼筋混凝土造");
    expect(result.propertySheet?.constructionDate).toBe("083/10/18");
    expect(result.propertySheet?.buildingAge).toBeTruthy();
    expect(result.propertySheet?.floor).toBe("013層");
    expect(result.propertySheet?.owner).toBe("陳小美");
    expect(result.propertySheet?.ownershipScope).toBe("1/1");
  });

  it("支援地政 parser 回傳的數字型權利範圍", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      return {};
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      land_registry_data: {
        building_registry: { area: 84.13 },
        building_ownership: {
          owner_name: "陳小美",
          numerator: 1,
          denominator: 1,
        },
      },
    });

    expect(result.propertySheet?.ownershipScope).toBe("1/1");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// assembleDossierData — 錯誤處理
// ─────────────────────────────────────────────────────────────────────────────

describe("assembleDossierData — invoke 失敗時降級", () => {
  it("(b) invoke 拋出錯誤時欄位為 undefined 且函式不拋出", async () => {
    mockInvoke.mockRejectedValue(new Error("IPC error: API key not set"));

    let result: Awaited<ReturnType<typeof assembleDossierData>> | undefined;
    await expect(
      assembleDossierData(landCaseRow).then((r) => {
        result = r;
      }),
    ).resolves.not.toThrow();

    expect(result).toBeDefined();
    expect(result!.landArea).toBeUndefined();
    expect(result!.zoningType).toBeUndefined();
    expect(result!.legalClauses).toEqual([]);
    expect(result!.recentSalePricePerSqm).toBeUndefined();
    expect(result!.recentSaleCount).toBeUndefined();
  });

  it("(c) 空 query_real_price 結果 → recentSalePricePerSqm undefined，recentSaleCount 0", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "land_registry_pull_data") return mockPullResultLand;
      if (cmd === "get_legal_clause") return mockLegalClauses;
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      throw new Error(`Unexpected: ${cmd}`);
    });

    const result = await assembleDossierData(landCaseRow);
    expect(result.recentSalePricePerSqm).toBeUndefined();
    expect(result.recentSaleCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// assembleDossierData — zoningType 映射
// ─────────────────────────────────────────────────────────────────────────────

describe("assembleDossierData — zoningType 映射", () => {
  it("(d) 已知 zoningType 映射正確", async () => {
    const pullWithKnownZoning = {
      ...mockPullResultLand,
      results: {
        ...mockPullResultLand.results,
        zoning: { data: { zoning_type: "住宅區", usage_category: "乙種住宅用地" } },
      },
    };

    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "land_registry_pull_data") return pullWithKnownZoning;
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      throw new Error(`Unexpected: ${cmd}`);
    });

    const result = await assembleDossierData(landCaseRow);
    expect(result.soilConservation).toBe(ZONING_RESTRICTIONS["住宅區"].soilConservation);
    expect(result.buildingLineNote).toBe(ZONING_RESTRICTIONS["住宅區"].buildingLineNote);
  });

  it("(d) 未知 zoningType 回傳 '依主管機關規定辦理'", async () => {
    const pullWithUnknownZoning = {
      ...mockPullResultLand,
      results: {
        ...mockPullResultLand.results,
        zoning: { data: { zoning_type: "未知特殊分區X", usage_category: "" } },
      },
    };

    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "land_registry_pull_data") return pullWithUnknownZoning;
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      throw new Error(`Unexpected: ${cmd}`);
    });

    const result = await assembleDossierData(landCaseRow);
    expect(result.soilConservation).toBe("依主管機關規定辦理");
    expect(result.buildingLineNote).toBe("依主管機關規定辦理");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// assembleDossierData — 封面品牌資訊
// ─────────────────────────────────────────────────────────────────────────────

describe("assembleDossierData — 封面品牌資訊", () => {
  it("get_brand_text_settings 回傳 company_name → cover.brokerageCompanyName 正確", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return { company_name: "大安不動產" };
      if (cmd === "land_registry_pull_data") return mockPullResultLand;
      if (cmd === "get_legal_clause") return mockLegalClauses;
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return mockRealPriceRecords;
      throw new Error(`Unexpected invoke: ${cmd}`);
    });

    const result = await assembleDossierData(landCaseRow);
    expect(result.cover?.brokerageCompanyName).toBe("大安不動產");
  });

  it("get_brand_text_settings 失敗時 cover.brokerageCompanyName 為空字串", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") throw new Error("IPC error");
      if (cmd === "land_registry_pull_data") return mockPullResultLand;
      if (cmd === "get_legal_clause") return mockLegalClauses;
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return mockRealPriceRecords;
      throw new Error(`Unexpected invoke: ${cmd}`);
    });

    const result = await assembleDossierData(landCaseRow);
    expect(result.cover?.brokerageCompanyName).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// assembleDossierData — 格局圖（現場手稿整理圖）
// ─────────────────────────────────────────────────────────────────────────────

describe("assembleDossierData — 格局圖（現場手稿整理圖）", () => {
  const minimalLandCaseRow: CaseRow = {
    id: "test-id",
    case_no: "AIRE-TEST-FLOORPLAN",
    property_type: "land",
    land_lot_no: "",
    land_lots: [""],
    address: "",
    owner_name: "",
    status: "draft",
    created_at: 1700000000,
    updated_at: 1700000000,
  };

  it("only_approved_conversion_in_dossier", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "land_registry_pull_data") return { results: {}, total_cost: 0 };
      if (cmd === "get_legal_clause") return [];
      if (cmd === "query_real_price") return [];
      if (cmd === "list_floor_plan_conversion_history") {
        return {
          sketches: [{ id: "s1", version: 1, case_id: "test-id" }],
          conversions: [
            {
              id: "conv1",
              status: "approved",
              approved_at: "2026-01-01T00:00:00+08:00",
              sketch_id: "s1",
            },
          ],
        };
      }
      if (cmd === "render_floor_plan_conversion") return "<svg><!--test--></svg>";
      return {};
    });

    const result = await assembleDossierData(minimalLandCaseRow);
    expect(result.fieldSketchFloorPlan).toBeDefined();
    expect(result.fieldSketchFloorPlan?.conversionId).toBe("conv1");
  });

  it("draft_conversion_not_in_dossier", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "land_registry_pull_data") return { results: {}, total_cost: 0 };
      if (cmd === "get_legal_clause") return [];
      if (cmd === "query_real_price") return [];
      if (cmd === "list_floor_plan_conversion_history") {
        return {
          sketches: [{ id: "s1", version: 1, case_id: "test-id" }],
          conversions: [{ id: "conv1", status: "draft", sketch_id: "s1" }],
        };
      }
      if (cmd === "render_floor_plan_conversion") {
        throw new Error("render_floor_plan_conversion should not be called");
      }
      return {};
    });

    const result = await assembleDossierData(minimalLandCaseRow);
    expect(result.fieldSketchFloorPlan).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// assembleDossierData — 直接上傳格局圖 / 規劃圖
// ─────────────────────────────────────────────────────────────────────────────

describe("assembleDossierData — floorPlanPhoto", () => {
  it("case_assets 成功時 floorPlanPhoto 為對應 Uint8Array", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "list_case_assets") {
        return [{ id: "asset-1", is_primary: true, review_status: "approved" }];
      }
      if (cmd === "read_case_asset_bytes") return { bytes: [1, 2, 3], mime: "image/png" };
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "land_registry_pull_data") return { results: {}, total_cost: 0 };
      if (cmd === "get_legal_clause") return [];
      if (cmd === "query_real_price") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      return {};
    });

    const result = await assembleDossierData(buildingCaseRow);

    expect(result.floorPlanPhoto).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("IPC 失敗且 land_registry_data 有 base64 時 floorPlanPhoto 為解碼 Uint8Array", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "list_case_assets") throw new Error("not available");
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "land_registry_pull_data") return { results: {}, total_cost: 0 };
      if (cmd === "get_legal_clause") return [];
      if (cmd === "query_real_price") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      return {};
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      land_registry_data: {
        floor_plan_photo: {
          base64: "AQID",
          mime: "image/png",
        },
      },
    });

    expect(result.floorPlanPhoto).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("IPC 失敗且無 fallback 時 floorPlanPhoto 為 null", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "list_case_assets") throw new Error("not available");
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "land_registry_pull_data") return { results: {}, total_cost: 0 };
      if (cmd === "get_legal_clause") return [];
      if (cmd === "query_real_price") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      return {};
    });

    const result = await assembleDossierData(buildingCaseRow);

    expect(result.floorPlanPhoto).toBeNull();
  });

  it("case_assets 讀檔失敗時 fallback 到 legacy base64", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "list_case_assets") {
        return [{ id: "asset-missing", is_primary: true, review_status: "approved" }];
      }
      if (cmd === "read_case_asset_bytes") throw new Error("asset_file_missing");
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "land_registry_pull_data") return { results: {}, total_cost: 0 };
      if (cmd === "get_legal_clause") return [];
      if (cmd === "query_real_price") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      return {};
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      land_registry_data: {
        floor_plan_photo: {
          base64: "AQID",
          mime: "image/png",
        },
      },
    });

    expect(result.floorPlanPhoto).toEqual(new Uint8Array([1, 2, 3]));
  });
});
