import { invoke } from "@tauri-apps/api/core";
import type { CaseRow } from "@/lib/cases-api";
import type { CaseDossierData } from "./document";

// ─────────────────────────────────────────────────────────────────────────────
// 使用分區 → 法規限制 lookup table
// ─────────────────────────────────────────────────────────────────────────────

export const ZONING_RESTRICTIONS: Record<
  string,
  { soilConservation: string; buildingLineNote: string }
> = {
  住宅區: {
    soilConservation: "無特別限制",
    buildingLineNote: "依都市計畫法申請建築線",
  },
  商業區: {
    soilConservation: "無特別限制",
    buildingLineNote: "依都市計畫法申請建築線，須符合商業區退縮規定",
  },
  工業區: {
    soilConservation: "依工廠管理輔導法規範",
    buildingLineNote: "依都市計畫工業區相關規定辦理",
  },
  農業區: {
    soilConservation: "受水土保持法規範，申請開發須送審",
    buildingLineNote: "依農業用地相關規定辦理",
  },
  保護區: {
    soilConservation: "禁止開發，限自用農舍",
    buildingLineNote: "不得申請建築線指定",
  },
};

const ZONING_FALLBACK = "依主管機關規定辦理";

function getZoningRestrictions(zoningType?: string) {
  if (!zoningType) return { soilConservation: undefined, buildingLineNote: undefined };
  const entry = ZONING_RESTRICTIONS[zoningType];
  if (!entry)
    return {
      soilConservation: ZONING_FALLBACK,
      buildingLineNote: ZONING_FALLBACK,
    };
  return entry;
}

// ─────────────────────────────────────────────────────────────────────────────
// 計算近期成交統計
// ─────────────────────────────────────────────────────────────────────────────

export function computeRecentSaleStats(records: unknown[]): {
  avg: number | undefined;
  count: number;
} {
  if (!Array.isArray(records) || records.length === 0) {
    return { avg: undefined, count: 0 };
  }

  const prices: number[] = [];
  for (const rec of records) {
    const price = (rec as Record<string, unknown>)?.unit_price;
    if (typeof price === "number" && isFinite(price)) {
      prices.push(price);
    }
  }

  if (prices.length === 0) return { avg: undefined, count: 0 };

  const sum = prices.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / prices.length);
  return { avg, count: prices.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// 從地址萃取行政區
// ─────────────────────────────────────────────────────────────────────────────

function extractDistrict(address: string): string {
  // 台灣地址格式：縣市 + 鄉鎮市區，取前 6 字（含縣市+區）
  const match = address.match(/^(.{2,3}[縣市])(.{2,3}[鄉鎮市區])/);
  if (match) return `${match[1]}${match[2]}`;
  return address.slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// 安全取 JSON 欄位
// ─────────────────────────────────────────────────────────────────────────────

function safeGet<T>(
  obj: unknown,
  key: string,
  guard: (v: unknown) => v is T,
): T | undefined {
  const val = (obj as Record<string, unknown>)?.[key];
  return guard(val) ? val : undefined;
}

const isNumber = (v: unknown): v is number => typeof v === "number" && isFinite(v);
const isString = (v: unknown): v is string => typeof v === "string";

// ─────────────────────────────────────────────────────────────────────────────
// assembleDossierData
// ─────────────────────────────────────────────────────────────────────────────

export async function assembleDossierData(caseRow: CaseRow): Promise<CaseDossierData> {
  const isLand = caseRow.property_type === "land";
  const base: CaseDossierData = {
    caseNo: caseRow.case_no ?? caseRow.id.slice(0, 8),
    address: caseRow.address ?? "",
    propertyType: isLand ? "land" : "building",
    landLotNo: caseRow.land_lot_no ?? "",
    ownerName: caseRow.owner_name ?? "",
    companyName: "",
    generatedAt: new Date().toLocaleDateString("zh-TW"),
  };

  // ── 地政 API ──────────────────────────────────────────────────────────────

  const apiIds = isLand
    ? ["land_registry", "zoning", "land_value", "mortgages"]
    : ["building_registry", "building_ownership", "mortgages"];

  type PullResult = {
    results: Record<string, { data: unknown }>;
    total_cost: number;
  };

  let pullResult: PullResult | undefined;
  try {
    pullResult = await invoke<PullResult>("land_registry_pull_data", {
      parcelId: caseRow.land_lot_no,
      apiIds,
    });
  } catch {
    // 組裝層捕捉錯誤，API 欄位降級為 undefined
  }

  const apiData = pullResult?.results ?? {};

  // ── 法規條文 ──────────────────────────────────────────────────────────────

  let legalClauses: string[] = [];
  try {
    const clauses = await invoke<string[]>("get_legal_clause");
    if (Array.isArray(clauses)) legalClauses = clauses;
  } catch {
    // 失敗時回退至空陣列
  }

  // ── 實價登錄 ─────────────────────────────────────────────────────────────

  let recentSalePricePerSqm: number | undefined;
  let recentSaleCount: number | undefined;
  try {
    const keyword = isLand ? caseRow.land_lot_no : (caseRow.address ?? "");
    const records = await invoke<unknown[]>("query_real_price", {
      district: extractDistrict(caseRow.address ?? ""),
      keyword,
      limit: 5,
    });
    const stats = computeRecentSaleStats(Array.isArray(records) ? records : []);
    recentSalePricePerSqm = stats.avg;
    recentSaleCount = stats.count;
  } catch {
    // 失敗時欄位為 undefined
  }

  // ── 映射 ──────────────────────────────────────────────────────────────────

  if (isLand) {
    const landReg = apiData["land_registry"]?.data;
    const zoning = apiData["zoning"]?.data;
    const landValue = apiData["land_value"]?.data;
    const mortgagesRaw = apiData["mortgages"]?.data;

    const zoningType = safeGet(zoning, "zoning_type", isString);
    const restrictions = getZoningRestrictions(zoningType);

    const mortgages = Array.isArray(mortgagesRaw)
      ? (mortgagesRaw as unknown[]).map((m) => ({
          creditor: safeGet(m, "creditor", isString) ?? "",
          amount: safeGet(m, "amount", isNumber) ?? 0,
        }))
      : undefined;

    return {
      ...base,
      landArea: safeGet(landReg, "area", isNumber),
      landPurpose: safeGet(landReg, "purpose", isString),
      zoningType,
      usageCategory: safeGet(zoning, "usage_category", isString),
      soilConservation: restrictions.soilConservation,
      buildingLineNote: restrictions.buildingLineNote,
      announcedLandValue: safeGet(landValue, "announced_value", isNumber),
      assessedLandValue: safeGet(landValue, "assessed_value", isNumber),
      mortgages,
      recentSalePricePerSqm,
      recentSaleCount,
      legalClauses,
    };
  } else {
    const buildingReg = apiData["building_registry"]?.data;
    const buildingOwnership = apiData["building_ownership"]?.data;
    const mortgagesRaw = apiData["mortgages"]?.data;

    const mortgages = Array.isArray(mortgagesRaw)
      ? (mortgagesRaw as unknown[]).map((m) => ({
          creditor: safeGet(m, "creditor", isString) ?? "",
          amount: safeGet(m, "amount", isNumber) ?? 0,
        }))
      : undefined;

    return {
      ...base,
      buildingArea: safeGet(buildingReg, "area", isNumber),
      buildingPurpose: safeGet(buildingReg, "purpose", isString),
      constructionDate: safeGet(buildingReg, "construction_date", isString),
      buildingCertificateNo: safeGet(buildingOwnership, "certificate_no", isString),
      buildingOwnershipDate: safeGet(buildingOwnership, "ownership_date", isString),
      mortgages,
      recentSalePricePerSqm,
      recentSaleCount,
      legalClauses,
    };
  }
}
