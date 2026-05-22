import { safeInvoke } from "@/lib/tauri-bridge";
import type { CaseRow } from "@/lib/cases-api";
import type { CaseDossierData } from "./document";
import { calculateTaxFees } from "@/lib/tax-calculator";
import { queryNearbyAmenities, summarizeNearbyAmenities } from "@/lib/overpass-client";
import { calculateBuildingAge } from "@/lib/registry-preview";

type SketchRow = { id: string; version: number; case_id: string };
type ConversionRow = { id: string; status: string; approved_at?: string; sketch_id: string };

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

function firstString(obj: unknown, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = safeGet(obj, key, isString);
    if (value) return value;
  }
  return undefined;
}

function firstNumber(obj: unknown, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = safeGet(obj, key, isNumber);
    if (typeof value === "number") return value;
    const raw = (obj as Record<string, unknown> | undefined)?.[key];
    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = Number(raw.replace(/,/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function firstText(obj: unknown, keys: string[]): string | undefined {
  for (const key of keys) {
    const record = obj as Record<string, unknown> | undefined;
    const value = record?.[key];
    if (typeof value === "string" && value.trim() !== "") return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function m2ToPing(value?: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value * 0.3025 * 100) / 100
    : undefined;
}

function ratioText(obj: unknown): string {
  const numerator = firstText(obj, ["NUMERATOR", "numerator"]);
  const denominator = firstText(obj, ["DENOMINATOR", "denominator"]);
  const direct = firstText(obj, ["RIGHT", "right", "ownership_scope", "right_scope"]);
  if (numerator && denominator) return `${numerator}/${denominator}`;
  return direct ?? "";
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary =
    typeof atob === "function"
      ? atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function readPersistedFloorPlanPhoto(persisted: unknown): Uint8Array | null {
  if (!persisted || typeof persisted !== "object" || Array.isArray(persisted)) return null;
  const photo = (persisted as Record<string, unknown>)["floor_plan_photo"];
  if (!photo || typeof photo !== "object" || Array.isArray(photo)) return null;
  const base64 = (photo as Record<string, unknown>)["base64"];
  if (typeof base64 !== "string" || base64.length === 0) return null;
  try {
    return base64ToUint8Array(base64);
  } catch {
    return null;
  }
}

async function readCaseAssetFloorPlan(caseId: string): Promise<Uint8Array | null> {
  try {
    const assets = await safeInvoke<
      Array<{ id: string; is_primary?: boolean; review_status?: string }>
    >("list_case_assets", {
      case_id: caseId,
      kind: "floor_plan",
    });
    const asset = assets.find((item) => item.is_primary && item.review_status === "approved")
      ?? assets.find((item) => item.review_status === "approved")
      ?? assets[0];
    if (!asset) return null;
    const result = await safeInvoke<{ bytes?: number[] | Uint8Array; mime?: string }>(
      "read_case_asset_bytes",
      { asset_id: asset.id },
    );
    if (result?.bytes && result.bytes.length > 0) {
      return new Uint8Array(result.bytes);
    }
  } catch {
    // 舊版 IPC 或檔案遺失時交給 legacy fallback。
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// assembleDossierData
// ─────────────────────────────────────────────────────────────────────────────

export async function assembleDossierData(caseRow: CaseRow): Promise<CaseDossierData> {
  let transactionHistory: CaseDossierData["transactionHistory"] = [];
  const isLand = caseRow.property_type === "land";

  let brandText: Record<string, string> = {};
  try {
    brandText = (await safeInvoke<Record<string, string>>("get_brand_text_settings")) ?? {};
  } catch { /* dev fallback */ }

  const base: CaseDossierData = {
    caseNo: caseRow.case_no ?? caseRow.id.slice(0, 8),
    address: caseRow.address ?? "",
    propertyType: isLand ? "land" : "building",
    landLotNo: caseRow.land_lot_no ?? "",
    ownerName: caseRow.owner_name ?? "",
    companyName: brandText.company_name ?? "",
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
      pullResult = await safeInvoke<PullResult>("land_registry_pull_data", {
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
    const clauses = await safeInvoke<string[]>("get_legal_clause");
    if (Array.isArray(clauses)) legalClauses = clauses;
  } catch {
    // 失敗時回退至空陣列
  }

  // ── 格局圖（現場手稿整理圖）───────────────────────────────────────────────

  let floorPlanPhoto: Uint8Array | null = null;
  floorPlanPhoto = await readCaseAssetFloorPlan(caseRow.id);
  if (!floorPlanPhoto) {
    floorPlanPhoto = readPersistedFloorPlanPhoto(caseRow.land_registry_data);
  }

  let fieldSketchFloorPlan: CaseDossierData["fieldSketchFloorPlan"] = undefined;
  try {
    const history = await safeInvoke<{ sketches: SketchRow[]; conversions: ConversionRow[] }>(
      "list_floor_plan_conversion_history",
      { case_id: caseRow.id },
    );
    const approvedConversion = history.conversions
      .filter((c: ConversionRow) => c.status === "approved")
      .sort((a: ConversionRow, b: ConversionRow) =>
        (b.approved_at ?? "").localeCompare(a.approved_at ?? ""),
      )[0];
    const sketchForConversion = history.sketches.find(
      (s: SketchRow) => s.id === approvedConversion?.sketch_id,
    );
    if (approvedConversion && sketchForConversion) {
      const svgResult = await safeInvoke<string>("render_floor_plan_conversion", {
        conversion_id: approvedConversion.id,
      });
      fieldSketchFloorPlan = {
        renderedSvg: svgResult,
        sourceLabel: "現場手稿整理圖",
        approvedAt: approvedConversion.approved_at ?? "",
        disclaimer:
          "本圖依現場手稿整理，供空間配置參考；實際面積、權利範圍、登記事項與法定用途，以地政謄本、權狀、主管機關資料及現場確認為準。",
        originalSketchVersion: sketchForConversion.version,
        conversionId: approvedConversion.id,
      };
    }
  } catch {
    // floor plan is optional, do not fail if unavailable
  }

  // ── 實價登錄 ─────────────────────────────────────────────────────────────

  let recentSalePricePerSqm: number | undefined;
  let recentSaleCount: number | undefined;
  try {
    const keyword = isLand ? caseRow.land_lot_no : (caseRow.address ?? "");
    const records = await safeInvoke<unknown[]>("query_real_price", {
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
        transactionDate:
          typeof rec.transaction_date === "string"
            ? rec.transaction_date
            : typeof rec.date === "string"
              ? rec.date
              : "",
      };
    }) : [];
    recentSalePricePerSqm = stats.avg;
    recentSaleCount = stats.count;
  } catch {
    // 失敗時欄位為 undefined
  }

  // ── 周邊設施（Overpass API）─────────────────────────────────────────────────

  // Web fallback helper：從 Next.js API route（POST）取得圖片 bytes
  async function fetchWebImage(path: string, body: Record<string, unknown>): Promise<Uint8Array | null> {
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const resp = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) return null;
      return new Uint8Array(await resp.arrayBuffer());
    } catch {
      return null;
    }
  }

  let nearbyAmenities: CaseDossierData["nearbyAmenities"] = [];
  let geoLat = safeGet(
    apiData["land_registry"]?.data ?? apiData["building_registry"]?.data,
    "lat", isNumber,
  );
  let geoLng = safeGet(
    apiData["land_registry"]?.data ?? apiData["building_registry"]?.data,
    "lng", isNumber,
  );

  // 若 API 資料無座標，嘗試用地址 geocode（Nominatim，免費）
  if ((!geoLat || !geoLng) && caseRow.address) {
    try {
      const { geocodeAddress } = await import("@/lib/map-api");
      const coords = await geocodeAddress(caseRow.address);
      geoLat = coords.lat;
      geoLng = coords.lng;
    } catch {
      // geocoding 失敗維持 undefined
    }
  }

  let locationMapImage: Uint8Array | null = null;
  if (geoLat && geoLng) {
    try {
      nearbyAmenities = summarizeNearbyAmenities(
        await queryNearbyAmenities({ lat: geoLat, lng: geoLng, radiusM: 1000 }),
      );
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
      // Tauri IPC 失敗 → web fallback（OSM tiles via Next.js API route）
      locationMapImage = await fetchWebImage("/api/location-map", { lat: geoLat, lng: geoLng });
    }
  }

  let aerialPhoto: Uint8Array | null = null;
  let exteriorPhoto: Uint8Array | null = null;
  if (geoLat && geoLng) {
    try {
      const aerialBytes = await safeInvoke<number[]>("fetch_aerial_photo", {
        lat: geoLat,
        lng: geoLng,
      });
      if (aerialBytes && aerialBytes.length > 0) {
        aerialPhoto = new Uint8Array(aerialBytes);
      }
    } catch {
      // Tauri IPC 失敗 → web fallback（NLSC 空拍圖 via Next.js API route）
      aerialPhoto = await fetchWebImage("/api/aerial-photo", { lat: geoLat, lng: geoLng });
    }
    try {
      const streetBytes = await safeInvoke<number[]>("fetch_street_view", {
        lat: geoLat,
        lng: geoLng,
      });
      if (streetBytes && streetBytes.length > 0) {
        exteriorPhoto = new Uint8Array(streetBytes);
      }
    } catch {
      // Tauri IPC 失敗 → web fallback（Mapillary via Next.js API route）
      exteriorPhoto = await fetchWebImage("/api/street-view", { lat: geoLat, lng: geoLng });
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
    base.exteriorPhoto = exteriorPhoto;
    base.aerialPhoto = aerialPhoto;
    base.floorPlanPhoto = floorPlanPhoto;

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
      fieldSketchFloorPlan,
      cover: {
        propertyName: caseRow.address ?? "",
        caseNumber: caseRow.case_no ?? caseRow.id.slice(0, 8),
        handlingAgent: brandText.agent_name ?? "",
        licensedAgentName: brandText.realtor_name ?? "",
        licensedAgentCertNo: brandText.agent_cert_no ?? "",
        brokerageCompanyName: brandText.company_name ?? "",
        brokerageLicenseNo: brandText.company_license_no ?? "",
        companyAddress: brandText.company_address ?? "",
        companyPhone: brandText.company_phone ?? "",
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
    const landReg = apiData["land_registry"]?.data;
    const landOwnership = apiData["co_owners"]?.data;

    const mortgages = Array.isArray(mortgagesRaw)
      ? (mortgagesRaw as unknown[]).map((m) => ({
          creditor: safeGet(m, "creditor", isString) ?? "",
          amount: safeGet(m, "amount", isNumber) ?? 0,
        }))
      : undefined;

    base.locationMapImage = locationMapImage;
    // Wave 6：外觀圖（由業務從 UI 上傳，assemble 不處理）
    base.exteriorPhoto = exteriorPhoto;
    base.aerialPhoto = aerialPhoto;
    base.floorPlanPhoto = floorPlanPhoto;

    // ── 稅費試算（建物）──────────────────────────────────────────────────────
    base.taxCalculation = null; // 建物版：askingPrice 未填前為 null

    return {
      ...base,
      buildingArea: firstNumber(buildingReg, ["area", "building_area", "AREA"]),
      buildingPurpose: firstString(buildingReg, ["purpose", "building_purpose", "PURPOSE"]),
      constructionDate: firstString(buildingReg, ["construction_date", "COMPLETEDATE"]),
      buildingCertificateNo: safeGet(buildingOwnership, "certificate_no", isString),
      buildingOwnershipDate: firstString(buildingOwnership, ["ownership_date", "RDATE"]),
      mortgages,
      recentSalePricePerSqm,
      recentSaleCount,
      transactionHistory,
      nearbyAmenities,
      legalClauses,
      fieldSketchFloorPlan,
      cover: {
        propertyName: caseRow.address ?? "",
        caseNumber: caseRow.case_no ?? caseRow.id.slice(0, 8),
        handlingAgent: brandText.agent_name ?? "",
        licensedAgentName: brandText.realtor_name ?? "",
        licensedAgentCertNo: brandText.agent_cert_no ?? "",
        brokerageCompanyName: brandText.company_name ?? "",
        brokerageLicenseNo: brandText.company_license_no ?? "",
        companyAddress: brandText.company_address ?? "",
        companyPhone: brandText.company_phone ?? "",
      },
      propertySheet: {
        askingPrice: 0,
        landSection: firstString(landReg, ["section", "SECTION", "SUBSECTION"]) ?? "",
        landNumber: caseRow.land_lot_no ?? "",
        zoning: firstString(landReg, ["zoning", "ZONING", "purpose", "land_purpose"]) ?? "",
        landArea: firstNumber(landReg, ["area", "land_area", "AREA"]) ?? 0,
        ownershipRatio: ratioText(landOwnership) || ratioText(buildingOwnership),
        shareArea: 0,
        buildingCoverage: "",
        floorAreaRatio: "",
        owner:
          firstString(buildingOwnership, ["owner_name", "LNAME"]) ??
          firstString(landOwnership, ["owner_name", "LNAME"]) ??
          caseRow.owner_name ??
          "",
        acquisitionDate: firstString(buildingOwnership, ["ownership_date", "RDATE"]) ?? "",
        registeredArea: m2ToPing(firstNumber(buildingReg, ["area", "building_area", "AREA"])),
        mainBuildingArea: m2ToPing(firstNumber(buildingReg, ["main_building_area", "MAINAREA"])),
        auxiliaryArea: m2ToPing(firstNumber(buildingReg, ["auxiliary_area", "ATTAREA"])),
        commonArea: m2ToPing(firstNumber(buildingReg, ["common_area", "SHAREAREA"])),
        parkingArea: m2ToPing(firstNumber(buildingReg, ["parking_area", "PARKAREA"])),
        floor: firstString(buildingReg, ["building_floor", "BUILDINGFLOOR"]),
        legalUse: firstString(buildingReg, ["purpose", "building_purpose", "PURPOSE"]),
        material: firstString(buildingReg, ["material", "MATERIAL"]),
        constructionDate: firstString(buildingReg, ["construction_date", "COMPLETEDATE"]),
        buildingAge: calculateBuildingAge(
          firstString(buildingReg, ["construction_date", "COMPLETEDATE"]) ?? "",
        ),
        ownershipScope: ratioText(buildingOwnership),
        constructionCompany: safeGet(buildingReg, "construction_company", isString),
      },
      buildingAreaBreakdown: {
        main: firstNumber(buildingReg, ["main_building_area", "MAINAREA"]) ?? 0,
        auxiliary: firstNumber(buildingReg, ["auxiliary_area", "ATTAREA"]) ?? 0,
        common: firstNumber(buildingReg, ["common_area", "SHAREAREA"]) ?? 0,
        parking: firstNumber(buildingReg, ["parking_area", "PARKAREA"]) ?? 0,
      },
    };
  }
}
