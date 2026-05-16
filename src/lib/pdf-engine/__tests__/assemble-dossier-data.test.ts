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
      if (cmd === "query_real_price") return [];
      throw new Error(`Unexpected: ${cmd}`);
    });

    const result = await assembleDossierData(landCaseRow);
    expect(result.soilConservation).toBe("依主管機關規定辦理");
    expect(result.buildingLineNote).toBe("依主管機關規定辦理");
  });
});
