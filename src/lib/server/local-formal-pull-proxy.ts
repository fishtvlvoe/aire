import type { ApiResult } from "@/lib/land-registry-api";

const COP_API_BASE_URL = "https://copapi.moi.gov.tw/cp/api";

export interface LocalFormalPullTarget {
  section_name?: string | null;
  land_no?: string | null;
  building_no?: string | null;
}

export interface LocalFormalPullInput {
  caseId: string;
  apiIds: string[];
  clientId: string;
  secret: string;
  target: LocalFormalPullTarget;
}

export interface LocalFormalPullResult {
  run_id: string;
  results: Record<string, ApiResult>;
  total_cost: number;
  cache_hit: false;
  source_run_id: null;
}

const API_ENDPOINTS: Record<string, string> = {
  land_registry: "/LandDescription/1.0/QueryByLandNo",
  land_value: "/LandDescription/1.0/QueryByLandNo",
  building_registry: "/BuildingDescription/1.0/QueryByBuildNo",
  building_ownership: "/BuildingOwnership/1.0/QueryByLimit",
  building_other_rights: "/BuildingOtherRights/1.0/QueryByLimit",
};

const BUILDING_APIS = new Set(["building_registry", "building_ownership", "building_other_rights"]);

export async function pullFormalRegistryLocally(input: LocalFormalPullInput): Promise<LocalFormalPullResult> {
  const sectionName = String(input.target.section_name ?? "").trim();
  const landNo = String(input.target.land_no ?? "").trim();
  const buildingNo = String(input.target.building_no ?? "").trim();
  if (!sectionName || !landNo) {
    throw new Error("registry_match_required");
  }
  if (!input.clientId.trim() || !input.secret.trim()) {
    throw new Error("cop_credential_required");
  }

  const results: Record<string, ApiResult> = {};
  for (const apiId of input.apiIds) {
    const endpoint = API_ENDPOINTS[apiId];
    if (!endpoint) {
      results[apiId] = {
        success: false,
        error: "unsupported_local_formal_api",
        source: "api",
      };
      continue;
    }
    if (BUILDING_APIS.has(apiId) && !buildingNo) {
      results[apiId] = {
        success: false,
        error: "registry_match_required",
        source: "api",
      };
      continue;
    }

    try {
      const raw = await postCop(endpoint, input.clientId, input.secret, [
        {
          unit: sectionName,
          sec: landNo,
          no: BUILDING_APIS.has(apiId) ? buildingNo : landNo,
          ...(apiId === "building_ownership" || apiId === "building_other_rights"
            ? { offset: 1, limit: 100 }
            : {}),
        },
      ]);
      results[apiId] = {
        success: raw.STATUS === 1,
        data: normalizeFormalData(apiId, raw),
        error: raw.STATUS === 1 ? undefined : String(raw.MESSAGE ?? raw.CODE ?? "cop_query_failed"),
        source: "api",
      };
    } catch (error) {
      results[apiId] = {
        success: false,
        error: error instanceof Error ? error.message : "cop_query_failed",
        source: "api",
      };
    }
  }

  return {
    run_id: `local-web-${Date.now()}`,
    results,
    total_cost: Object.values(results).filter((result) => result.success).length * 10,
    cache_hit: false,
    source_run_id: null,
  };
}

async function postCop(
  endpoint: string,
  clientId: string,
  secret: string,
  payload: unknown,
): Promise<Record<string, unknown>> {
  const baseUrl = process.env.LAND_REGISTRY_API_BASE_URL || COP_API_BASE_URL;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`cop_http_${response.status}`);
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("cop_invalid_json");
  }
}

function normalizeFormalData(apiId: string, raw: Record<string, unknown>): Record<string, unknown> {
  const first = Array.isArray(raw.RESPONSE) ? raw.RESPONSE[0] as Record<string, unknown> | undefined : undefined;
  if (apiId === "building_registry") {
    return { ...(readRecord(first, "BLDGREG") ?? {}), raw };
  }
  if (apiId === "building_ownership") {
    const rows = readArray(first, "BLDGOWNERSHIP");
    return { rows, raw };
  }
  if (apiId === "building_other_rights") {
    const rows =
      readArray(first, "BLDGOTHERIGHTS") ??
      readArray(first, "BUILDINGOTHERIGHTS") ??
      readArray(first, "BUILDOTHERIGHTS");
    return { rows: rows ?? [], raw };
  }
  if (apiId === "land_registry" || apiId === "land_value") {
    return { ...(readRecord(first, "LANDREG") ?? {}), raw };
  }
  return { raw };
}

function readRecord(source: Record<string, unknown> | undefined, key: string): Record<string, unknown> | null {
  const value = source?.[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readArray(source: Record<string, unknown> | undefined, key: string): unknown[] | null {
  const value = source?.[key];
  return Array.isArray(value) ? value : null;
}
