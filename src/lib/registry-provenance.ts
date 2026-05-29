export type RegistryTrustedSource = "moi_api" | "manual";
export type RegistryUntrustedSource = "public_candidate" | "raw_probe" | "mock" | "unknown";

export type RegistrySource = RegistryTrustedSource | RegistryUntrustedSource;

export type RegistryStatus =
  | "success"
  | "manual_confirmed"
  | "failed"
  | "unauthorized"
  | "candidate"
  | "probe";

export interface RegistryProvenanceEntry {
  apiId: string;
  source: RegistrySource;
  status: RegistryStatus;
  trustedForPdf: boolean;
  data?: Record<string, unknown> | unknown[];
  error?: string;
  sourceNote?: string;
}

export interface CandidateSummaryFields {
  registeredAreaPing?: number;
  mainBuildingAreaPing?: number;
  auxiliaryAreaPing?: number;
  commonAreaPing?: number;
  parkingAreaPing?: number;
  landAreaSqm?: number;
  legalUse?: string;
  constructionDate?: string;
  material?: string;
  floor?: string;
  age?: string;
  zoning?: string;
  buildingCoverage?: string;
  floorAreaRatio?: string;
  ownershipScope?: string;
  landOwnershipRatio?: string;
  [key: string]: string | number | boolean | undefined;
}

export type CandidateParcelType = "land" | "building";
export type CandidateQueryStatus = "candidate_data_available" | "failed" | "pending";
export type CandidateConfirmationState = "unconfirmed" | "selected_candidate" | "confirmed";

export interface CandidateParcelOption {
  candidate_id: string;
  parcel_type: CandidateParcelType;
  office_code?: string;
  section_code?: string;
  section_name?: string;
  land_no?: string;
  building_no?: string;
  parcel_number?: string;
  normalized_parcel_id: string;
  source?: string;
  confidence_label?: string;
  official_status?: string;
  query_status?: CandidateQueryStatus;
  confirmation_state?: CandidateConfirmationState;
  summary_fields?: CandidateSummaryFields;
  query_cost?: number;
  error_code?: string;
  error_message?: string;
  warnings?: string[];
}

export interface RegistryCoordinateSource {
  lat: number;
  lng: number;
  source: "candidate_reference" | "manual" | "registry" | string;
}

export interface InferredRegistryReference {
  target_unit: string;
  basis: string;
  confidence: "high" | "medium" | "low" | string;
  source_units: string[];
  estimated_fields: CandidateSummaryFields;
  warning: string;
}

export interface RegistryProvenancePayload extends Record<string, unknown> {
  schema: "aire.registry-provenance.v1";
  generatedAt: string;
  parcelId?: string;
  totalCost?: number;
  isPaid?: boolean;
  pricingNote?: string;
  entries: Record<string, RegistryProvenanceEntry>;
  candidate_options?: CandidateParcelOption[];
  selected_candidate_ids?: Partial<Record<CandidateParcelType, string>>;
  confirmed_parcel_ids?: Partial<Record<CandidateParcelType, string>>;
  coordinate_source?: RegistryCoordinateSource;
  inferred_reference?: InferredRegistryReference;
}

type ApiLikeResult = {
  success: boolean;
  data?: Record<string, unknown> | unknown[];
  error?: unknown;
  source?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasRegistryData(value: unknown): value is Record<string, unknown> | unknown[] {
  return isRecord(value) || Array.isArray(value);
}

export function isRegistryProvenancePayload(value: unknown): value is RegistryProvenancePayload {
  if (!isRecord(value)) return false;
  if (value.schema !== "aire.registry-provenance.v1") return false;
  return isRecord(value.entries);
}

function trustedSourceForApiResult(source?: string): RegistrySource {
  if (!source) return "moi_api";
  if (source === "manual") return "manual";
  if (source === "api" || source === "cache" || source === "moi_api") return "moi_api";
  if (source === "mock") return "mock";
  if (source === "public_candidate") return "public_candidate";
  if (source === "raw_probe") return "raw_probe";
  return "unknown";
}

function normalizeFailureMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error == null) return "";
  if (typeof error === "number" || typeof error === "boolean") return String(error);
  if (isRecord(error) && typeof error.message === "string") return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function classifyRegistryFailure(error?: unknown): {
  status: Extract<RegistryStatus, "failed" | "unauthorized">;
  reason: string;
  action: string;
} {
  const message = normalizeFailureMessage(error);
  if (/ApiKeyNotConfigured|API key not set|未設定.*API/i.test(message)) {
    return {
      status: "failed",
      reason: "未設定地政 API 金鑰",
      action: "請到設定頁設定地政 API 金鑰後重試",
    };
  }
  if (/AuthenticationFailed|認證失敗/i.test(message)) {
    return {
      status: "unauthorized",
      reason: "API 認證失敗",
      action: "請確認地政 API 金鑰或授權設定",
    };
  }
  if (/ConsentRequired|授權不足|屋主授權/i.test(message)) {
    return {
      status: "unauthorized",
      reason: "缺少屋主授權或授權不足",
      action: "請補屋主授權或改由屋主提供正式文件",
    };
  }
  if (/InsufficientBalance|餘額不足/i.test(message)) {
    return {
      status: "failed",
      reason: "地政 API 餘額不足",
      action: "請補值或改由人工補件後再產出客戶版 PDF",
    };
  }
  if (/PermissionDenied|權限不足|NlscPermissionDenied/i.test(message)) {
    return {
      status: "unauthorized",
      reason: "API 權限不足",
      action: "請確認服務權限已開通，或改走人工補件",
    };
  }
  if (/NoData|NotFound|查無資料|查無正式/i.test(message)) {
    return {
      status: "failed",
      reason: "查無正式地政資料",
      action: "請確認地號/建號後重試，或由屋主提供謄本補件",
    };
  }
  return {
    status: "failed",
    reason: message.trim() || "查詢未成功",
    action: "請確認資料來源後重試，或改由人工補件",
  };
}

export function createRegistryProvenancePayload(input: {
  parcelId?: string;
  totalCost?: number;
  isPaid?: boolean;
  pricingNote?: string;
  results?: Record<string, ApiLikeResult>;
  manualEntries?: Array<{ apiId: string; data: Record<string, unknown> | null }>;
  candidateOptions?: CandidateParcelOption[];
  selectedCandidateIds?: Partial<Record<CandidateParcelType, string>>;
  confirmedParcelIds?: Partial<Record<CandidateParcelType, string>>;
  coordinateSource?: RegistryCoordinateSource;
  inferredReference?: InferredRegistryReference;
  generatedAt?: string;
}): RegistryProvenancePayload {
  const entries: Record<string, RegistryProvenanceEntry> = {};

  for (const [apiId, result] of Object.entries(input.results ?? {})) {
    const source = trustedSourceForApiResult(result.source);
    const trustedForPdf = result.success && source === "moi_api" && hasRegistryData(result.data);
    if (trustedForPdf) {
      entries[apiId] = {
        apiId,
        source,
        status: "success",
        trustedForPdf: true,
        data: result.data,
      };
      continue;
    }
    if (result.success && source === "public_candidate" && hasRegistryData(result.data)) {
      entries[apiId] = {
        apiId,
        source,
        status: "candidate",
        trustedForPdf: false,
        data: result.data,
        sourceNote: "公開或候選資料，物調表可先帶入，補件後才可升級為正式確認",
      };
      continue;
    }
    if (result.success && source === "raw_probe" && hasRegistryData(result.data)) {
      entries[apiId] = {
        apiId,
        source,
        status: "probe",
        trustedForPdf: false,
        data: result.data,
        sourceNote: "探索端點結果，只可供除錯，不進物調表與正式 PDF",
      };
      continue;
    }
    if (!result.success) {
      const failure = classifyRegistryFailure(result.error);
      entries[apiId] = {
        apiId,
        source,
        status: failure.status,
        trustedForPdf: false,
        error: failure.reason,
        sourceNote: failure.action,
      };
    }
  }

  for (const entry of input.manualEntries ?? []) {
    if (!entry.data) continue;
    entries[entry.apiId] = {
      apiId: entry.apiId,
      source: "manual",
      status: "manual_confirmed",
      trustedForPdf: true,
      data: entry.data,
    };
  }

  const payload: RegistryProvenancePayload = {
    schema: "aire.registry-provenance.v1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    parcelId: input.parcelId,
    totalCost: input.totalCost,
    isPaid: input.isPaid,
    pricingNote: input.pricingNote,
    entries,
  };
  if (input.candidateOptions && input.candidateOptions.length > 0) {
    payload.candidate_options = input.candidateOptions;
  }
  if (input.selectedCandidateIds && Object.keys(input.selectedCandidateIds).length > 0) {
    payload.selected_candidate_ids = input.selectedCandidateIds;
  }
  if (input.confirmedParcelIds && Object.keys(input.confirmedParcelIds).length > 0) {
    payload.confirmed_parcel_ids = input.confirmedParcelIds;
  }
  if (input.coordinateSource) {
    payload.coordinate_source = input.coordinateSource;
  }
  if (input.inferredReference) {
    payload.inferred_reference = input.inferredReference;
  }
  return payload;
}

function isCandidateParcelOption(value: unknown): value is CandidateParcelOption {
  if (!isRecord(value)) return false;
  return typeof value.candidate_id === "string" &&
    (value.parcel_type === "land" || value.parcel_type === "building") &&
    typeof value.normalized_parcel_id === "string";
}

export function extractCandidateOptions(payload: unknown): CandidateParcelOption[] {
  if (!isRegistryProvenancePayload(payload)) return [];
  const options = payload.candidate_options;
  if (!Array.isArray(options)) return [];
  return options.filter(isCandidateParcelOption);
}

export function extractTrustedRegistryData(payload: unknown): Record<string, unknown> {
  if (!isRegistryProvenancePayload(payload)) return {};

  const trusted: Record<string, unknown> = {};
  for (const [apiId, entry] of Object.entries(payload.entries)) {
    const validStatus = entry.status === "success" || entry.status === "manual_confirmed";
    const validSource = entry.source === "moi_api" || entry.source === "manual";
    if (!entry.trustedForPdf || !validStatus || !validSource || !hasRegistryData(entry.data)) continue;
    trusted[apiId] = entry.data;
  }
  return trusted;
}

export function extractPreSurveyRegistryData(payload: unknown): Record<string, unknown> {
  if (!isRegistryProvenancePayload(payload)) return {};

  const preview: Record<string, unknown> = {};
  for (const [apiId, entry] of Object.entries(payload.entries)) {
    const trustedEntry =
      entry.trustedForPdf &&
      (entry.status === "success" || entry.status === "manual_confirmed") &&
      (entry.source === "moi_api" || entry.source === "manual");
    const candidateEntry =
      entry.status === "candidate" && entry.source === "public_candidate";
    if ((!trustedEntry && !candidateEntry) || !hasRegistryData(entry.data)) continue;
    preview[apiId] = entry.data;
  }
  return preview;
}

export function extractRegistryFailureReasons(payload: unknown): Array<{
  apiId: string;
  status: Extract<RegistryStatus, "failed" | "unauthorized">;
  reason: string;
}> {
  if (!isRegistryProvenancePayload(payload)) return [];

  return Object.values(payload.entries)
    .filter((entry) => entry.status === "failed" || entry.status === "unauthorized")
    .map((entry) => ({
      apiId: entry.apiId,
      status: entry.status as Extract<RegistryStatus, "failed" | "unauthorized">,
      reason: entry.error?.trim() || "查詢未成功，請補件或人工確認",
    }));
}

export function normalizeRegistryPayloadForPreview(payload: unknown): Record<string, unknown> | null {
  if (!payload) return null;
  if (isRegistryProvenancePayload(payload)) {
    const preview = extractPreSurveyRegistryData(payload);
    return Object.keys(preview).length > 0 ? preview : null;
  }
  return isRecord(payload) ? payload : null;
}
