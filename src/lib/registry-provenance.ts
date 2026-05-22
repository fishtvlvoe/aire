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
  data?: Record<string, unknown>;
  error?: string;
  sourceNote?: string;
}

export interface RegistryProvenancePayload extends Record<string, unknown> {
  schema: "aire.registry-provenance.v1";
  generatedAt: string;
  parcelId?: string;
  totalCost?: number;
  entries: Record<string, RegistryProvenanceEntry>;
}

type ApiLikeResult = {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  source?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

export function createRegistryProvenancePayload(input: {
  parcelId?: string;
  totalCost?: number;
  results?: Record<string, ApiLikeResult>;
  manualEntries?: Array<{ apiId: string; data: Record<string, unknown> | null }>;
  generatedAt?: string;
}): RegistryProvenancePayload {
  const entries: Record<string, RegistryProvenanceEntry> = {};

  for (const [apiId, result] of Object.entries(input.results ?? {})) {
    const source = trustedSourceForApiResult(result.source);
    const trustedForPdf = result.success && source === "moi_api" && isRecord(result.data);
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
    if (result.success && source === "public_candidate" && isRecord(result.data)) {
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
    if (result.success && source === "raw_probe" && isRecord(result.data)) {
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
      entries[apiId] = {
        apiId,
        source,
        status: "failed",
        trustedForPdf: false,
        error: result.error,
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

  return {
    schema: "aire.registry-provenance.v1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    parcelId: input.parcelId,
    totalCost: input.totalCost,
    entries,
  };
}

export function extractTrustedRegistryData(payload: unknown): Record<string, unknown> {
  if (!isRegistryProvenancePayload(payload)) return {};

  const trusted: Record<string, unknown> = {};
  for (const [apiId, entry] of Object.entries(payload.entries)) {
    const validStatus = entry.status === "success" || entry.status === "manual_confirmed";
    const validSource = entry.source === "moi_api" || entry.source === "manual";
    if (!entry.trustedForPdf || !validStatus || !validSource || !isRecord(entry.data)) continue;
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
    if ((!trustedEntry && !candidateEntry) || !isRecord(entry.data)) continue;
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
