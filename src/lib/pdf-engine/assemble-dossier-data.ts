import { safeInvoke as invoke } from "@/lib/tauri-bridge";
import type { CaseRow } from "@/lib/cases-api";
import type { CaseDossierData } from "./document";
import { calculateTaxFees } from "@/lib/tax-calculator";
import { queryNearbyAmenities } from "@/lib/overpass-client";

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
  let transactionHistory: CaseDossierData["transactionHistory"] = [];
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

  const persisted = caseRow.land_registry_data;
  let apiData: Record<string, { data: unknown }> = {};
  if (persisted && typeof persisted === "object" && !Array.isArray(persisted)) {
    // 兼容兩種格式：{ apiId: { data } } 與 { apiId: rawData }
    apiData = Object.fromEntries(
      Object.entries(persisted).map(([apiId, value]) => {
        const wrapped =
          value && typeof value === "object" && "data" in (value as Record<string, unknown>)
            ? (value as { data: unknown })
            : { data: value };
        return [apiId, wrapped];
      }),
    );
  } else {
    let pullResult: PullResult | undefined;
    try {
      pullResult = await invoke<PullResult>("land_registry_pull_data", {
        parcelId: caseRow.land_lot_no,
        apiIds,
      });
    } catch {
      // 組裝層捕捉錯誤，API 欄位降級為 undefined
    }
    apiData = pullResult?.results ?? {};
  }

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
    transactionHistory = Array.isArray(records) ? records.map((r) => {
      const rec = r as Record<string, unknown>;
      return {
        address: typeof rec.address === "string" ? rec.address : "",
        areaPing: typeof rec.area === "number" ? rec.area : 0,
        totalPrice: typeof rec.total_price === "number" ? rec.total_price : 0,
        unitPrice: typeof rec.unit_price === "number" ? rec.unit_price : 0,
        transactionDate: typeof rec.transaction_date === "string" ? rec.transaction_date : "",
      };
    }) : [];
    recentSalePricePerSqm = stats.avg;
    recentSaleCount = stats.count;
  } catch {
    // 失敗時欄位為 undefined
  }

  // ── 周邊設施（Overpass API）─────────────────────────────────────────────────

  let nearbyAmenities: CaseDossierData["nearbyAmenities"] = [];
  const geoLat = safeGet(
    apiData["land_registry"]?.data ?? apiData["building_registry"]?.data,
    "lat", isNumber,
  );
  const geoLng = safeGet(
    apiData["land_registry"]?.data ?? apiData["building_registry"]?.data,
    "lng", isNumber,
  );
  let locationMapImage: Uint8Array | null = null;
  if (geoLat && geoLng) {
    try {
      nearbyAmenities = await queryNearbyAmenities({ lat: geoLat, lng: geoLng, radiusM: 1000 });
    } catch {
      // 失敗維持空陣列
    }
    try {
      const pngBytes = await safeInvoke<number[]>("fetch_location_map", {
        lat: geoLat,
        lng: geoLng,
        zoom: 16,
        size: "500x400",
      });
      if (pngBytes && pngBytes.length > 0) {
        locationMapImage = new Uint8Array(pngBytes);
      }
    } catch {
      // Tauri IPC 失敗（瀏覽器 dev 模式）→ 維持 null，元件顯示佔位
    }
  }

  // ── 映射 ──────────────────────────────────────────────────────────────────

  if (isLand) {
    const landReg = apiData["land_registry"]?.data;
    const zoning = apiData["zoning"]?.data;
    const landValue = apiData["land_value"]?.data;
    const mortgagesRaw = apiData["mortgages"]?.data;
    const dossierPreview = apiData["dossier_preview"]?.data;

    const zoningType = safeGet(zoning, "zoning_type", isString);
    const restrictions = getZoningRestrictions(zoningType);

    const mortgages = Array.isArray(mortgagesRaw)
      ? (mortgagesRaw as unknown[]).map((m) => ({
          creditor: safeGet(m, "creditor", isString) ?? "",
          amount: safeGet(m, "amount", isNumber) ?? 0,
        }))
      : undefined;

    base.locationMapImage = locationMapImage;
    // Wave 6：外觀圖（由業務從 UI 上傳，assemble 不處理）
    base.exteriorPhoto = null;

    // ── 稅費試算（土地）──────────────────────────────────────────────────────
    const landAskingPrice = 0; // 使用者尚未輸入時預設 0
    const landAnnouncedValue = safeGet(landValue, "announced_value", isNumber) ?? 0;
    const landAreaVal = safeGet(landReg, "area", isNumber) ?? 0;
    if (landAnnouncedValue > 0 && landAreaVal > 0) {
      base.taxCalculation = calculateTaxFees({
        totalPrice: landAskingPrice,
        announcedLandValue: landAnnouncedValue,
        landArea: landAreaVal,
        shareRatio: 1,
        holdingYears: 1,
        isFirstSale: false,
        propertyType: "land",
      });
    } else {
      base.taxCalculation = null;
    }

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
      transactionHistory,
      nearbyAmenities,
      legalClauses,
      cover: {
        propertyName: caseRow.address ?? "",
        caseNumber: caseRow.case_no ?? caseRow.id.slice(0, 8),
        handlingAgent: caseRow.owner_name ?? "",
        licensedAgentName: "",
        licensedAgentCertNo: "",
        brokerageCompanyName: "",
        brokerageLicenseNo: "",
        companyAddress: "",
        companyPhone: "",
      },
      propertySheet: {
        askingPrice: 0,
        landSection: safeGet(landReg, "section", isString) ?? "",
        landNumber: caseRow.land_lot_no ?? "",
        zoning: safeGet(zoning, "zoning_type", isString) ?? "",
        landArea: safeGet(landReg, "area", isNumber) ?? 0,
        ownershipRatio: "",
        shareArea: 0,
        buildingCoverage: safeGet(dossierPreview, "building_coverage_ratio", isString) ?? "",
        floorAreaRatio: safeGet(dossierPreview, "floor_area_ratio", isString) ?? "",
        owner: caseRow.owner_name ?? "",
        acquisitionDate: "",
      },
      restrictionRegistration: safeGet(dossierPreview, "restriction_registration", isString),
      trustRegistration: safeGet(dossierPreview, "trust_registration", isString),
      cautionRegistration: safeGet(dossierPreview, "caution_registration", isString),
      otherRightsDetail: safeGet(dossierPreview, "other_rights_detail", isString),
      currentRentalStatus: safeGet(dossierPreview, "current_rental_status", isString),
      currentOccupation: safeGet(dossierPreview, "current_occupation", isString),
      sharedManagement: safeGet(dossierPreview, "shared_management", isString),
      existingRoad: safeGet(dossierPreview, "existing_road", isString),
      otherUsageStatus: safeGet(dossierPreview, "other_usage_status", isString),
      urbanPlanZone: safeGet(dossierPreview, "urban_plan_zone", isString) ?? zoningType,
      nonUrbanLandCategory:
        safeGet(dossierPreview, "non_urban_land_category", isString) ??
        safeGet(zoning, "usage_category", isString),
      floorAreaRatio: safeGet(dossierPreview, "floor_area_ratio", isString),
      buildingCoverageRatio: safeGet(dossierPreview, "building_coverage_ratio", isString),
      specialDesignatedArea: safeGet(dossierPreview, "special_designated_area", isString),
      transactionTotalPrice: safeGet(dossierPreview, "transaction_total_price", isString),
      paymentMethod: safeGet(dossierPreview, "payment_method", isString),
      taxBurdenAgreement: safeGet(dossierPreview, "tax_burden_agreement", isString),
      penaltyClause: safeGet(dossierPreview, "penalty_clause", isString),
      environmentalImpact: safeGet(dossierPreview, "environmental_impact", isString),
      majorIncident: safeGet(dossierPreview, "major_incident", isString),
      nearbyPublicFacilities: safeGet(dossierPreview, "nearby_public_facilities", isString),
      surroundingTransactionPrice: safeGet(
        dossierPreview,
        "surrounding_transaction_price",
        isString,
      ),
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

    base.locationMapImage = locationMapImage;
    // Wave 6：外觀圖（由業務從 UI 上傳，assemble 不處理）
    base.exteriorPhoto = null;

    // ── 稅費試算（建物）──────────────────────────────────────────────────────
    base.taxCalculation = null; // 建物版：askingPrice 未填前為 null

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
      transactionHistory,
      nearbyAmenities,
      legalClauses,
      cover: {
        propertyName: caseRow.address ?? "",
        caseNumber: caseRow.case_no ?? caseRow.id.slice(0, 8),
        handlingAgent: caseRow.owner_name ?? "",
        licensedAgentName: "",
        licensedAgentCertNo: "",
        brokerageCompanyName: "",
        brokerageLicenseNo: "",
        companyAddress: "",
        companyPhone: "",
      },
      propertySheet: {
        askingPrice: 0,
        landSection: "",
        landNumber: caseRow.land_lot_no ?? "",
        zoning: "",
        landArea: 0,
        ownershipRatio: "",
        shareArea: 0,
        buildingCoverage: "",
        floorAreaRatio: "",
        owner: caseRow.owner_name ?? "",
        acquisitionDate: safeGet(buildingOwnership, "ownership_date", isString) ?? "",
        registeredArea: safeGet(buildingReg, "area", isNumber),
        mainBuildingArea: safeGet(buildingReg, "main_building_area", isNumber),
        auxiliaryArea: safeGet(buildingReg, "auxiliary_area", isNumber),
        commonArea: safeGet(buildingReg, "common_area", isNumber),
        parkingArea: safeGet(buildingReg, "parking_area", isNumber),
        constructionCompany: safeGet(buildingReg, "construction_company", isString),
      },
      buildingAreaBreakdown: {
        main: safeGet(buildingReg, "main_building_area", isNumber) ?? 0,
        auxiliary: safeGet(buildingReg, "auxiliary_area", isNumber) ?? 0,
        common: safeGet(buildingReg, "common_area", isNumber) ?? 0,
        parking: safeGet(buildingReg, "parking_area", isNumber) ?? 0,
      },
    };
  }
}
