import { safeInvoke } from "@/lib/tauri-bridge";
import type { CaseRow } from "@/lib/cases-api";
import type { CaseDossierData } from "./document";
import { calculateTaxFees } from "@/lib/tax-calculator";
import { queryNearbyAmenities, summarizeNearbyAmenities } from "@/lib/overpass-client";
import { calculateBuildingAge } from "@/lib/registry-preview";
import { storage, type BrandingData } from "@/lib/storage";
import {
  createRegistryProvenancePayload,
  extractCandidateOptions,
  extractRegistryFailureReasons,
  extractTrustedRegistryData,
  isRegistryProvenancePayload,
  type CandidateParcelOption,
  type CandidateSummaryFields,
  type RegistryProvenancePayload,
} from "@/lib/registry-provenance";

type SketchRow = { id: string; version: number; case_id: string };
type ConversionRow = { id: string; status: string; approved_at?: string; sketch_id: string };
type PullResult = {
  results: Record<string, { data: unknown; source?: string; success?: boolean; error?: string }>;
  total_cost: number;
};
type LegalClauseRecord = {
  law_id?: string;
  title?: string;
  content_markdown?: string;
  version_date?: string;
  source_url?: string;
};
type WorkbenchSupplementPayload = {
  registrySupplements?: Array<{
    fieldName?: string;
    value?: string;
    source?: string;
    status?: string;
    updatedAt?: string;
  }>;
  fieldVisitAnswers?: Array<{
    topic?: string;
    answer?: string;
    status?: string;
    updatedAt?: string;
  }>;
};

function hasBrandText(values: Record<string, string>): boolean {
  return Object.values(values).some((value) => typeof value === "string" && value.trim().length > 0);
}

function brandingDataToBrandText(data: BrandingData | null): Record<string, string> {
  if (!data) return {};
  return {
    agent_name: data.agentName ?? "",
    realtor_name: data.realtorName ?? "",
    agent_cert_no: data.agentCertNo ?? "",
    company_name: data.companyName ?? "",
    company_license_no: data.companyLicenseNo ?? "",
    company_address: data.companyAddress ?? "",
    company_phone: data.companyPhone ?? "",
  };
}

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
const LEGAL_LAW_IDS = [
  "real-estate-broker-act",
  "consumer-protection-relevant",
  "fair-trade-relevant",
] as const;

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

function normalizeTaiwanAddress(value: string): string {
  return value.replace(/臺/g, "台").replace(/\s+/g, "");
}

function filterComparableRealPriceRecords(records: unknown[], district: string): unknown[] {
  const normalizedDistrict = normalizeTaiwanAddress(district);
  if (!normalizedDistrict) return records;
  return records.filter((record) => {
    const address = (record as Record<string, unknown> | undefined)?.address;
    if (typeof address !== "string" || !address.trim()) return true;
    return normalizeTaiwanAddress(address).includes(normalizedDistrict);
  });
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
const isPlainRecord = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === "object" && !Array.isArray(v);
const hasRegistryData = (v: unknown): v is Record<string, unknown> | unknown[] =>
  isPlainRecord(v) || Array.isArray(v);

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

function ratioValue(obj: unknown): number | undefined {
  const numerator = firstNumber(obj, ["NUMERATOR", "numerator"]);
  const denominator = firstNumber(obj, ["DENOMINATOR", "denominator"]);
  if (numerator !== undefined && denominator && denominator !== 0) {
    return numerator / denominator;
  }
  const direct = firstText(obj, ["RIGHT", "right", "ownership_scope", "right_scope"]);
  const match = direct?.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const directNumerator = Number(match[1]);
  const directDenominator = Number(match[2]);
  if (!Number.isFinite(directNumerator) || !Number.isFinite(directDenominator) || directDenominator === 0) {
    return undefined;
  }
  return directNumerator / directDenominator;
}

function shareArea(area?: number, ratio?: number): number | undefined {
  if (area === undefined || ratio === undefined) return undefined;
  if (!Number.isFinite(area) || !Number.isFinite(ratio)) return undefined;
  return Math.round(area * ratio * 100) / 100;
}

const KNOWN_PLACEHOLDER_CERTIFICATE_NUMBERS = new Set(["北松字第012345號"]);
const KNOWN_PLACEHOLDER_BUILDING_FLOORS = new Set(["013層"]);

function cleanKnownPlaceholderText(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (KNOWN_PLACEHOLDER_CERTIFICATE_NUMBERS.has(trimmed)) return undefined;
  return trimmed;
}

function extractFloorFromAddress(address?: string): string | undefined {
  const match = address?.match(/(\d+樓(?:之\d+)?)/);
  return match?.[1];
}

function resolveBuildingFloor(registryFloor?: string, address?: string): string | undefined {
  const floor = registryFloor?.trim();
  if (!floor) return extractFloorFromAddress(address);
  if (KNOWN_PLACEHOLDER_BUILDING_FLOORS.has(floor)) {
    return extractFloorFromAddress(address) ?? floor;
  }
  return floor;
}

function parseSupplementNumber(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isPlaceholderParcelId(value?: string | null): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return true;
  return trimmed === "0001" || trimmed === "00001" || /候選|待確認|待補/.test(trimmed);
}

function resolveFormalPullParcelId(caseRow: CaseRow, trustedPersisted: Record<string, unknown>) {
  const manualSupplement = trustedPersisted.manual_registry_supplement;
  const manualBuildingNumber = firstString(manualSupplement, ["buildingNumberCandidate"]);
  const candidates = [
    caseRow.building_lot_no,
    manualBuildingNumber,
    caseRow.land_lot_no,
  ];
  return candidates.find((candidate) => !isPlaceholderParcelId(candidate))?.trim();
}

function extractTrustedOfficialRegistryData(payload: unknown): Record<string, unknown> {
  if (!isRegistryProvenancePayload(payload)) return {};
  return Object.fromEntries(
    Object.entries(payload.entries)
      .filter(([, entry]) =>
        entry.trustedForPdf &&
        entry.status === "success" &&
        entry.source === "moi_api" &&
        hasRegistryData(entry.data),
      )
      .map(([apiId, entry]) => [apiId, entry.data]),
  );
}

function buildRegistrySupplementLookup(payload?: WorkbenchSupplementPayload) {
  const valueByField = new Map<string, string>();
  const sourceByField = new Map<string, string>();
  for (const row of payload?.registrySupplements ?? []) {
    const fieldName = row.fieldName?.trim();
    const value = row.value?.trim();
    if (!fieldName || !value) continue;
    valueByField.set(fieldName, value);
    sourceByField.set(fieldName, row.source?.trim() || "補件");
  }
  return { valueByField, sourceByField };
}

function buildFieldVisitLookup(payload?: WorkbenchSupplementPayload) {
  const answerByTopic = new Map<string, string>();
  for (const row of payload?.fieldVisitAnswers ?? []) {
    const topic = row.topic?.trim();
    const answer = row.answer?.trim();
    if (!topic || !answer) continue;
    answerByTopic.set(topic, answer);
  }
  return answerByTopic;
}

function mergeRegistryProvenancePayload(
  existing: unknown,
  next: RegistryProvenancePayload,
): RegistryProvenancePayload {
  if (!isRegistryProvenancePayload(existing)) return next;
  return {
    ...existing,
    ...next,
    entries: {
      ...existing.entries,
      ...next.entries,
    },
    candidate_options: next.candidate_options ?? existing.candidate_options,
    selected_candidate_ids: next.selected_candidate_ids ?? existing.selected_candidate_ids,
    confirmed_parcel_ids: next.confirmed_parcel_ids ?? existing.confirmed_parcel_ids,
    coordinate_source: next.coordinate_source ?? existing.coordinate_source,
    inferred_reference: next.inferred_reference ?? existing.inferred_reference,
  };
}

function normalizePullResultsForProvenance(
  results: PullResult["results"],
): Parameters<typeof createRegistryProvenancePayload>[0]["results"] {
  return Object.fromEntries(
    Object.entries(results).map(([apiId, value]) => {
      const success =
        typeof value.success === "boolean"
          ? value.success
          : (value.source === "api" || value.source === "cache" || value.source === "moi_api") &&
            hasRegistryData(value.data);
      return [
        apiId,
        {
          success,
          source: value.source,
          data: hasRegistryData(value.data) ? value.data : undefined,
          error: typeof value.error === "string" ? value.error : undefined,
        },
      ];
    }),
  );
}

const PRE_SURVEY_DISCLAIMER = "地政資料，最終以正式謄本為主；本說明書不代表完整資訊。";
const CANDIDATE_SOURCE_LABEL = "候選資料，待屋主/權狀確認";
const INFERRED_SOURCE_LABEL = "推測資料，非登記資料";

function findSelectedCandidate(
  payload: unknown,
  parcelType: "land" | "building",
): CandidateParcelOption | undefined {
  if (!isRegistryProvenancePayload(payload)) return undefined;
  const selectedId = payload.selected_candidate_ids?.[parcelType];
  if (!selectedId) return undefined;
  return extractCandidateOptions(payload).find((candidate) => candidate.candidate_id === selectedId);
}

function numberFromSummary(fields: CandidateSummaryFields | undefined, key: string): number | undefined {
  const value = fields?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function textFromSummary(fields: CandidateSummaryFields | undefined, key: string): string | undefined {
  const value = fields?.[key];
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function setSourceIfValue(
  sources: Record<string, string>,
  key: string,
  value: unknown,
  source: string,
) {
  if (value !== undefined && value !== null && value !== "") {
    sources[key] = source;
  }
}

function decorateCandidateOptions(
  payload: unknown,
): CandidateParcelOption[] {
  if (!isRegistryProvenancePayload(payload)) return [];
  const selected = payload.selected_candidate_ids ?? {};
  const confirmed = payload.confirmed_parcel_ids ?? {};
  return extractCandidateOptions(payload).map((candidate) => {
    const confirmedMatch = confirmed[candidate.parcel_type] === candidate.candidate_id;
    const selectedMatch = selected[candidate.parcel_type] === candidate.candidate_id;
    return {
      ...candidate,
      confirmation_state: confirmedMatch
        ? "confirmed"
        : selectedMatch
          ? "selected_candidate"
          : candidate.confirmation_state ?? "unconfirmed",
    };
  });
}

function normalizeLegalClauseRecord(clause: unknown): string | null {
  if (typeof clause === "string" && clause.trim()) return clause.trim();
  if (!isPlainRecord(clause)) return null;
  const record = clause as LegalClauseRecord;
  const title = record.title?.trim();
  const content = record.content_markdown?.trim();
  if (!title || !content) return null;
  const meta = [
    record.version_date?.trim() ? `版本日期：${record.version_date.trim()}` : null,
    record.source_url?.trim() ? `資料來源：${record.source_url.trim()}` : null,
  ].filter(Boolean);
  return `${title}：${content}${meta.length > 0 ? `（${meta.join("；")}）` : ""}`;
}

async function resolveLegalClauses(): Promise<string[]> {
  try {
    const clauses = await safeInvoke<unknown[]>("list_legal_clauses");
    if (Array.isArray(clauses)) {
      const normalized = clauses
        .map(normalizeLegalClauseRecord)
        .filter((item): item is string => Boolean(item));
      if (normalized.length > 0) return normalized;
    }
  } catch {
    // Fallback to fixed law ids below.
  }

  try {
    const clauses = await Promise.all(
      LEGAL_LAW_IDS.map(async (lawId) =>
        safeInvoke<unknown>("get_legal_clause", { law_id: lawId }),
      ),
    );
    const normalized = clauses
      .map(normalizeLegalClauseRecord)
      .filter((item): item is string => Boolean(item));
    if (normalized.length > 0) return normalized;
  } catch {
    // Legacy browser-dev mocks used to return string[] from get_legal_clause without law_id.
  }

  try {
    const clauses = await safeInvoke<unknown[]>("get_legal_clause");
    if (Array.isArray(clauses)) {
      return clauses
        .map(normalizeLegalClauseRecord)
        .filter((item): item is string => Boolean(item));
    }
  } catch {
    // 失敗時回退至空陣列，由 PDF renderer 使用完整 fallback 法規集合。
  }

  return [];
}

function isMockRegistryPullData(results: Record<string, { data: unknown }>): boolean {
  const entries = Object.values(results) as Array<{ data: unknown; source?: unknown }>;
  return entries.length > 0 && entries.every((entry) => entry.source === "mock");
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
  const persisted = caseRow.land_registry_data;
  const registryFailureReasons = extractRegistryFailureReasons(persisted);
  const candidateOptions = decorateCandidateOptions(persisted);
  const inferredReference = isRegistryProvenancePayload(persisted)
    ? persisted.inferred_reference
    : undefined;
  const hasCandidatePreSurveyData =
    candidateOptions.length > 0 || Boolean(inferredReference);
  const lookupCost =
    isRegistryProvenancePayload(persisted) && typeof persisted.totalCost === "number"
      ? persisted.totalCost
      : undefined;

  let brandText: Record<string, string> = {};
  try {
    brandText = (await safeInvoke<Record<string, string>>("get_brand_text_settings")) ?? {};
  } catch { /* dev fallback */ }
  if (!hasBrandText(brandText)) {
    try {
      brandText = brandingDataToBrandText(await storage.getBranding());
    } catch {
      // Native settings are provided by get_brand_text_settings.
    }
  }

  let workbenchSupplement: WorkbenchSupplementPayload | undefined;
  try {
    workbenchSupplement = await safeInvoke<WorkbenchSupplementPayload>("get_workbench_supplement", {
      caseId: caseRow.id,
    });
  } catch {
    workbenchSupplement = undefined;
  }
  const registrySupplement = buildRegistrySupplementLookup(workbenchSupplement);
  const fieldVisitAnswers = buildFieldVisitLookup(workbenchSupplement);

  const base: CaseDossierData = {
    caseNo: caseRow.case_no ?? caseRow.id.slice(0, 8),
    address: caseRow.address ?? "",
    propertyType: isLand ? "land" : "building",
    landLotNo: caseRow.land_lot_no ?? "",
    ownerName: caseRow.owner_name ?? "",
    companyName: brandText.company_name ?? "",
    generatedAt: new Date().toLocaleDateString("zh-TW"),
    preSurvey:
      lookupCost !== undefined || registryFailureReasons.length > 0 || hasCandidatePreSurveyData
        ? {
            lookupCost,
            failureReasons: registryFailureReasons,
            candidateDisclaimer: hasCandidatePreSurveyData ? PRE_SURVEY_DISCLAIMER : undefined,
            candidateOptions: candidateOptions.length > 0 ? candidateOptions : undefined,
            inferredReference,
          }
        : undefined,
  };

  // ── 地政 API ──────────────────────────────────────────────────────────────

  const apiIds = isLand
    ? ["land_registry", "zoning", "land_value", "mortgages"]
    : [
        "building_registry",
        "building_ownership",
        "mortgages",
        "land_registry",
        "co_owners",
        "zoning",
        "land_value",
      ];

  let apiData: Record<string, { data: unknown; source?: string }> = {};
  const trustedPersisted =
    persisted && typeof persisted === "object" && !Array.isArray(persisted)
      ? extractTrustedRegistryData(persisted)
      : {};
  const trustedOfficialPersisted = extractTrustedOfficialRegistryData(persisted);
  const hasTrustedPersisted = Object.keys(trustedOfficialPersisted).length > 0;
  const formalPullParcelId = resolveFormalPullParcelId(caseRow, trustedPersisted);
  const shouldAttemptFormalPull =
    !persisted ||
    (isRegistryProvenancePayload(persisted) &&
      !hasTrustedPersisted &&
      Boolean(caseRow.owner_name?.trim()) &&
      Boolean(formalPullParcelId));

  if (hasTrustedPersisted) {
    apiData = Object.fromEntries(
      Object.entries(trustedPersisted).map(([apiId, value]) => {
        const wrapped =
          value && typeof value === "object" && "data" in (value as Record<string, unknown>)
            ? (value as { data: unknown })
            : { data: value };
        return [apiId, wrapped];
      }),
    );
  } else if (shouldAttemptFormalPull) {
    let pullResult: PullResult | undefined;
    try {
      pullResult = await safeInvoke<PullResult>("land_registry_pull_data", {
        parcelId: formalPullParcelId,
        apiIds,
      });
    } catch {
      // 組裝層捕捉錯誤，API 欄位降級為 undefined
    }
    apiData = pullResult?.results ?? {};
    if (isMockRegistryPullData(apiData)) {
      apiData = {};
    } else {
      apiData = Object.fromEntries(
        Object.entries(apiData).filter(([, value]) => {
          const source = (value as { source?: unknown }).source;
          return (source === "api" || source === "cache" || source === "moi_api") &&
            hasRegistryData(value.data);
        }),
      );
      if (Object.keys(apiData).length > 0 && pullResult?.results) {
        const trustedPayload = createRegistryProvenancePayload({
          parcelId: caseRow.land_lot_no,
          totalCost: pullResult.total_cost,
          results: normalizePullResultsForProvenance(pullResult.results),
        });
        const mergedPayload = mergeRegistryProvenancePayload(persisted, trustedPayload);
        try {
          await safeInvoke("update_case", {
            id: caseRow.id,
            input: {
              land_registry_data: mergedPayload,
            },
          });
        } catch {
          // PDF assembly can still proceed with the freshly pulled trusted payload.
        }
      }
    }
  }
  if (trustedPersisted.manual_registry_supplement && !apiData.manual_registry_supplement) {
    apiData.manual_registry_supplement = { data: trustedPersisted.manual_registry_supplement };
  }

  // ── 法規條文 ──────────────────────────────────────────────────────────────

  const legalClauses = await resolveLegalClauses();

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
    const comparableRecords = Array.isArray(records)
      ? filterComparableRealPriceRecords(records, extractDistrict(caseRow.address ?? ""))
      : [];
    const stats = computeRecentSaleStats(comparableRecords);
    transactionHistory = comparableRecords.map((r) => {
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
    });
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

  if ((!geoLat || !geoLng) && isRegistryProvenancePayload(persisted)) {
    const coordinate = persisted.coordinate_source;
    if (
      coordinate &&
      typeof coordinate.lat === "number" &&
      Number.isFinite(coordinate.lat) &&
      typeof coordinate.lng === "number" &&
      Number.isFinite(coordinate.lng)
    ) {
      geoLat = coordinate.lat;
      geoLng = coordinate.lng;
    }
  }

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
        propertyName: caseRow.case_name ?? caseRow.address ?? "",
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
        landArea: safeGet(landReg, "area", isNumber),
        ownershipRatio: "",
        shareArea: undefined,
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
    const zoning = apiData["zoning"]?.data;
    const manualSupplement = apiData["manual_registry_supplement"]?.data;
    const manualSources =
      isPlainRecord(manualSupplement) && isPlainRecord(manualSupplement.sources)
        ? manualSupplement.sources
        : {};
    const manualSourceFor = (key: string) => {
      const source = manualSources[key];
      if (typeof source === "string" && source.trim()) return source;
      return firstString(manualSupplement, ["sourceLabel"]) ?? "人工補件";
    };

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
    const landArea = firstNumber(landReg, ["area", "land_area", "AREA"]);
    const ownershipRatio = ratioText(landOwnership) || ratioText(buildingOwnership);
    const ownershipRatioNumber = ratioValue(landOwnership) ?? ratioValue(buildingOwnership);
    const manualRooms = registrySupplement.valueByField.get("格局") ??
      firstString(manualSupplement, ["rooms"]);
    const manualDirection = registrySupplement.valueByField.get("座向") ??
      firstString(manualSupplement, ["direction"]);
    const manualBuildingStatus = fieldVisitAnswers.get("建物現況") ??
      firstString(manualSupplement, ["buildingStatus"]);
    const manualManagementFee = parseSupplementNumber(
      registrySupplement.valueByField.get("管理費（元/月）") ??
        registrySupplement.valueByField.get("管理費") ??
        firstText(manualSupplement, ["managementFee"]),
    );
    const propertySheetSources: Record<string, string> = {};
    const setWorkbenchSource = (key: string, fieldName: string) => {
      const source = registrySupplement.sourceByField.get(fieldName);
      if (source) propertySheetSources[key] = source;
    };
    setWorkbenchSource("rooms", "格局");
    setWorkbenchSource("direction", "座向");
    setWorkbenchSource("managementFee", "管理費（元/月）");
    setWorkbenchSource("managementFee", "管理費");
    if (!propertySheetSources.rooms && manualRooms) {
      propertySheetSources.rooms = manualSourceFor("rooms");
    }
    if (!propertySheetSources.direction && manualDirection) {
      propertySheetSources.direction = manualSourceFor("direction");
    }
    if (!propertySheetSources.managementFee && manualManagementFee !== undefined) {
      propertySheetSources.managementFee = manualSourceFor("managementFee");
    }
    if (fieldVisitAnswers.has("建物現況")) {
      propertySheetSources.buildingStatus = "現場確認";
    } else if (manualBuildingStatus) {
      propertySheetSources.buildingStatus = manualSourceFor("buildingStatus");
    }
    const selectedLandCandidate = findSelectedCandidate(persisted, "land");
    const selectedBuildingCandidate = findSelectedCandidate(persisted, "building");
    const landCandidateFields = selectedLandCandidate?.summary_fields;
    const buildingCandidateFields = selectedBuildingCandidate?.summary_fields;
    const inferredFields = inferredReference?.estimated_fields;
    const trustedRegisteredArea = m2ToPing(firstNumber(buildingReg, ["area", "building_area", "AREA"]));
    const trustedMainBuildingArea = m2ToPing(firstNumber(buildingReg, ["main_building_area", "MAINAREA"]));
    const trustedAuxiliaryArea = m2ToPing(firstNumber(buildingReg, ["auxiliary_area", "ATTAREA"]));
    const trustedCommonArea = m2ToPing(firstNumber(buildingReg, ["common_area", "SHAREAREA"]));
    const trustedParkingArea = m2ToPing(firstNumber(buildingReg, ["parking_area", "PARKAREA"]));
    const candidateRegisteredArea = numberFromSummary(buildingCandidateFields, "registeredAreaPing");
    const candidateMainBuildingArea = numberFromSummary(buildingCandidateFields, "mainBuildingAreaPing");
    const candidateAuxiliaryArea = numberFromSummary(buildingCandidateFields, "auxiliaryAreaPing");
    const candidateCommonArea = numberFromSummary(buildingCandidateFields, "commonAreaPing");
    const candidateParkingArea = numberFromSummary(buildingCandidateFields, "parkingAreaPing");
    const inferredRegisteredArea = numberFromSummary(inferredFields, "registeredAreaPing");
    const inferredMainBuildingArea = numberFromSummary(inferredFields, "mainBuildingAreaPing");
    const resolvedRegisteredArea = trustedRegisteredArea ?? candidateRegisteredArea ?? inferredRegisteredArea;
    const resolvedMainBuildingArea = trustedMainBuildingArea ?? candidateMainBuildingArea ?? inferredMainBuildingArea;
    const resolvedAuxiliaryArea = trustedAuxiliaryArea ?? candidateAuxiliaryArea;
    const resolvedCommonArea = trustedCommonArea ?? candidateCommonArea;
    const resolvedParkingArea = trustedParkingArea ?? candidateParkingArea;
    const resolvedLegalUse =
      firstString(buildingReg, ["purpose", "building_purpose", "PURPOSE"]) ??
      textFromSummary(buildingCandidateFields, "legalUse");
    const resolvedMaterial =
      firstString(buildingReg, ["material", "MATERIAL"]) ??
      textFromSummary(buildingCandidateFields, "material");
    const resolvedConstructionDate =
      firstString(buildingReg, ["construction_date", "COMPLETEDATE"]) ??
      textFromSummary(buildingCandidateFields, "constructionDate");
    const resolvedFloor = resolveBuildingFloor(
      firstString(buildingReg, ["building_floor", "BUILDINGFLOOR"]) ??
        textFromSummary(buildingCandidateFields, "floor"),
      caseRow.address,
    );
    const resolvedBuildingAge =
      calculateBuildingAge(resolvedConstructionDate ?? "") ??
      textFromSummary(buildingCandidateFields, "age");
    const resolvedLandArea = landArea ?? numberFromSummary(landCandidateFields, "landAreaSqm");
    const resolvedOwnershipRatio =
      ownershipRatio || textFromSummary(buildingCandidateFields, "landOwnershipRatio") || "";
    const resolvedOwnershipRatioNumber =
      ownershipRatioNumber ?? ratioValue({ right: textFromSummary(buildingCandidateFields, "landOwnershipRatio") });
    const resolvedOwnershipScope =
      ratioText(buildingOwnership) || textFromSummary(buildingCandidateFields, "ownershipScope") || "";
    const resolvedBuildingCoverage =
      firstString(zoning, ["building_coverage_ratio", "BUILDING_COVERAGE_RATIO"]) ??
      textFromSummary(landCandidateFields, "buildingCoverage") ??
      "";
    const resolvedFloorAreaRatio =
      firstString(zoning, ["floor_area_ratio", "FLOOR_AREA_RATIO"]) ??
      textFromSummary(landCandidateFields, "floorAreaRatio") ??
      "";

    setSourceIfValue(propertySheetSources, "landSection", selectedLandCandidate?.section_name, CANDIDATE_SOURCE_LABEL);
    setSourceIfValue(propertySheetSources, "landNumber", selectedLandCandidate?.parcel_number, CANDIDATE_SOURCE_LABEL);
    setSourceIfValue(propertySheetSources, "zoning", textFromSummary(landCandidateFields, "zoning"), CANDIDATE_SOURCE_LABEL);
    setSourceIfValue(propertySheetSources, "landArea", numberFromSummary(landCandidateFields, "landAreaSqm"), CANDIDATE_SOURCE_LABEL);
    setSourceIfValue(propertySheetSources, "buildingCoverage", textFromSummary(landCandidateFields, "buildingCoverage"), CANDIDATE_SOURCE_LABEL);
    setSourceIfValue(propertySheetSources, "floorAreaRatio", textFromSummary(landCandidateFields, "floorAreaRatio"), CANDIDATE_SOURCE_LABEL);
    if (trustedRegisteredArea === undefined) {
      setSourceIfValue(
        propertySheetSources,
        "registeredArea",
        candidateRegisteredArea,
        CANDIDATE_SOURCE_LABEL,
      );
      if (candidateRegisteredArea === undefined) {
        setSourceIfValue(propertySheetSources, "registeredArea", inferredRegisteredArea, INFERRED_SOURCE_LABEL);
      }
    }
    if (trustedMainBuildingArea === undefined) {
      setSourceIfValue(
        propertySheetSources,
        "mainBuildingArea",
        candidateMainBuildingArea,
        CANDIDATE_SOURCE_LABEL,
      );
      if (candidateMainBuildingArea === undefined) {
        setSourceIfValue(propertySheetSources, "mainBuildingArea", inferredMainBuildingArea, INFERRED_SOURCE_LABEL);
      }
    }
    if (trustedAuxiliaryArea === undefined) {
      setSourceIfValue(propertySheetSources, "auxiliaryArea", candidateAuxiliaryArea, CANDIDATE_SOURCE_LABEL);
    }
    if (trustedCommonArea === undefined) {
      setSourceIfValue(propertySheetSources, "commonArea", candidateCommonArea, CANDIDATE_SOURCE_LABEL);
    }
    if (trustedParkingArea === undefined) {
      setSourceIfValue(propertySheetSources, "parkingArea", candidateParkingArea, CANDIDATE_SOURCE_LABEL);
    }
    if (!firstString(buildingReg, ["purpose", "building_purpose", "PURPOSE"])) {
      setSourceIfValue(propertySheetSources, "legalUse", textFromSummary(buildingCandidateFields, "legalUse"), CANDIDATE_SOURCE_LABEL);
    }
    if (!firstString(buildingReg, ["construction_date", "COMPLETEDATE"])) {
      setSourceIfValue(propertySheetSources, "constructionDate", textFromSummary(buildingCandidateFields, "constructionDate"), CANDIDATE_SOURCE_LABEL);
      setSourceIfValue(propertySheetSources, "buildingAge", resolvedBuildingAge, CANDIDATE_SOURCE_LABEL);
    }
    if (!firstString(buildingReg, ["building_floor", "BUILDINGFLOOR"])) {
      setSourceIfValue(propertySheetSources, "floor", textFromSummary(buildingCandidateFields, "floor"), CANDIDATE_SOURCE_LABEL);
    }
    if (!ratioText(buildingOwnership)) {
      setSourceIfValue(propertySheetSources, "ownershipScope", textFromSummary(buildingCandidateFields, "ownershipScope"), CANDIDATE_SOURCE_LABEL);
    }

    return {
      ...base,
      buildingArea: firstNumber(buildingReg, ["area", "building_area", "AREA"]),
      buildingPurpose: firstString(buildingReg, ["purpose", "building_purpose", "PURPOSE"]),
      constructionDate: firstString(buildingReg, ["construction_date", "COMPLETEDATE"]),
      buildingCertificateNo: cleanKnownPlaceholderText(
        firstString(buildingOwnership, ["certificate_no", "CERTIFICATENO"]),
      ),
      buildingOwnershipDate: firstString(buildingOwnership, ["ownership_date", "RDATE"]),
      mortgages,
      recentSalePricePerSqm,
      recentSaleCount,
      transactionHistory,
      nearbyAmenities,
      legalClauses,
      fieldSketchFloorPlan,
      cover: {
        propertyName: caseRow.case_name ?? caseRow.address ?? "",
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
        landSection:
          firstString(landReg, ["section", "SECTION", "SUBSECTION"]) ??
          selectedLandCandidate?.section_name ??
          selectedBuildingCandidate?.section_name ??
          "",
        landNumber:
          firstString(landReg, ["lot_number", "land_lot_no", "NO", "LOTNO"]) ??
          selectedLandCandidate?.parcel_number ??
          caseRow.land_lot_no ??
          "",
        zoning:
          firstString(landReg, ["zoning", "ZONING", "purpose", "land_purpose"]) ??
          firstString(zoning, ["zoning_type", "ZONING", "usage_category"]) ??
          textFromSummary(landCandidateFields, "zoning") ??
          "",
        landArea: resolvedLandArea,
        ownershipRatio: resolvedOwnershipRatio,
        shareArea: shareArea(resolvedLandArea, resolvedOwnershipRatioNumber),
        buildingCoverage: resolvedBuildingCoverage,
        floorAreaRatio: resolvedFloorAreaRatio,
        owner:
          firstString(buildingOwnership, ["owner_name", "LNAME"]) ??
          firstString(landOwnership, ["owner_name", "LNAME"]) ??
          caseRow.owner_name ??
          "",
        acquisitionDate: firstString(buildingOwnership, ["ownership_date", "RDATE"]) ?? "",
        registeredArea: resolvedRegisteredArea,
        mainBuildingArea: resolvedMainBuildingArea,
        auxiliaryArea: resolvedAuxiliaryArea,
        commonArea: resolvedCommonArea,
        parkingArea: resolvedParkingArea,
        floor: resolvedFloor,
        legalUse: resolvedLegalUse,
        material: resolvedMaterial,
        constructionDate: resolvedConstructionDate,
        buildingAge: resolvedBuildingAge,
        ownershipScope: resolvedOwnershipScope,
        buildingStatus: manualBuildingStatus,
        rooms: manualRooms,
        direction: manualDirection,
        managementFee: manualManagementFee,
        constructionCompany: safeGet(buildingReg, "construction_company", isString),
      },
      propertySheetSources:
        Object.keys(propertySheetSources).length > 0 ? propertySheetSources : undefined,
      buildingAreaBreakdown: {
        main: resolvedMainBuildingArea ?? 0,
        auxiliary: resolvedAuxiliaryArea ?? 0,
        common: resolvedCommonArea ?? 0,
        parking: resolvedParkingArea ?? 0,
      },
    };
  }
}
