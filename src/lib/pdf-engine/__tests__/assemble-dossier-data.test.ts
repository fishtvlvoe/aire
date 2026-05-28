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

function ensureLocalStorage(): Storage {
  if (window.localStorage) return window.localStorage;

  const data = new Map<string, string>();
  const mockStorage = {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  } satisfies Storage;

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: mockStorage,
  });

  return mockStorage;
}

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
      source: "api",
      data: { area: 250.5, purpose: "田" },
    },
    zoning: {
      source: "api",
      data: { zoning_type: "農業區", usage_category: "農牧用地" },
    },
    land_value: {
      source: "api",
      data: { announced_value: 50000, assessed_value: 45000 },
    },
    mortgages: {
      source: "api",
      data: [
        { creditor: "台灣銀行", amount: 5000000 },
        { creditor: "合作金庫", amount: 2000000 },
      ],
    },
  },
  total_cost: 4,
};

function savedRegistryPayloadFromPullResult(
  pullResult: typeof mockPullResultLand,
  overrides: Partial<typeof mockPullResultLand["results"]> = {},
) {
  const results = { ...pullResult.results, ...overrides };
  return {
    schema: "aire.registry-provenance.v1",
    generatedAt: "2026-05-25T00:00:00.000Z",
    totalCost: pullResult.total_cost,
    entries: Object.fromEntries(
      Object.entries(results).map(([apiId, value]) => [
        apiId,
        {
          apiId,
          source: "moi_api",
          status: "success",
          trustedForPdf: true,
          data: value.data,
        },
      ]),
    ),
  };
}

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

function trustedRegistryPayload(entries: Record<string, Record<string, unknown>>) {
  return {
    schema: "aire.registry-provenance.v1",
    generatedAt: "2026-05-22T00:00:00.000Z",
    entries: Object.fromEntries(
      Object.entries(entries).map(([apiId, data]) => [
        apiId,
        {
          apiId,
          source: "moi_api",
          status: "success",
          trustedForPdf: true,
          data,
        },
      ]),
    ),
  };
}

function candidateRegistryPayload() {
  return {
    schema: "aire.registry-provenance.v1" as const,
    generatedAt: "2026-05-23T00:00:00.000Z",
    totalCost: 0,
    entries: {
      address_lookup: {
        apiId: "address_lookup",
        source: "moi_api",
        status: "failed",
        trustedForPdf: false,
        error: "門牌建號查詢未取得單一候選",
      },
    },
    candidate_options: [
      {
        candidate_id: "land:DC-1556-00700000",
        parcel_type: "land",
        section_code: "1556",
        section_name: "富強段",
        parcel_number: "00700000",
        normalized_parcel_id: "DC-1556-00700000",
        source: "public_reference",
        confidence_label: "same_address_candidate",
        official_status: "candidate_unconfirmed",
        query_status: "candidate_data_available",
        summary_fields: {
          landAreaSqm: 120.5,
          zoning: "住宅區",
          buildingCoverage: "60%",
          floorAreaRatio: "200%",
        },
        warnings: ["待屋主或權狀確認"],
      },
      {
        candidate_id: "building:DC-1556-00165000",
        parcel_type: "building",
        section_code: "1556",
        section_name: "富強段",
        parcel_number: "00165000",
        normalized_parcel_id: "DC-1556-00165000",
        source: "public_reference",
        confidence_label: "same_address_candidate",
        official_status: "candidate_unconfirmed",
        query_status: "candidate_data_available",
        summary_fields: {
          registeredAreaPing: 31.25,
          mainBuildingAreaPing: 23.1,
          auxiliaryAreaPing: 2.1,
          commonAreaPing: 6.05,
          parkingAreaPing: 0,
          legalUse: "住家用",
          constructionDate: "083/10/18",
          material: "鋼筋混凝土造",
          floor: "8樓之1",
          ownershipScope: "全部 1/1",
          landOwnershipRatio: "91/10000",
        },
        warnings: ["待屋主或權狀確認是否為 8樓之1"],
      },
      {
        candidate_id: "building:DC-1556-00167000",
        parcel_type: "building",
        section_code: "1556",
        section_name: "富強段",
        parcel_number: "00167000",
        normalized_parcel_id: "DC-1556-00167000",
        source: "public_reference",
        confidence_label: "same_address_candidate",
        official_status: "candidate_unconfirmed",
        query_status: "failed",
        error_code: "COP312",
        error_message: "取得服務資訊失敗",
        summary_fields: {},
        warnings: ["候選 probe 失敗"],
      },
    ],
    selected_candidate_ids: {
      land: "land:DC-1556-00700000",
      building: "building:DC-1556-00165000",
    },
    coordinate_source: {
      lat: 22.986314,
      lng: 120.22908,
      source: "candidate_reference",
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  ensureLocalStorage().removeItem("aire-mock-store");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("fetch is not available in assemble-dossier-data unit tests");
    }),
  );
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

    const result = await assembleDossierData({
      ...landCaseRow,
      land_registry_data: savedRegistryPayloadFromPullResult(mockPullResultLand),
    });

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

  it("實價登錄只採用同行政區或無地址摘要資料，避免混入錯地址", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "land_registry_pull_data") return mockPullResultLand;
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") {
        return [
          {
            address: "台南市永康區勝利街58巷6號",
            area: 30.2,
            total_price: 11800000,
            unit_price: 390728,
            date: "2024-02-18",
          },
          {
            address: "台北市大安區和平東路一段88號",
            area: 36.2,
            total_price: 42800000,
            unit_price: 1182320,
            date: "2025-10-12",
          },
        ];
      }
      return {};
    });

    const result = await assembleDossierData({
      ...landCaseRow,
      address: "台南市永康區勝利街58巷4號1樓",
    });

    expect(result.recentSalePricePerSqm).toBe(390728);
    expect(result.recentSaleCount).toBe(1);
    expect(result.transactionHistory).toHaveLength(1);
    expect(result.transactionHistory?.[0].address).toBe("台南市永康區勝利街58巷6號");
  });

  it("優先使用 list_legal_clauses 快取組成完整法規告知", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "land_registry_pull_data") return mockPullResultLand;
      if (cmd === "list_legal_clauses") {
        return [
          {
            law_id: "real-estate-broker-act",
            title: "不動產經紀業管理條例",
            content_markdown: "第二十三條 經紀人員應以不動產說明書向交易相對人解說。",
            version_date: "2024-08-15",
            fetched_at: "2026-05-23T00:00:00.000Z",
            source_url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0060013",
          },
          {
            law_id: "consumer-protection-relevant",
            title: "消費者保護法相關條款",
            content_markdown: "重要消費資訊不得隱匿。",
            version_date: "2024-08-15",
            fetched_at: "2026-05-23T00:00:00.000Z",
            source_url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=J0170001",
          },
        ];
      }
      if (cmd === "get_legal_clause") {
        throw new Error("get_legal_clause should not be called when list cache is available");
      }
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      return {};
    });

    const result = await assembleDossierData({
      ...landCaseRow,
      land_registry_data: savedRegistryPayloadFromPullResult(mockPullResultLand, {
        zoning: { source: "api", data: { zoning_type: "住宅區", usage_category: "乙種住宅用地" } },
      }),
    });

    expect(result.legalClauses).toHaveLength(2);
    expect(result.legalClauses?.[0]).toContain("不動產經紀業管理條例");
    expect(result.legalClauses?.[0]).toContain("第二十三條");
    expect(result.legalClauses?.[0]).toContain("資料來源：");
  });
});

describe("assembleDossierData — 建物謄本自動帶入", () => {
  it("東和路正式匯入資料會進入 PDF dossier 欄位，缺圖資與行情不會觸發付費查詢", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") {
        return [
          {
            address: "台南市東區東和路45號",
            area: 31.2,
            total_price: 10000000,
            unit_price: 320513,
            date: "2025-12",
          },
        ];
      }
      return {};
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      case_name: "東和路47",
      case_no: "AIRE-DONGHE-ASSEMBLY",
      address: "台南市東區東和路47號3樓",
      owner_name: "蔡國卿",
      land_registry_data: trustedRegistryPayload({
        building_registry: {
          building_number: "03045000",
          area: 128.2,
          main_building_area: 91.4,
          auxiliary_area: 8.3,
          common_area: 28.5,
          parking_area: 0,
          building_purpose: "住商用",
          construction_date: "0710804",
          building_floor: "三層",
          material: "鋼筋混凝土造",
        },
        building_ownership: {
          owner_name: "蔡國卿",
          numerator: 1,
          denominator: 1,
        },
      }),
    });

    expect(result.cover?.propertyName).toBe("東和路47");
    expect(result.propertySheet?.owner).toBe("蔡國卿");
    expect(result.propertySheet?.registeredArea).toBeCloseTo(38.78, 2);
    expect(result.propertySheet?.mainBuildingArea).toBeCloseTo(27.65, 2);
    expect(result.propertySheet?.auxiliaryArea).toBeCloseTo(2.51, 2);
    expect(result.propertySheet?.commonArea).toBeCloseTo(8.62, 2);
    expect(result.propertySheet?.parkingArea).toBe(0);
    expect(result.propertySheet?.legalUse).toBe("住商用");
    expect(result.propertySheet?.material).toBe("鋼筋混凝土造");
    expect(result.propertySheet?.constructionDate).toBe("民國071年08月04日");
    expect(result.propertySheet?.buildingAge).toBeTruthy();
    expect(result.propertySheet?.ownershipScope).toBe("1/1");
    expect(result.transactionHistory).toHaveLength(1);
    expect(result.taxCalculation?.estimateMode).toBe(true);
    expect(result.taxCalculation?.missingInputs).toEqual(
      expect.arrayContaining(["公告現值", "前次移轉現值", "成交價", "持分", "土地面積"]),
    );
    expect(result.exteriorPhoto).toBeNull();
    expect(result.nearbyAmenities).toEqual([]);
    expect(result.propertySheetSources?.registeredArea).toBeUndefined();
    expect(mockInvoke).not.toHaveBeenCalledWith("land_registry_pull_data", expect.anything());
  });

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
    expect(result.propertySheet?.landArea).toBeUndefined();
    expect(result.propertySheet?.shareArea).toBeUndefined();
    expect(result.propertySheet?.owner).toBe("余啟彰");
  });

  it("讀取補件 store，將人工格局、座向、管理費與建物現況回填物件資料表並標示來源", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_workbench_supplement") {
        return {
          caseId: buildingCaseRow.id,
          registrySupplements: [
            {
              fieldName: "格局",
              value: "3房2廳2衛",
              source: "人工輸入",
              status: "已補",
              updatedAt: "2026-05-23T03:00:00.000Z",
            },
            {
              fieldName: "座向",
              value: "坐東朝西",
              source: "屋主提供",
              status: "已補",
              updatedAt: "2026-05-23T03:01:00.000Z",
            },
            {
              fieldName: "管理費（元/月）",
              value: "2500",
              source: "屋主提供",
              status: "已補",
              updatedAt: "2026-05-23T03:02:00.000Z",
            },
          ],
          fieldVisitAnswers: [
            {
              topic: "建物現況",
              answer: "現況自住，屋況待現場復核",
              status: "已確認",
              updatedAt: "2026-05-23T03:03:00.000Z",
            },
          ],
          uploads: [],
          supplementAdded: true,
          updatedAt: "2026-05-23T03:03:00.000Z",
        };
      }
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      return {};
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      land_registry_data: trustedRegistryPayload({
        building_registry: { building_purpose: "住家用" },
        building_ownership: { owner_name: "王建國", numerator: "1", denominator: "1" },
      }),
    });

    expect(result.propertySheet?.rooms).toBe("3房2廳2衛");
    expect(result.propertySheet?.direction).toBe("坐東朝西");
    expect(result.propertySheet?.managementFee).toBe(2500);
    expect(result.propertySheet?.buildingStatus).toBe("現況自住，屋況待現場復核");
    expect(result.propertySheetSources).toMatchObject({
      rooms: "人工輸入",
      direction: "屋主提供",
      managementFee: "屋主提供",
      buildingStatus: "現場確認",
    });
  });

  it("讀取案件權威資料中的人工補件，不依賴單一瀏覽器補件 store", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_workbench_supplement") {
        return {
          registrySupplements: [],
          fieldVisitAnswers: [],
          uploads: [],
          supplementAdded: false,
          updatedAt: null,
        };
      }
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      return {};
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-23T00:00:00.000Z",
        entries: {
          building_registry: {
            apiId: "building_registry",
            source: "moi_api",
            status: "success",
            trustedForPdf: true,
            data: { building_purpose: "住家用" },
          },
          manual_registry_supplement: {
            apiId: "manual_registry_supplement",
            source: "manual",
            status: "manual_confirmed",
            trustedForPdf: true,
            data: {
              rooms: "2房1廳1衛",
              direction: "坐北朝南",
              managementFee: "3200",
              buildingStatus: "屋主自住，屋況待現場復核",
              sources: {
                rooms: "人工輸入",
                direction: "屋主提供",
                managementFee: "管委會提供",
                buildingStatus: "現場確認",
              },
            },
          },
        },
      },
    });

    expect(result.propertySheet?.rooms).toBe("2房1廳1衛");
    expect(result.propertySheet?.direction).toBe("坐北朝南");
    expect(result.propertySheet?.managementFee).toBe(3200);
    expect(result.propertySheet?.buildingStatus).toBe("屋主自住，屋況待現場復核");
    expect(result.propertySheetSources).toMatchObject({
      rooms: "人工輸入",
      direction: "屋主提供",
      managementFee: "管委會提供",
      buildingStatus: "現場確認",
    });
  });

  it("舊版未標記來源的地政 payload 不進正式 PDF 欄位", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      throw new Error(`Unexpected invoke: ${cmd}`);
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      land_registry_data: {
        building_registry: {
          building_area: 999,
          building_purpose: "不可直接採用",
        },
        building_ownership: {
          owner_name: "候選屋主",
          numerator: "1",
          denominator: "1",
        },
      },
    });

    expect(result.buildingArea).toBeUndefined();
    expect(result.buildingPurpose).toBeUndefined();
    expect(result.propertySheet?.owner).toBe("王建國");
    expect(result.propertySheet?.ownershipScope).toBe("");
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
      land_registry_data: trustedRegistryPayload({
        land_registry: {
          area: 1223,
          ZONING: "住宅區",
          section: "勝利段",
          lot_number: "58-4",
        },
        zoning: {
          building_coverage_ratio: "60%",
          floor_area_ratio: "200%",
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
      }),
    });

    expect(result.propertySheet?.registeredArea).toBe(25.45);
    expect(result.propertySheet?.landSection).toBe("勝利段");
    expect(result.propertySheet?.landNumber).toBe("58-4");
    expect(result.propertySheet?.zoning).toBe("住宅區");
    expect(result.propertySheet?.landArea).toBe(1223);
    expect(result.propertySheet?.ownershipRatio).toBe("91/10000");
    expect(result.propertySheet?.shareArea).toBe(11.13);
    expect(result.propertySheet?.buildingCoverage).toBe("60%");
    expect(result.propertySheet?.floorAreaRatio).toBe("200%");
    expect(result.propertySheet?.mainBuildingArea).toBe(25.45);
    expect(result.propertySheet?.auxiliaryArea).toBe(3.35);
    expect(result.propertySheet?.commonArea).toBe(9.45);
    expect(result.propertySheet?.legalUse).toBe("住家用");
    expect(result.propertySheet?.material).toBe("鋼筋混凝土造");
    expect(result.propertySheet?.constructionDate).toBe("民國083年10月18日");
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
      land_registry_data: trustedRegistryPayload({
        building_registry: { area: 84.13 },
        building_ownership: {
          owner_name: "陳小美",
          numerator: 1,
          denominator: 1,
        },
      }),
    });

    expect(result.propertySheet?.ownershipScope).toBe("1/1");
  });

  it("正式資料為民國壓縮日期時，仍會計算屋齡", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      return {};
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      land_registry_data: trustedRegistryPayload({
        building_registry: {
          building_area: 83.61,
          building_purpose: "住家用",
          construction_date: "0800829",
          building_floor: "八層",
        },
      }),
    });

    expect(result.propertySheet?.constructionDate).toBe("民國080年08月29日");
    expect(result.propertySheet?.buildingAge).toMatch(/年/);
  });

  it("candidate 與 raw probe provenance 不進正式 PDF 欄位", async () => {
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
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-22T00:00:00.000Z",
        entries: {
          building_registry: {
            apiId: "building_registry",
            source: "public_candidate",
            status: "candidate",
            trustedForPdf: false,
            data: { area: 84.13, building_purpose: "住家用" },
          },
          building_ownership: {
            apiId: "building_ownership",
            source: "raw_probe",
            status: "probe",
            trustedForPdf: false,
            data: { owner_name: "不可信來源" },
          },
        },
      },
    });

    expect(result.buildingArea).toBeUndefined();
    expect(result.buildingPurpose).toBeUndefined();
    expect(result.propertySheet?.owner).toBe("王建國");
  });

  it("selected candidate fills pre-survey property sheet with mandatory warning", async () => {
    mockInvoke.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      if (cmd === "fetch_location_map") {
        expect(args).toMatchObject({ lat: 22.986314, lng: 120.22908 });
        return [0x89, 0x50, 0x4e, 0x47];
      }
      if (cmd === "fetch_aerial_photo") {
        expect(args).toMatchObject({ lat: 22.986314, lng: 120.22908 });
        return [0x89, 0x50, 0x4e, 0x47, 1];
      }
      if (cmd === "fetch_street_view") return [];
      return {};
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      case_name: "裕農路物調驗收",
      case_no: "AIRE-YUNONG-20260523",
      address: "台南市東區裕農路288巷17號8樓之1",
      owner_name: "余啟彰",
      land_lot_no: "0001",
      land_lots: ["0001"],
      building_lot_no: null,
      land_registry_data: candidateRegistryPayload(),
    });

    expect(result.propertySheet?.landSection).toBe("富強段");
    expect(result.propertySheet?.landNumber).toBe("00700000");
    expect(result.propertySheet?.zoning).toBe("住宅區");
    expect(result.propertySheet?.landArea).toBe(120.5);
    expect(result.propertySheet?.registeredArea).toBe(31.25);
    expect(result.propertySheet?.mainBuildingArea).toBe(23.1);
    expect(result.propertySheet?.legalUse).toBe("住家用");
    expect(result.propertySheet?.constructionDate).toBe("民國083年10月18日");
    expect(result.propertySheet?.floor).toBe("8樓之1");
    expect(result.propertySheet?.buildingAge).toBeTruthy();
    expect(result.propertySheet?.acquisitionDate).toBe("");
    expect(result.buildingArea).toBeCloseTo(103.31, 2);
    expect(result.buildingPurpose).toBe("住家用");
    expect(result.constructionDate).toBe("民國083年10月18日");
    expect(result.buildingCertificateNo).toBeUndefined();
    expect(result.buildingOwnershipDate).toBeUndefined();
    expect(result.mortgages).toBeUndefined();
    expect(result.propertySheetSources).toMatchObject({
      registeredArea: "候選資料，待屋主/權狀確認",
      mainBuildingArea: "候選資料，待屋主/權狀確認",
      legalUse: "候選資料，待屋主/權狀確認",
      constructionDate: "候選資料，待屋主/權狀確認",
      floor: "候選資料，待屋主/權狀確認",
    });
    expect(result.preSurvey?.candidateDisclaimer).toBe(
      "地政資料，最終以正式謄本為主；本說明書不代表完整資訊。",
    );
    expect(result.preSurvey?.candidateOptions?.map((candidate) => candidate.normalized_parcel_id)).toEqual([
      "DC-1556-00700000",
      "DC-1556-00165000",
      "DC-1556-00167000",
    ]);
    expect(result.locationMapImage?.length).toBeGreaterThan(0);
    expect(result.aerialPhoto?.length).toBeGreaterThan(0);
  });

  it("single R02 building candidate fills pre-survey PDF fields without formal COP cost", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      if (cmd === "land_registry_pull_data") {
        throw new Error("PDF assembly must not run formal COP for R02 candidate data");
      }
      return {};
    });

    const payload = candidateRegistryPayload();
    const result = await assembleDossierData({
      ...buildingCaseRow,
      address: "台南市東區東和路47號3樓",
      land_registry_data: {
        ...payload,
        selected_candidate_ids: undefined,
        candidate_options: payload.candidate_options?.filter(
          (candidate) => candidate.parcel_type === "land" || candidate.normalized_parcel_id === "DC-1556-00165000",
        ),
      },
    });

    expect(result.propertySheet?.registeredArea).toBe(31.25);
    expect(result.propertySheet?.mainBuildingArea).toBe(23.1);
    expect(result.propertySheet?.legalUse).toBe("住家用");
    expect(result.propertySheet?.constructionDate).toBe("民國083年10月18日");
    expect(result.propertySheet?.floor).toBe("8樓之1");
    expect(result.propertySheet?.buildingAge).toBeTruthy();
    expect(result.preSurvey?.lookupCost).toBe(0);
    expect(result.propertySheetSources).toMatchObject({
      registeredArea: "候選資料，待屋主/權狀確認",
      legalUse: "候選資料，待屋主/權狀確認",
      constructionDate: "候選資料，待屋主/權狀確認",
      floor: "候選資料，待屋主/權狀確認",
    });
  });

  it("uses web image routes when local Web has coordinates but desktop image commands return no bytes", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      if (cmd === "fetch_location_map" || cmd === "fetch_aerial_photo" || cmd === "fetch_street_view") {
        return [];
      }
      if (cmd === "land_registry_pull_data") {
        throw new Error("PDF assembly must not run formal COP for R02 candidate data");
      }
      return {};
    });
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("overpass-api.de")) {
        return Response.json({ elements: [] });
      }
      if (url.includes("/api/location-map")) {
        return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer, { status: 200 });
      }
      if (url.includes("/api/aerial-photo")) {
        return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1]).buffer, { status: 200 });
      }
      if (url.includes("/api/street-view")) {
        return new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer, { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await assembleDossierData({
      ...buildingCaseRow,
      address: "台南市東區東和路47號3樓",
      land_registry_data: candidateRegistryPayload(),
    });

    expect(result.locationMapImage?.length).toBeGreaterThan(0);
    expect(result.aerialPhoto?.length).toBeGreaterThan(0);
    expect(result.exteriorPhoto?.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/location-map"), expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/aerial-photo"), expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/street-view"), expect.any(Object));
  });

  it("trusted registry data overrides selected candidate values", async () => {
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
        ...candidateRegistryPayload(),
        entries: {
          building_registry: {
            apiId: "building_registry",
            source: "moi_api",
            status: "success",
            trustedForPdf: true,
            data: {
              area: 108.43,
              main_building_area: 82.64,
              building_purpose: "住家用",
              construction_date: "083/10/18",
            },
          },
        },
      },
    });

    expect(result.propertySheet?.registeredArea).toBe(32.8);
    expect(result.propertySheet?.mainBuildingArea).toBe(25);
    expect(result.propertySheetSources?.registeredArea).toBeUndefined();
  });

  it("same-suffix reference estimates fill fields when no selected candidate exists", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      return {};
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      address: "台南市東區裕農路288巷17號8樓之1",
      land_lot_no: "0001",
      land_lots: ["0001"],
      building_lot_no: null,
      land_registry_data: {
        ...candidateRegistryPayload(),
        selected_candidate_ids: {},
        inferred_reference: {
          target_unit: "8樓之1",
          basis: "same_suffix_vertical_stack",
          confidence: "high",
          source_units: ["3樓之1", "5樓之1", "7樓之1"],
          estimated_fields: {
            registeredAreaPing: 31.25,
            mainBuildingAreaPing: 23.1,
            auxiliaryAreaPing: 2.1,
            commonAreaPing: 6.05,
            parkingAreaPing: 0,
            legalUse: "住家用",
            constructionDate: "083/10/18",
            material: "鋼筋混凝土造",
            floor: "8樓之1",
            ownershipScope: "全部 1/1",
            landOwnershipRatio: "91/10000",
          },
          warning: "推測資料，非登記資料；地政資料，最終以正式謄本為主；本說明書不代表完整資訊。",
        },
      },
    });

    expect(result.propertySheet?.registeredArea).toBe(31.25);
    expect(result.propertySheet?.mainBuildingArea).toBe(23.1);
    expect(result.propertySheet?.auxiliaryArea).toBe(2.1);
    expect(result.propertySheet?.commonArea).toBe(6.05);
    expect(result.propertySheet?.parkingArea).toBe(0);
    expect(result.propertySheet?.legalUse).toBe("住家用");
    expect(result.propertySheet?.material).toBe("鋼筋混凝土造");
    expect(result.propertySheet?.constructionDate).toBe("民國083年10月18日");
    expect(result.propertySheet?.ownershipRatio).toBe("91/10000");
    expect(result.propertySheet?.shareArea).toBe(1.1);
    expect(result.propertySheet?.acquisitionDate).toBe("");
    expect(result.buildingCertificateNo).toBeUndefined();
    expect(result.buildingOwnershipDate).toBeUndefined();
    expect(result.mortgages).toBeUndefined();
    expect(result.propertySheetSources).toMatchObject({
      registeredArea: "推測資料，非登記資料",
      mainBuildingArea: "推測資料，非登記資料",
      auxiliaryArea: "推測資料，非登記資料",
      commonArea: "推測資料，非登記資料",
      parkingArea: "推測資料，非登記資料",
      legalUse: "推測資料，非登記資料",
      material: "推測資料，非登記資料",
      constructionDate: "推測資料，非登記資料",
      ownershipRatio: "推測資料，非登記資料",
      shareArea: "推測資料，非登記資料",
    });
    expect(result.preSurvey?.inferredReference?.source_units).toEqual(["3樓之1", "5樓之1", "7樓之1"]);
    expect(result.preSurvey?.candidateDisclaimer).toBe(
      "地政資料，最終以正式謄本為主；本說明書不代表完整資訊。",
    );
  });

  it("只有 candidate/failed provenance 且有屋主姓名時，PDF assembly 不會重新打正式查詢", async () => {
    mockInvoke.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      if (cmd === "update_case") return {};
      if (cmd === "land_registry_pull_data") {
        throw new Error("PDF assembly must use saved registry data only");
      }
      return {};
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-22T00:00:00.000Z",
        entries: {
          building_registry: {
            apiId: "building_registry",
            source: "public_candidate",
            status: "candidate",
            trustedForPdf: false,
            data: { area: 84.13 },
          },
          building_ownership: {
            apiId: "building_ownership",
            source: "moi_api",
            status: "failed",
            trustedForPdf: false,
            error: "尚未取得正式建物所有權資料",
          },
        },
      },
    });

    expect(mockInvoke).not.toHaveBeenCalledWith("land_registry_pull_data", expect.anything());
    expect(result.buildingArea).toBeUndefined();
    expect(result.propertySheet?.landSection).toBe("");
    expect(result.propertySheet?.zoning).toBe("");
    expect(mockInvoke).not.toHaveBeenCalledWith("update_case", expect.anything());
  });

  it("地址候選只有 placeholder 地號且無建號時，不用 0001 進正式 pull", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      if (cmd === "land_registry_pull_data") {
        throw new Error("land_registry_pull_data should not be called with placeholder parcel id");
      }
      return {};
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      land_lot_no: "0001",
      land_lots: ["0001"],
      building_lot_no: null,
      owner_name: "王建國",
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-22T00:00:00.000Z",
        entries: {
          building_registry: {
            apiId: "building_registry",
            source: "public_candidate",
            status: "candidate",
            trustedForPdf: false,
            data: { building_number: "0001", lot_number: "0001" },
          },
          building_ownership: {
            apiId: "building_ownership",
            source: "moi_api",
            status: "failed",
            trustedForPdf: false,
            error: "尚未取得正式建物所有權資料",
          },
        },
      },
    });

    expect(result.buildingArea).toBeUndefined();
    expect(result.propertySheet?.landNumber).toBe("0001");
    expect(mockInvoke).not.toHaveBeenCalledWith(
      "land_registry_pull_data",
      expect.objectContaining({ parcelId: "0001" }),
    );
  });

  it("建物案件正式 pull 會包含土地、分區與地價資料鏈", async () => {
    mockInvoke.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      if (cmd === "land_registry_pull_data") {
        expect(args?.apiIds).toEqual(
          expect.arrayContaining([
            "building_registry",
            "building_ownership",
            "mortgages",
            "land_registry",
            "zoning",
            "land_value",
          ]),
        );
        return { results: {}, total_cost: 0 };
      }
      return {};
    });

    await assembleDossierData({
      ...buildingCaseRow,
      land_registry_data: null,
    });
  });

  it("物調表 PDF assembly 保留本次費用與查詢失敗原因", async () => {
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
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-22T00:00:00.000Z",
        totalCost: 0,
        entries: {
          building_ownership: {
            apiId: "building_ownership",
            source: "moi_api",
            status: "failed",
            trustedForPdf: false,
            error: "授權不足，請補授權或改由屋主提供謄本",
          },
        },
      },
    });

    expect(result.preSurvey).toEqual({
      lookupCost: 0,
      failureReasons: [
        {
          apiId: "building_ownership",
          status: "failed",
          reason: "授權不足，請補授權或改由屋主提供謄本",
        },
      ],
    });
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

    const result = await assembleDossierData({
      ...landCaseRow,
      land_registry_data: savedRegistryPayloadFromPullResult(mockPullResultLand, {
        zoning: { source: "api", data: { zoning_type: "未知特殊分區X", usage_category: "" } },
      }),
    });
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
        zoning: { source: "api", data: { zoning_type: "住宅區", usage_category: "乙種住宅用地" } },
      },
    };

    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "land_registry_pull_data") return pullWithKnownZoning;
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      throw new Error(`Unexpected: ${cmd}`);
    });

    const result = await assembleDossierData({
      ...landCaseRow,
      land_registry_data: savedRegistryPayloadFromPullResult(pullWithKnownZoning),
    });
    expect(result.soilConservation).toBe(ZONING_RESTRICTIONS["住宅區"].soilConservation);
    expect(result.buildingLineNote).toBe(ZONING_RESTRICTIONS["住宅區"].buildingLineNote);
  });

  it("(d) 未知 zoningType 回傳 '依主管機關規定辦理'", async () => {
    const pullWithUnknownZoning = {
      ...mockPullResultLand,
      results: {
        ...mockPullResultLand.results,
        zoning: { source: "api", data: { zoning_type: "未知特殊分區X", usage_category: "" } },
      },
    };

    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "land_registry_pull_data") return pullWithUnknownZoning;
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      throw new Error(`Unexpected: ${cmd}`);
    });

    const result = await assembleDossierData({
      ...landCaseRow,
      land_registry_data: savedRegistryPayloadFromPullResult(pullWithUnknownZoning),
    });
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

  it("固定交付資訊完整回填 PDF 封面欄位", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") {
        return {
          agent_name: "余啟彰",
          realtor_name: "王經紀",
          agent_cert_no: "經紀人字第123456號",
          company_name: "大安不動產經紀有限公司",
          company_license_no: "經紀業字第654321號",
          company_address: "台南市永康區勝利街58巷4號",
          company_phone: "06-1234567",
        };
      }
      if (cmd === "land_registry_pull_data") return mockPullResultLand;
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      throw new Error(`Unexpected invoke: ${cmd}`);
    });

    const result = await assembleDossierData(landCaseRow);

    expect(result.cover).toMatchObject({
      handlingAgent: "余啟彰",
      licensedAgentName: "王經紀",
      licensedAgentCertNo: "經紀人字第123456號",
      brokerageCompanyName: "大安不動產經紀有限公司",
      brokerageLicenseNo: "經紀業字第654321號",
      companyAddress: "台南市永康區勝利街58巷4號",
      companyPhone: "06-1234567",
    });
  });

  it("browser mock 設定頁 storage 也會回填 PDF 封面欄位", async () => {
    window.localStorage.setItem(
      "aire-mock-store",
      JSON.stringify({
        branding: {
          agentName: "王承辦",
          realtorName: "陳經紀",
          agentCertNo: "南市經紀人字第 000001 號",
          companyName: "裕農安居不動產經紀有限公司",
          companyLicenseNo: "南市經紀業字第 000001 號",
          companyAddress: "台南市東區裕農路1號",
          companyPhone: "06-123-4567",
        },
      }),
    );
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "land_registry_pull_data") return mockPullResultLand;
      if (cmd === "get_legal_clause") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      if (cmd === "query_real_price") return [];
      throw new Error(`Unexpected invoke: ${cmd}`);
    });

    const result = await assembleDossierData(landCaseRow);

    expect(result.cover).toMatchObject({
      handlingAgent: "王承辦",
      licensedAgentName: "陳經紀",
      licensedAgentCertNo: "南市經紀人字第 000001 號",
      brokerageCompanyName: "裕農安居不動產經紀有限公司",
      brokerageLicenseNo: "南市經紀業字第 000001 號",
      companyAddress: "台南市東區裕農路1號",
      companyPhone: "06-123-4567",
    });
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
  it("建物 PDF 優先使用目前案件的建物外觀補件，不改用自動街景", async () => {
    const calls: Array<{ cmd: string; args: Record<string, unknown> | undefined }> = [];
    mockInvoke.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
      calls.push({ cmd, args });
      if (cmd === "list_case_assets") {
        if (args?.kind === "exterior_photo") {
          return [{ id: "asset-exterior", is_primary: true, review_status: "approved" }];
        }
        return [];
      }
      if (cmd === "read_case_asset_bytes") {
        if (args?.asset_id === "asset-exterior") return { bytes: [7, 7, 7], mime: "image/png" };
      }
      if (cmd === "fetch_street_view") {
        throw new Error("fetch_street_view should not be called when exterior_photo asset exists");
      }
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "land_registry_pull_data") return { results: {}, total_cost: 0 };
      if (cmd === "get_legal_clause") return [];
      if (cmd === "query_real_price") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      return {};
    });

    const result = await assembleDossierData({
      ...buildingCaseRow,
      land_registry_data: trustedRegistryPayload({
        building_registry: { lat: 25.01, lng: 121.46 },
      }),
    });

    expect(result.exteriorPhoto).toEqual(new Uint8Array([7, 7, 7]));
    expect(calls).toEqual(
      expect.arrayContaining([
        { cmd: "list_case_assets", args: { case_id: buildingCaseRow.id, kind: "exterior_photo" } },
      ]),
    );
    expect(calls.map((call) => call.cmd)).not.toContain("fetch_street_view");
  });

  it("土地 PDF 優先使用目前案件的補件圖資，不改打地政或地圖 API", async () => {
    const calls: Array<{ cmd: string; args: Record<string, unknown> | undefined }> = [];
    mockInvoke.mockImplementation(async (cmd: string, args?: Record<string, unknown>) => {
      calls.push({ cmd, args });
      if (cmd === "list_case_assets") {
        if (args?.kind === "location_map") {
          return [{ id: "asset-location", is_primary: true, review_status: "approved" }];
        }
        if (args?.kind === "surrounding_map") {
          return [{ id: "asset-aerial", is_primary: true, review_status: "approved" }];
        }
        if (args?.kind === "floor_plan") {
          return [{ id: "asset-plan", is_primary: true, review_status: "approved" }];
        }
        return [];
      }
      if (cmd === "read_case_asset_bytes") {
        if (args?.asset_id === "asset-location") return { bytes: [4, 4, 4], mime: "image/png" };
        if (args?.asset_id === "asset-aerial") return { bytes: [5, 5, 5], mime: "image/png" };
        if (args?.asset_id === "asset-plan") return { bytes: [6, 6, 6], mime: "image/png" };
      }
      if (cmd === "fetch_location_map" || cmd === "fetch_aerial_photo" || cmd === "land_registry_pull_data") {
        throw new Error(`${cmd} should not be called when case-owned assets exist`);
      }
      if (cmd === "get_brand_text_settings") return {};
      if (cmd === "get_legal_clause") return [];
      if (cmd === "query_real_price") return [];
      if (cmd === "list_floor_plan_conversion_history") return { sketches: [], conversions: [] };
      return {};
    });

    const result = await assembleDossierData({
      ...landCaseRow,
      land_registry_data: trustedRegistryPayload({
        land_registry: {
          area: 250.5,
          purpose: "田",
          section: "板橋段",
          lot_number: "88-1",
          lat: 25.01,
          lng: 121.46,
        },
      }),
    });

    expect(result.propertyType).toBe("land");
    expect(result.propertySheet?.landSection).toBe("板橋段");
    expect(result.propertySheet?.landNumber).toBe("板橋段88-1");
    expect(result.locationMapImage).toEqual(new Uint8Array([4, 4, 4]));
    expect(result.aerialPhoto).toEqual(new Uint8Array([5, 5, 5]));
    expect(result.floorPlanPhoto).toEqual(new Uint8Array([6, 6, 6]));
    expect(calls).toEqual(
      expect.arrayContaining([
        { cmd: "list_case_assets", args: { case_id: landCaseRow.id, kind: "location_map" } },
        { cmd: "list_case_assets", args: { case_id: landCaseRow.id, kind: "surrounding_map" } },
        { cmd: "list_case_assets", args: { case_id: landCaseRow.id, kind: "floor_plan" } },
      ]),
    );
    expect(calls.map((call) => call.cmd)).not.toContain("land_registry_pull_data");
    expect(calls.map((call) => call.cmd)).not.toContain("fetch_location_map");
    expect(calls.map((call) => call.cmd)).not.toContain("fetch_aerial_photo");
  });

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
