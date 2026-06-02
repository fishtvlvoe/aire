import type { ApiResult } from "@/lib/land-registry-api";
import { getFormalCopApiPrice } from "@/lib/formal-cop-api-set";

const COP_API_BASE_URL = "https://copapi.moi.gov.tw/cp/api";
const COP_TOKEN_ENDPOINT = "https://copapi.moi.gov.tw/cp/getToken";

export interface LocalFormalPullTarget {
  office_code?: string | null;
  section_code?: string | null;
  section_name?: string | null;
  land_no?: string | null;
  building_no?: string | null;
  registry_key?: string | null;
}

export interface LocalFormalPullInput {
  caseId: string;
  apiIds: string[];
  address?: string | null;
  clientId?: string;
  secret?: string;
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

const ADDRESS_TO_BUILDING_API_ID = "address_to_building";
const ADDRESS_TO_BUILDING_ENDPOINT = "/BuildingNo/1.0/QueryByAddress";
const BUILDING_APIS = new Set(["building_registry", "building_ownership", "building_other_rights"]);

export async function pullFormalRegistryLocally(input: LocalFormalPullInput): Promise<LocalFormalPullResult> {
  let officeCode = String(input.target.office_code ?? parseRegistryKeyPart(input.target.registry_key, 0) ?? "").trim();
  let sectionCode = String(input.target.section_code ?? parseRegistryKeyPart(input.target.registry_key, 1) ?? "").trim();
  const landNo = String(input.target.land_no ?? "").trim();
  let buildingNo = String(input.target.building_no ?? "").trim();
  const needsLandNo = input.apiIds.some((apiId) => !BUILDING_APIS.has(apiId));
  const needsBuildingNo = input.apiIds.some((apiId) => BUILDING_APIS.has(apiId));
  if (!officeCode || !sectionCode || (needsLandNo && !landNo)) {
    throw new Error("registry_match_required");
  }
  const clientId = String(input.clientId ?? "").trim();
  const secret = String(input.secret ?? "").trim();
  if (!clientId || !secret) {
    throw new Error("cop_credential_required");
  }

  const authorization = await resolveCopAuthorization(clientId, secret);
  const results: Record<string, ApiResult> = {};
  if (needsBuildingNo && input.address?.trim() && shouldResolveBuildingNoByAddress()) {
    const addressResolution = await resolveBuildingNoByAddress(authorization, input.address);
    results[ADDRESS_TO_BUILDING_API_ID] = addressResolution.result;
    if (!addressResolution.resolved) {
      return buildLocalFormalResult(results);
    }
    officeCode = addressResolution.resolved.officeCode;
    sectionCode = addressResolution.resolved.sectionCode;
    buildingNo = addressResolution.resolved.buildingNo;
  }

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
      const raw = await postCop(endpoint, authorization, [
        {
          unit: officeCode,
          sec: sectionCode,
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

  return buildLocalFormalResult(results);
}

function shouldResolveBuildingNoByAddress(): boolean {
  return process.env.AIRE_ENABLE_COP_ADDRESS_TO_BUILDING === "1";
}

function buildLocalFormalResult(results: Record<string, ApiResult>): LocalFormalPullResult {
  const totalCost = Object.entries(results).reduce((sum, [apiId, result]) => {
    if (apiId === ADDRESS_TO_BUILDING_API_ID || !result.success) return sum;
    return sum + getFormalCopApiPrice(apiId).unitPrice;
  }, 0);
  return {
    run_id: `local-web-${Date.now()}`,
    results,
    total_cost: totalCost,
    cache_hit: false,
    source_run_id: null,
  };
}

function parseRegistryKeyPart(registryKey: string | null | undefined, index: number): string | null {
  const parts = String(registryKey ?? "").split("-").map((part) => part.trim());
  return parts[index] || null;
}

async function resolveCopAuthorization(clientId: string, secret: string): Promise<string> {
  const basic = `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`;
  const tokenEndpoint = process.env.LAND_REGISTRY_TOKEN_ENDPOINT ?? COP_TOKEN_ENDPOINT;
  if (!tokenEndpoint.trim()) return basic;

  const response = await fetch(tokenEndpoint, {
    method: "GET",
    headers: {
      Authorization: basic,
      "Content-Type": "application/json; charset=utf-8",
    },
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`cop_token_http_${response.status}`);
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`cop_token_invalid_json_http_${response.status}_${summarizeNonJsonTokenBody(text)}`);
  }
  const accessToken = payload.access_token;
  if (typeof accessToken !== "string" || !accessToken.trim()) {
    throw new Error("cop_token_missing_access_token");
  }
  return `Bearer ${accessToken}`;
}

function summarizeNonJsonTokenBody(text: string): string {
  const title = text.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
  if (title) return `html_${title.replace(/\s+/g, "_").slice(0, 40)}`;
  return text.trim().startsWith("<") ? "html" : "text";
}

async function postCop(
  endpoint: string,
  authorization: string,
  payload: unknown,
): Promise<Record<string, unknown>> {
  const baseUrl = process.env.LAND_REGISTRY_API_BASE_URL || COP_API_BASE_URL;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
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

interface AddressBuildingResolution {
  result: ApiResult;
  resolved: {
    officeCode: string;
    sectionCode: string;
    buildingNo: string;
    address: string;
  } | null;
}

async function resolveBuildingNoByAddress(
  authorization: string,
  address: string,
): Promise<AddressBuildingResolution> {
  const city = inferCopCityCode(address);
  if (!city) {
    return addressBuildingFailure("無法判斷地址縣市代碼，未送出付費建物查詢");
  }

  try {
    const raw = await postCop(ADDRESS_TO_BUILDING_ENDPOINT, authorization, [
      {
        city,
        address,
        CITY: city,
        ADDRESS: address,
      },
    ]);
    if (raw.STATUS !== 1) {
      return addressBuildingFailure(String(raw.MESSAGE ?? raw.CODE ?? "address_to_building_failed"));
    }
    const first = Array.isArray(raw.RESPONSE) ? raw.RESPONSE[0] as Record<string, unknown> | undefined : undefined;
    const record = readRecord(first, "BLDGREG") ?? first ?? {};
    const officeCode = text(record, ["UNIT", "unit"]);
    const sectionCode = text(record, ["SEC", "sec"]);
    const buildingNo = text(record, ["NO", "no"]);
    const officialAddress = text(record, ["ADDRESS", "address"]) ?? "";
    if (!officeCode || !sectionCode || !buildingNo) {
      return addressBuildingFailure("門牌查建號沒有回傳完整 UNIT / SEC / NO，未送出付費建物查詢");
    }
    const mismatch = compareDoorplate(address, officialAddress);
    if (mismatch) {
      return addressBuildingFailure(
        `門牌查建號回傳門牌與案件地址不一致：案件是 ${address}，地政回傳是 ${officialAddress}，未送出付費建物查詢`,
      );
    }
    const data = {
      office_code: officeCode,
      section_code: sectionCode,
      building_number: buildingNo,
      address: officialAddress,
      raw,
    };
    return {
      result: {
        success: true,
        data,
        source: "api",
      },
      resolved: {
        officeCode,
        sectionCode,
        buildingNo,
        address: officialAddress,
      },
    };
  } catch (error) {
    return addressBuildingFailure(
      error instanceof Error ? error.message : "address_to_building_failed",
    );
  }
}

function addressBuildingFailure(reason: string): AddressBuildingResolution {
  return {
    result: {
      success: false,
      error: `門牌查建號失敗：${reason}`,
      source: "api",
    },
    resolved: null,
  };
}

function normalizeFormalData(apiId: string, raw: Record<string, unknown>): Record<string, unknown> {
  const first = Array.isArray(raw.RESPONSE) ? raw.RESPONSE[0] as Record<string, unknown> | undefined : undefined;
  if (apiId === "building_registry") {
    const record = readRecord(first, "BLDGREG") ?? {};
    return { ...normalizeBuildingRegistry(record), ...record, raw };
  }
  if (apiId === "building_ownership") {
    const rows = readArray(first, "BLDGOWNERSHIP") ?? [];
    const firstRow = rows.find(isRecord) as Record<string, unknown> | undefined;
    return { ...normalizeBuildingOwnership(firstRow), rows, raw };
  }
  if (apiId === "building_other_rights") {
    const rows =
      readArray(first, "BLDGOTHERIGHTS") ??
      readArray(first, "BUILDINGOTHERIGHTS") ??
      readArray(first, "BUILDOTHERIGHTS");
    return { ...normalizeOtherRights(rows ?? []), rows: rows ?? [], raw };
  }
  if (apiId === "land_registry" || apiId === "land_value") {
    const record = readRecord(first, "LANDREG") ?? {};
    return { ...normalizeLandRegistry(record), ...record, raw };
  }
  return { raw };
}

function inferCopCityCode(address: string): string | null {
  const normalized = address.replace(/^臺/, "台");
  const entries: Array<[RegExp, string]> = [
    [/台北市|臺北市/, "A"],
    [/台中市|臺中市/, "B"],
    [/基隆市/, "C"],
    [/台南市|臺南市/, "D"],
    [/高雄市/, "E"],
    [/新北市/, "F"],
    [/宜蘭縣/, "G"],
    [/桃園市/, "H"],
    [/嘉義市/, "I"],
    [/新竹縣/, "J"],
    [/苗栗縣/, "K"],
    [/南投縣/, "M"],
    [/彰化縣/, "N"],
    [/新竹市/, "O"],
    [/雲林縣/, "P"],
    [/嘉義縣/, "Q"],
    [/屏東縣/, "T"],
    [/花蓮縣/, "U"],
    [/台東縣|臺東縣/, "V"],
    [/金門縣/, "W"],
    [/澎湖縣/, "X"],
    [/連江縣/, "Z"],
  ];
  return entries.find(([pattern]) => pattern.test(normalized))?.[1] ?? null;
}

function compareDoorplate(expected: string, actual: string): string | null {
  const expectedKey = extractDoorplateKey(expected);
  const actualKey = extractDoorplateKey(actual);
  if (!expectedKey || !actualKey || expectedKey === actualKey) return null;
  return `${expectedKey} != ${actualKey}`;
}

function extractDoorplateKey(value: string): string | null {
  const normalized = toHalfWidthDigits(value)
    .replace(/臺/g, "台")
    .replace(/\s+/g, "");
  const lane = normalized.match(/(\d+)巷(?:(\d+)弄)?(\d+)號/);
  if (lane) return `${lane[1]}巷${lane[2] ? `${lane[2]}弄` : ""}${lane[3]}號`;
  const number = normalized.match(/(?:路|街|大道|段)(\d+)號/);
  return number ? `${number[1]}號` : null;
}

function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0),
  );
}

function normalizeBuildingRegistry(record: Record<string, unknown>): Record<string, unknown> {
  return {
    area: numberText(record, ["AREA"]),
    building_area: numberText(record, ["AREA"]),
    main_building_area: numberText(record, ["MAINAREA"]),
    auxiliary_area: sumRows(readArray(record, "FLOORACC") ?? [], ["FAREA_ABAREA", "ABAREA"]),
    common_area: sumRows(readArray(record, "SHAREDAREA") ?? [], ["SAREA"]),
    parking_area: numberText(record, ["PARKAREA"]),
    building_purpose: text(record, ["PURPOSE"]),
    material: text(record, ["MATERIAL"]),
    building_floor: text(record, ["BUILDINGFLOOR"]),
    construction_date: text(record, ["COMPLETEDATE"]),
    construction_company: text(record, ["CONBUILDNAME"]),
  };
}

function normalizeBuildingOwnership(row: Record<string, unknown> | undefined): Record<string, unknown> {
  const owner = isRecord(row?.OWNER) ? row.OWNER : {};
  return {
    owner_name: text(owner, ["LNAME"]),
    certificate_no: text(row, ["OWRNO"]),
    ownership_date: text(row, ["RDATE"]),
    registration_reason: text(row, ["REASON"]),
    reason_date: text(row, ["REASONDATE"]),
    right_type: text(row, ["RIGHT"]),
    numerator: text(row, ["NUMERATOR"]),
    denominator: text(row, ["DENOMINATOR"]),
    owner_identity_type: text(owner, ["LTYPE"]),
    owner_id: text(owner, ["LID"]),
    owner_address: text(owner, ["LADDR"]),
  };
}

function normalizeOtherRights(rows: unknown[]): Record<string, unknown> {
  const descriptions = rows
    .filter(isRecord)
    .map((row) => [
      text(row, ["RIGHTTYPE", "RIGHT"]),
      text(row, ["CREDITAMT", "AMOUNT"]),
      text(row, ["DURATION", "ENDDATE"]),
    ].filter(Boolean).join(" / "))
    .filter(Boolean);
  return {
    other_rights_detail: descriptions.join("；"),
  };
}

function normalizeLandRegistry(record: Record<string, unknown>): Record<string, unknown> {
  return {
    area: numberText(record, ["AREA"]),
    purpose: text(record, ["PURPOSE", "LANDUSE"]),
    section: text(record, ["SECNAME", "SECTION"]),
    lot_number: text(record, ["NO", "LOTNO"]),
    announced_value: numberText(record, ["ALVALUE", "ANNOUNCED_VALUE"]),
    assessed_value: numberText(record, ["ALPRICE", "ASSESSED_VALUE"]),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(source: unknown, keys: string[]): string | undefined {
  if (!isRecord(source)) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function numberText(source: unknown, keys: string[]): number | undefined {
  const value = text(source, keys);
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sumRows(rows: unknown[], keys: string[]): number | undefined {
  const total = rows.filter(isRecord).reduce((sum, row) => sum + (numberText(row, keys) ?? 0), 0);
  return total > 0 ? Math.round(total * 100) / 100 : undefined;
}

function readRecord(source: Record<string, unknown> | undefined, key: string): Record<string, unknown> | null {
  const value = source?.[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function readArray(source: Record<string, unknown> | undefined, key: string): unknown[] | null {
  const value = source?.[key];
  return Array.isArray(value) ? value : null;
}
