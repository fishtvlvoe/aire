import * as https from "node:https";
import type { ParcelInfo } from "@/lib/land-registry-api";
import { mockInvoke } from "@/lib/mock-backend";
import {
  classifyDiscoveryInput,
  suggestDiscoveryCorrections,
  type DiscoveryCorrectionSuggestion,
  type DiscoveryIntendedObjectType,
  type DiscoveryInputKind,
  type DiscoverySelectionState,
  type ParsedDiscoveryInput,
} from "@/lib/registry-discovery-contract";

const EASYMAP_BASE_URL = "https://easymap.moi.gov.tw/R02";

export type AddressDiscoveryStatus = "candidate_found" | "manual_required";

export interface DiscoveryError {
  source: string;
  code: string;
  message: string;
}

export interface AddressDiscoveryResult {
  status: AddressDiscoveryStatus;
  source: "local_discovery";
  normalizedAddress: string;
  candidates: ParcelInfo[];
  errors: DiscoveryError[];
  trustedForPdf: false;
  totalCostCents: 0;
  total_cost_cents: 0;
  cacheHit: boolean;
  sourceRunId: string | null;
  inputKind: DiscoveryInputKind;
  intendedObjectType: DiscoveryIntendedObjectType;
  parsedInput: ParsedDiscoveryInput;
  requiresCandidateSelection: boolean;
  candidateSelection: {
    state: DiscoverySelectionState;
    selectedRegistryKey: string | null;
  };
  suggestedCorrections: DiscoveryCorrectionSuggestion[];
}

interface RegistryQueryRun {
  source_input?: string;
  candidate_json?: {
    errors?: DiscoveryError[] | null;
  };
  total_cost_cents?: number;
}

interface EasyMapAddressParts {
  cityName: string;
  cityCode: string;
  townName: string;
  roadName: string;
  laneName: string;
  alleyName: string;
  no: string;
  floorNumber: string;
  floorUnit: string;
}

interface EasyMapDoorplate {
  doorplate: string;
}

interface EasyMapDoorCandidate {
  doorplate: string;
  sourceDoorplate: string;
  cityCode: string;
  townCode: string;
  office: string;
  sectionCode: string;
  sectionName: string;
  landNo: string;
  buildingSectionCode: string;
  buildingNo: string;
  mergeSameDoorCount: number;
}

interface EasyMapDoorCoordinate {
  lat: number;
  lng: number;
}

interface EasyMapLandCandidate {
  cityName: string;
  townName: string;
  cityCode: string;
  townCode: string;
  office: string;
  sectionCode: string;
  sectionName: string;
  landNo: string;
}

interface EasyMapLandDescription {
  buildingNumbers: string[];
  landAreaSqm: string | null;
  announcedLandCurrentValue: string | null;
  announcedLandValue: string | null;
}

interface EasyMapBuildingDescription {
  administrativeDistrict: string | null;
  landOffice: string | null;
  sectionCode: string | null;
  sectionName: string | null;
  buildingNo: string | null;
  buildingAreaSqm: string | null;
  totalFloorCount: string | null;
  floorLabel: string | null;
  completionDateRoc: string | null;
  ageYears: string | null;
  mainUse: string | null;
}

interface EasyMapTownOption {
  id: string;
  name: string;
}

interface EasyMapSectionContext {
  cityName: string;
  townName: string;
  cityCode: string;
  townCode: string;
}

interface EasyMapDiscoveryPayload {
  candidates: ParcelInfo[];
  errors: DiscoveryError[];
}

class EasyMapUpstreamError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "EasyMapUpstreamError";
  }
}

class EasyMapClient {
  private cookies = new Map<string, string>();

  async discover(address: string): Promise<EasyMapDiscoveryPayload> {
    const classification = classifyDiscoveryInput(address);
    if (classification.inputKind === "land_descriptor") {
      return this.discoverLandDescriptor(address, classification.parsedInput);
    }
    if (classification.inputKind !== "doorplate") {
      throw new Error("address_parse_failed");
    }
    return this.discoverDoorplate(address);
  }

  private async discoverDoorplate(address: string): Promise<EasyMapDiscoveryPayload> {
    const parts = parseTaiwanAddress(address);
    if (!parts) {
      throw new Error("address_parse_failed");
    }

    await this.requestText("/Index", { method: "GET", withToken: false });
    const townCode = await this.resolveTownCode(parts.cityCode, parts.townName);
    const token = await this.loadToken();
    const listPayload = await this.requestText("/Door_json_getDoorList", {
      method: "POST",
      token,
      body: {
        city: parts.cityCode,
        area: townCode,
        road: parts.roadName,
        doorPlate: parts.roadName,
        doorPlateType: "A",
        lane: parts.laneName,
        alley: parts.alleyName,
        no: parts.no,
        cityName: parts.cityName,
        townName: parts.townName,
      },
    });
    const parentCandidates = parseEasyMapDoorCandidateListPayload(listPayload);
    const parent = pickBestDoorCandidate(parentCandidates, address);
    if (!parent) {
      return { candidates: [], errors: [] };
    }

    let candidates = [parent];
    if (parent.mergeSameDoorCount > 0) {
      const fullPayload = await this.requestText("/Door_json_getFullDoorListByA", {
        method: "POST",
        token: await this.loadToken(),
        body: {
          city: parent.cityCode || parts.cityCode,
          area: parent.townCode,
          doorPlate: parent.sourceDoorplate || parent.doorplate,
          doorPlateType: "A",
        },
      });
      const fullCandidates = parseEasyMapDoorCandidateListPayload(fullPayload);
      if (fullCandidates.length > 0) {
        candidates = fullCandidates;
      }
    }

    const selectedCandidates = selectDoorCandidatesForAddress(candidates, address);
    const parcels: ParcelInfo[] = [];
    for (const candidate of selectedCandidates.slice(0, 20)) {
      const description = await this.loadBuildingDescription(candidate);
      const coordinate = await this.loadLandCenterCoordinate(candidate);
      parcels.push(buildDoorParcel(address, candidate, description, coordinate));
    }
    return {
      candidates: normalizeParcelCandidateMetadata(parcels),
      errors: [],
    };
  }

  private async loadBuildingDescription(candidate: EasyMapDoorCandidate): Promise<EasyMapBuildingDescription> {
    try {
      const html = await this.requestText("/BuildingDesc_ajax_detail", {
        method: "POST",
        token: await this.loadToken(),
        body: {
          office: candidate.office,
          sectNo: candidate.buildingSectionCode || candidate.sectionCode,
          buildingNo: candidate.buildingNo,
        },
      });
      return parseEasyMapBuildingDescriptionHtml(html);
    } catch {
      return emptyBuildingDescription();
    }
  }

  private async loadLandCenterCoordinate(
    candidate: EasyMapDoorCandidate,
  ): Promise<EasyMapDoorCoordinate | null> {
    try {
      const payload = await this.requestText("/Map_json_getMapCenter", {
        method: "POST",
        token: await this.loadToken(),
        body: {
          office: candidate.office,
          sectNo: firstListValue(candidate.sectionCode),
          landNo: firstListValue(candidate.landNo),
          qryResult: "M2",
        },
      });
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      const lng = typeof parsed.X === "number" ? parsed.X : Number(parsed.X);
      const lat = typeof parsed.Y === "number" ? parsed.Y : Number(parsed.Y);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    } catch {
      return null;
    }
  }

  private async loadLandDescription(landCandidate: EasyMapLandCandidate): Promise<{
    description: EasyMapLandDescription;
    errors: DiscoveryError[];
  }> {
    try {
      const landDescriptionHtml = await this.requestText("/LandDesc_ajax_detail", {
        method: "POST",
        token: await this.loadToken(),
        body: {
          cityCode: landCandidate.cityCode,
          townCode: landCandidate.townCode,
          office: landCandidate.office,
          sectNo: landCandidate.sectionCode,
          landNo: formatEasyMapLandNoForDetail(landCandidate.landNo),
        },
      });
      return {
        description: parseEasyMapLandDescriptionHtml(landDescriptionHtml),
        errors: [],
      };
    } catch (error) {
      return {
        description: emptyLandDescription(),
        errors: [normalizeEasyMapUpstreamError(error)],
      };
    }
  }

  private async discoverLandDescriptor(address: string, parsedInput: ParsedDiscoveryInput): Promise<EasyMapDiscoveryPayload> {
    const cityName = parsedInput.cityName?.replace(/^台/, "臺") ?? "";
    const townName = parsedInput.districtName ?? "";
    const sectionName = parsedInput.sectionName ?? "";
    const landNo = normalizeLandNo(parsedInput.landNumber);
    const cityCode = CITY_CODE_BY_NAME[cityName] ?? CITY_CODE_BY_NAME[cityName.replace(/^臺/, "台")];
    if (!cityName || !townName || !sectionName || !landNo || !cityCode) {
      throw new Error("land_descriptor_parse_failed");
    }

    await this.requestText("/Index", { method: "GET", withToken: false });
    const townCode = await this.resolveTownCode(cityCode, townName);
    const sectionPayload = await this.requestText("/City_json_getSectionList", {
      method: "POST",
      token: await this.loadToken(),
      body: {
        cityCode,
        area: townCode,
      },
    });
    const section = parseEasyMapSectionListPayload(sectionPayload, sectionName, {
      cityName,
      townName,
      cityCode,
      townCode,
    });
    if (!section) {
      return { candidates: [], errors: [] };
    }

    let locatedLand = { ...section, landNo };
    try {
      const locatePayload = await this.requestText("/Land_json_locate", {
        method: "POST",
        token: await this.loadToken(),
        body: {
          cityName: section.cityName || cityName,
          townName: section.townName || townName,
          cityCode: section.cityCode || cityCode,
          townCode: section.townCode,
          office: section.office,
          sectNo: section.sectionCode,
          landNo: formatEasyMapLandNoForDetail(landNo),
        },
      });
      locatedLand = parseEasyMapLandByCoordinatePayload(locatePayload) ?? locatedLand;
    } catch {
      // Old R02 can return 500 for map locating while LandDesc_ajax_detail still returns the parcel attributes.
    }

    const landDescription = await this.loadLandDescription(locatedLand);
    return {
      candidates: buildEasyMapLandParcels(address, locatedLand, landDescription.description),
      errors: landDescription.errors,
    };
  }

  private async resolveTownCode(cityCode: string, townName: string): Promise<string> {
    const fallbackCode = lookupKnownTownCode(cityCode, townName);
    // 取 cityName 做反查（R02 的 getTownList 需要 cityName + doorPlateType 才會回傳完整鄉鎮清單）
    const cityName = Object.entries(CITY_CODE_BY_NAME).find(([, code]) => code === cityCode)?.[0] ?? "";
    try {
      const payload = await this.requestText("/City_json_getTownList", {
        method: "POST",
        token: await this.loadToken(),
        body: {
          cityCode,
          cityName,
          doorPlateType: "A", // A = 地政門牌（預設）
        },
      });
      const towns = parseEasyMapTownListPayload(payload);
      const normalizedTarget = normalizeAdministrativeName(townName);
      const town = towns.find((item) => normalizeAdministrativeName(item.name) === normalizedTarget);
      if (town) {
        return town.id;
      }
      // 省轄市（新竹市、嘉義市、基隆市等）全市共用單一地政事務所，
      // getTownList 只回 [{id, name:市名}] 一筆、不分區，找不到區名屬正常 → 用唯一那筆。
      // 直轄市/縣回多筆各區，上面 find 已精確命中，不會落到這裡。
      if (towns.length === 1) {
        return towns[0].id;
      }
    } catch (err) {
      // R02 occasionally rejects town-list token requests; known codes keep zero-cost discovery usable.
      console.error("[resolveTownCode] getTownList failed:", err);
    }
    if (fallbackCode) return fallbackCode;
    throw new Error("easymap_town_not_found");
  }

  private async loadToken(): Promise<string> {
    const html = await this.requestText("/pages/setToken.jsp", { method: "POST", withToken: false });
    const token = html.match(/name=["']token["']\s+value=["']([^"']+)["']/)?.[1];
    if (!token) {
      throw new Error("easymap_token_missing");
    }
    return token;
  }

  private async requestJson<T>(path: string, options: EasyMapRequestOptions): Promise<T> {
    const text = await this.requestText(path, options);
    return JSON.parse(text) as T;
  }

  private async requestText(path: string, options: EasyMapRequestOptions): Promise<string> {
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(options.body ?? {})) {
      body.set(key, value);
    }
    if (options.token) {
      body.set("struts.token.name", "token");
      body.set("token", options.token);
    }
    if (process.env.NODE_ENV !== "test") {
      return this.requestTextWithNodeHttps(path, options, body);
    }

    const response = await fetch(`${EASYMAP_BASE_URL}${path}`, {
      method: options.method,
      headers: {
        accept: options.method === "POST" ? "application/json, text/javascript, text/html, */*; q=0.01" : "text/html,*/*",
        referer: `${EASYMAP_BASE_URL}/Index`,
        "user-agent": "Mozilla/5.0 AIRE-local-discovery",
        ...(options.method === "POST" ? { "x-requested-with": "XMLHttpRequest" } : {}),
        ...(options.method === "POST" ? { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" } : {}),
        ...(this.cookieHeader() ? { cookie: this.cookieHeader() } : {}),
      },
      body: options.method === "POST" ? body : undefined,
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    this.storeCookies(response.headers);
    const text = await response.text();
    if (text.trim().toUpperCase() === "PERMISSION DENIED") {
      throw new EasyMapUpstreamError(
        "easymap_permission_denied",
        `EasyMap R02 denied ${path} with http_status=${response.status}`,
      );
    }
    if (!response.ok) {
      throw new EasyMapUpstreamError(
        `easymap_http_${response.status}`,
        `EasyMap R02 ${path} returned http_status=${response.status}`,
      );
    }
    return text;
  }

  private async requestTextWithNodeHttps(
    path: string,
    options: EasyMapRequestOptions,
    body: URLSearchParams,
  ): Promise<string> {
    const url = new URL(`${EASYMAP_BASE_URL}${path}`);
    const bodyText = body.toString();
    const headers: Record<string, string | number> = {
      accept: options.method === "POST" ? "application/json, text/javascript, text/html, */*; q=0.01" : "text/html,*/*",
      referer: `${EASYMAP_BASE_URL}/Index`,
      "user-agent": "Mozilla/5.0 AIRE-local-discovery",
      ...(this.cookieHeader() ? { cookie: this.cookieHeader() } : {}),
    };
    if (options.method === "POST") {
      headers["content-type"] = "application/x-www-form-urlencoded;charset=UTF-8";
      headers["content-length"] = Buffer.byteLength(bodyText);
      headers["x-requested-with"] = "XMLHttpRequest";
    }

    return await new Promise<string>((resolve, reject) => {
      const request = https.request(
        url,
        {
          method: options.method,
          headers,
          timeout: 8000,
        },
        (response) => {
          for (const value of response.headers["set-cookie"] ?? []) {
            this.storeCookieValue(value);
          }
          const chunks: Buffer[] = [];
          response.on("data", (chunk: Buffer) => chunks.push(chunk));
          response.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            if (text.trim().toUpperCase() === "PERMISSION DENIED") {
              reject(new EasyMapUpstreamError(
                "easymap_permission_denied",
                `EasyMap R02 denied ${path} with http_status=${response.statusCode ?? 0}`,
              ));
              return;
            }
            if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
              reject(new EasyMapUpstreamError(
                `easymap_http_${response.statusCode ?? 0}`,
                `EasyMap R02 ${path} returned http_status=${response.statusCode ?? 0}: ${summarizeUpstreamText(text)}`,
              ));
              return;
            }
            resolve(text);
          });
        },
      );
      request.on("timeout", () => {
        request.destroy(new Error(`EasyMap R02 ${path} timed out`));
      });
      request.on("error", reject);
      if (options.method === "POST") {
        request.write(bodyText);
      }
      request.end();
    });
  }

  private cookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }

  private storeCookies(headers: Headers): void {
    const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
    const values = getSetCookie ? getSetCookie.call(headers) : splitSetCookieHeader(headers.get("set-cookie"));
    for (const value of values) {
      const [pair] = value.split(";");
      const index = pair.indexOf("=");
      if (index <= 0) continue;
      this.cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
    }
  }

  private storeCookieValue(value: string): void {
    const [pair] = value.split(";");
    const index = pair.indexOf("=");
    if (index <= 0) return;
    this.cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }
}

interface EasyMapRequestOptions {
  method: "GET" | "POST";
  withToken?: boolean;
  token?: string;
  body?: Record<string, string>;
}

function normalizeAddress(value: string): string {
  return (value ?? "").trim();
}

function normalizeAddressForMatch(value: string): string {
  return toHalfWidthDigits(value)
    .replace(/臺/g, "台")
    .replace(/[里鄰\s]/g, "")
    .replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .trim();
}

function fallbackManualResult(address: string, error?: DiscoveryError): AddressDiscoveryResult {
  const normalized = normalizeAddress(address);
  const classification = classifyDiscoveryInput(normalized);
  const message = normalized
    ? "本機環境無法取得可直接補齊的地址候選，請先人工確認地段、地號、建號"
    : "請先輸入完整地址";
  return {
    status: "manual_required",
    source: "local_discovery",
    normalizedAddress: normalized,
    candidates: [],
    errors: [
      error ?? {
        source: "local_discovery",
        code: "local_proxy_manual_required",
        message,
      },
    ],
    trustedForPdf: false,
    totalCostCents: 0,
    total_cost_cents: 0,
    cacheHit: false,
    sourceRunId: null,
    inputKind: classification.inputKind,
    intendedObjectType: classification.intendedObjectType,
    parsedInput: classification.parsedInput,
    requiresCandidateSelection: false,
    candidateSelection: {
      state: "not_required",
      selectedRegistryKey: null,
    },
    suggestedCorrections: suggestDiscoveryCorrections(normalized),
  };
}

function normalizeEasyMapUpstreamError(error: unknown): DiscoveryError {
  if (error instanceof EasyMapUpstreamError) {
    return {
      source: "easymap_r02",
      code: error.code,
      message: error.message,
    };
  }
  return {
    source: "easymap_r02",
    code: "easymap_r02_unavailable",
    message: error instanceof Error ? error.message : "地址資料需要人工確認",
  };
}

async function getLatestDiscoveryRun(address: string): Promise<RegistryQueryRun | null> {
  const normalized = normalizeAddress(address);
  const runs = await mockInvoke<RegistryQueryRun[]>("list_registry_query_runs", {});
  if (!Array.isArray(runs)) return null;
  return runs.find((run) => normalizeAddress(String(run.source_input ?? "")) === normalized) ?? runs[0] ?? null;
}

export async function discoverAddressLocally(address: string): Promise<AddressDiscoveryResult> {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return fallbackManualResult(normalized);
  }

  try {
    const discovery = await new EasyMapClient().discover(normalized);
    const candidates = discovery.candidates;
    if (candidates.length > 0) {
      const classification = classifyDiscoveryInput(normalized);
      return {
        status: "candidate_found",
        source: "local_discovery",
        normalizedAddress: normalized,
        candidates,
        errors: discovery.errors,
        trustedForPdf: false,
        totalCostCents: 0,
        total_cost_cents: 0,
        cacheHit: false,
        sourceRunId: null,
        inputKind: classification.inputKind,
        intendedObjectType: classification.intendedObjectType,
        parsedInput: classification.parsedInput,
        requiresCandidateSelection: candidates.length > 1,
        candidateSelection: {
          state: candidates.length > 1 ? "required" : "not_required",
          selectedRegistryKey: null,
        },
        suggestedCorrections: suggestDiscoveryCorrections(normalized),
      };
    }
  } catch (error) {
    const fallbackRun = await getLatestDiscoveryRun(normalized);
    const runError = fallbackRun?.candidate_json?.errors?.[0];
    return fallbackManualResult(normalized, runError ?? {
      source: "easymap_r02",
      code: "easymap_r02_unavailable",
      message: error instanceof Error ? error.message : "地址資料需要人工確認",
    });
  }

  const run = await getLatestDiscoveryRun(normalized);
  const runErrors = run?.candidate_json?.errors ?? [];
  const statusError =
    runErrors[0] ??
    {
      source: "easymap_r02",
      code: "easymap_r02_no_candidate",
      message: "查不到可直接補齊的地址候選，請人工確認地段、地號、建號",
    };

  return fallbackManualResult(normalized, statusError);
}

export function parseEasyMapLandByCoordinatePayload(payload: string): EasyMapLandCandidate | null {
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (String(json.exec ?? "").toLowerCase() !== "true") return null;
  const cityName = pickString(json, "cityName");
  const townName = pickString(json, "townName");
  const cityCode = pickString(json, "cityCode");
  const townCode = pickString(json, "townCode");
  const office = pickString(json, "office");
  const sectionCode = pickString(json, "sectNo");
  const sectionName = pickString(json, "sectName");
  const landNo = normalizeLandNo(pickString(json, "landNo"));
  if (!cityName || !townName || !cityCode || !townCode || !office || !sectionCode || !sectionName || !landNo) {
    return null;
  }
  return { cityName, townName, cityCode, townCode, office, sectionCode, sectionName, landNo };
}

export function parseEasyMapSectionListPayload(
  payload: string,
  targetSectionName: string,
  context?: EasyMapSectionContext,
): EasyMapLandCandidate | null {
  let json: unknown;
  try {
    json = JSON.parse(payload) as unknown;
  } catch {
    return null;
  }
  const target = normalizeSectionName(targetSectionName);
  const candidates = collectSectionCandidates(json, context);
  const matched =
    candidates.find((candidate) => normalizeSectionName(candidate.sectionName) === target) ??
    candidates.find((candidate) => normalizeSectionName(candidate.sectionName).includes(target) || target.includes(normalizeSectionName(candidate.sectionName))) ??
    candidates[0] ??
    null;
  if (!matched) return null;
  return { ...matched, landNo: "" };
}

export function parseEasyMapTownListPayload(payload: string): EasyMapTownOption[] {
  let json: unknown;
  try {
    json = JSON.parse(payload) as unknown;
  } catch {
    return [];
  }
  if (!Array.isArray(json)) return [];
  return json
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const id = pickString(record, "id");
      const name = pickString(record, "name");
      return id && name ? { id, name } : null;
    })
    .filter((item): item is EasyMapTownOption => item !== null);
}

export function parseEasyMapLandDescriptionHtml(html: string): EasyMapLandDescription {
  const buildingNumbers = Array.from(html.matchAll(/getBuildDetail\('[^']*','[^']*','(\d{8})'/g))
    .map((match) => match[1])
    .filter((value, index, values) => value && values.indexOf(value) === index);
  const rows = parseHtmlTableRows(html);
  return {
    buildingNumbers,
    landAreaSqm: firstNumericText(rows["面積"]),
    announcedLandCurrentValue: firstNumericText(rows["公告土地現值"] ?? rows["公告現值"]),
    announcedLandValue: firstNumericText(rows["公告土地地價"] ?? rows["公告地價"]),
  };
}

export function parseEasyMapBuildingDescriptionHtml(html: string): EasyMapBuildingDescription {
  const rows = parseHtmlTableRows(html);
  const section = splitSection(rows["地段"]);
  const completion = rows["建物完成日期"] ?? null;
  return {
    administrativeDistrict: rows["行政區"] ?? null,
    landOffice: rows["地政事務所"] ?? null,
    sectionCode: section.code,
    sectionName: section.name,
    buildingNo: firstDigits(rows["建號"]),
    buildingAreaSqm: firstNumericText(rows["建物面積"]),
    totalFloorCount: firstDigits(rows["樓層數"]),
    floorLabel: rows["樓層別"] ?? null,
    completionDateRoc: firstDigits(completion),
    ageYears: completion?.match(/屋齡[:：]?約?\s*(\d+)年/)?.[1] ?? null,
    mainUse: rows["主要用途"] ?? null,
  };
}

function emptyBuildingDescription(): EasyMapBuildingDescription {
  return {
    administrativeDistrict: null,
    landOffice: null,
    sectionCode: null,
    sectionName: null,
    buildingNo: null,
    buildingAreaSqm: null,
    totalFloorCount: null,
    floorLabel: null,
    completionDateRoc: null,
    ageYears: null,
    mainUse: null,
  };
}

function emptyLandDescription(): EasyMapLandDescription {
  return {
    buildingNumbers: [],
    landAreaSqm: null,
    announcedLandCurrentValue: null,
    announcedLandValue: null,
  };
}

function parseHtmlTableRows(html: string): Record<string, string> {
  const rows: Record<string, string> = {};
  for (const row of html.match(/<tr[\s\S]*?<\/tr>/g) ?? []) {
    const cells = Array.from(row.matchAll(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/g))
      .map((match) => decodeHtml(stripHtml(match[1])))
      .filter(Boolean);
    if (cells.length >= 2) {
      rows[cells[0]] = cells[1];
    }
  }
  return rows;
}

function parseEasyMapDoorCandidateListPayload(payload: string): EasyMapDoorCandidate[] {
  let json: unknown;
  try {
    json = JSON.parse(payload) as unknown;
  } catch {
    return [];
  }
  const results = Array.isArray((json as Record<string, unknown>)?.results)
    ? ((json as Record<string, unknown>).results as unknown[])
    : [];
  return results
    .map(parseEasyMapDoorCandidate)
    .filter((candidate): candidate is EasyMapDoorCandidate => candidate !== null);
}

function parseEasyMapDoorCandidate(input: unknown): EasyMapDoorCandidate | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const doorplate = pickString(record, "Road") ?? pickString(record, "road") ?? "";
  const sourceDoorplate = pickString(record, "srcRoad") ?? doorplate;
  const office = pickString(record, "office") ?? "";
  const sectionCode = firstListValue(pickString(record, "sectno") ?? "");
  const sectionName = pickString(record, "sectName") ?? "";
  const landNo = firstListValue(pickString(record, "landno") ?? "");
  const buildingNo = pickString(record, "buildno") ?? "";
  if (!doorplate || !office || !sectionCode) return null;
  return {
    doorplate,
    sourceDoorplate,
    cityCode: pickString(record, "City") ?? "",
    townCode: pickString(record, "towncode") ?? "",
    office,
    sectionCode,
    sectionName,
    landNo,
    buildingSectionCode: pickString(record, "buildsectno") ?? sectionCode,
    buildingNo,
    mergeSameDoorCount: Number(record.mergeSameDoorCount ?? 0) || 0,
  };
}

function collectSectionCandidates(input: unknown, context?: EasyMapSectionContext): EasyMapLandCandidate[] {
  if (Array.isArray(input)) {
    return input.flatMap((item) => collectSectionCandidates(item, context));
  }
  if (!input || typeof input !== "object") {
    return [];
  }

  const record = input as Record<string, unknown>;
  const sectionCode = pickString(record, "sectNo") ?? pickString(record, "sectionCode") ?? pickString(record, "id");
  const sectionName = pickString(record, "sectName") ?? pickString(record, "sectionName") ?? pickString(record, "name");
  const cityName = pickString(record, "cityName") ?? context?.cityName ?? null;
  const townName = pickString(record, "townName") ?? context?.townName ?? null;
  const cityCode = pickString(record, "cityCode") ?? context?.cityCode ?? null;
  const townCode = pickString(record, "townCode") ?? context?.townCode ?? null;
  const office = pickString(record, "office") ?? pickString(record, "officeCode");
  const current =
    cityName && townName && cityCode && townCode && office && sectionCode && sectionName
      ? [{ cityName, townName, cityCode, townCode, office, sectionCode, sectionName, landNo: "" }]
      : [];

  return [
    ...current,
    ...Object.values(record).flatMap((value) => collectSectionCandidates(value, context)),
  ];
}

function normalizeSectionName(value: string): string {
  return value.trim().replace(/\s+/g, "").replace(/^臺/, "台");
}

function normalizeAdministrativeName(value: string): string {
  return value.trim().replace(/\s+/g, "").replace(/^臺/, "台");
}

function lookupKnownTownCode(cityCode: string, townName: string): string | null {
  const key = `${cityCode}:${normalizeAdministrativeName(townName)}`;
  return KNOWN_R02_TOWN_CODES[key] ?? null;
}

function pickBestDoorplate(items: EasyMapDoorplate[], address: string): EasyMapDoorplate | null {
  if (items.length === 0) return null;
  const targetParts = parseTaiwanAddress(address);
  if (targetParts) {
    const exact = items.find((item) => {
      const itemParts = parseTaiwanAddress(item.doorplate);
      return (
        itemParts?.cityCode === targetParts.cityCode &&
        itemParts.townName === targetParts.townName &&
        itemParts.roadName === targetParts.roadName &&
        itemParts.laneName === targetParts.laneName &&
        itemParts.alleyName === targetParts.alleyName &&
        itemParts.no === targetParts.no
      );
    });
    if (exact) return exact;
  }
  const normalizedTarget = normalizeAddressForMatch(address);
  return (
    items.find((item) => normalizeAddressForMatch(item.doorplate) === normalizedTarget) ??
    items.find((item) => normalizedTarget.endsWith(normalizeAddressForMatch(item.doorplate).replace(/^\S+?[縣市]\S+?[區鄉鎮市]/, ""))) ??
    null
  );
}

function pickBestDoorCandidate(items: EasyMapDoorCandidate[], address: string): EasyMapDoorCandidate | null {
  if (items.length === 0) return null;
  const normalizedTarget = normalizeDoorCandidateMatch(address);
  return (
    items.find((item) => normalizeDoorCandidateMatch(item.doorplate) === normalizedTarget) ??
    items.find((item) => normalizedTarget.endsWith(normalizeDoorCandidateMatch(item.doorplate))) ??
    items[0] ??
    null
  );
}

function selectDoorCandidatesForAddress(candidates: EasyMapDoorCandidate[], address: string): EasyMapDoorCandidate[] {
  const floorKey = extractFloorKey(address);
  if (!floorKey) return candidates;
  const matched = candidates.filter((candidate) => extractFloorKey(candidate.doorplate) === floorKey);
  return matched.length > 0 ? matched : candidates;
}

function buildDoorParcel(
  inputAddress: string,
  candidate: EasyMapDoorCandidate,
  description: EasyMapBuildingDescription,
  coordinate: EasyMapDoorCoordinate | null = null,
): ParcelInfo {
  const sectionCode = description.sectionCode ?? candidate.buildingSectionCode ?? candidate.sectionCode;
  const sectionName = description.sectionName ?? candidate.sectionName;
  const buildingNumber = description.buildingNo ?? candidate.buildingNo;
  const landNo = normalizeLandNo(candidate.landNo) ?? candidate.landNo;
  return {
    address: candidate.doorplate || inputAddress,
    lot_number: landNo,
    section_name: sectionName,
    section_code: sectionCode,
    land_office: candidate.office,
    source: "easymap_r02",
    trusted_for_pdf: false,
    parcel_id: `${candidate.office}-${sectionCode}-${buildingNumber || landNo}`,
    building_number: buildingNumber ?? "",
    building_area_sqm: description.buildingAreaSqm ?? undefined,
    total_floor_count: description.totalFloorCount ?? undefined,
    floor_label: description.floorLabel ?? undefined,
    completion_date_roc: description.completionDateRoc ?? undefined,
    age_years: description.ageYears ?? undefined,
    main_use: description.mainUse ?? undefined,
    lat: coordinate?.lat,
    lng: coordinate?.lng,
  };
}

function buildEasyMapLandParcels(
  inputAddress: string,
  land: EasyMapLandCandidate,
  description: EasyMapLandDescription,
): ParcelInfo[] {
  const base = {
    address: inputAddress,
    lot_number: land.landNo,
    section_name: land.sectionName,
    section_code: land.sectionCode,
    land_office: land.office,
    source: "easymap_r02" as const,
    trusted_for_pdf: false,
    land_area_sqm: description.landAreaSqm ?? undefined,
    announced_land_current_value: description.announcedLandCurrentValue ?? undefined,
    announced_land_value: description.announcedLandValue ?? undefined,
  };
  return normalizeParcelCandidateMetadata([{
    ...base,
    parcel_id: `${land.office}-${land.sectionCode}-${land.landNo}`,
    building_number: "",
  }]);
}

function normalizeParcelCandidateMetadata(candidates: ParcelInfo[]): ParcelInfo[] {
  const confidence = candidates.length > 1 ? "needs_selection" : "high";
  return candidates.map((candidate) => ({
    ...candidate,
    discovery_confidence: confidence,
    object_type: candidate.building_number ? "building" : "land",
    confirmation_state: "unconfirmed",
  }));
}

function parseTaiwanAddress(address: string): EasyMapAddressParts | null {
  const normalized = toHalfWidthDigits(address).replace(/\s+/g, "");
  const match = normalized.match(/^(?<city>[^縣市]+[縣市])(?<town>[^區鄉鎮市]+[區鄉鎮市])(?<rest>.+)$/);
  if (!match?.groups) return null;
  const cityName = match.groups.city.replace(/^台/, "臺");
  const cityCode = CITY_CODE_BY_NAME[cityName] ?? CITY_CODE_BY_NAME[cityName.replace(/^臺/, "台")];
  if (!cityCode) return null;
  const rest = match.groups.rest.replace(/^\S+?里\d*鄰/, "").replace(/^\S+?里/, "");
  const noMatch = rest.match(/(?<no>\d+(?:-\d+)?)號/);
  if (!noMatch?.groups) return null;
  const afterNo = rest.slice((noMatch.index ?? 0) + noMatch[0].length);
  const floor = parseFloorSuffix(afterNo);
  const beforeNo = rest.slice(0, noMatch.index);
  const alleyMatch = beforeNo.match(/(\d+)弄$/);
  const beforeAlley = alleyMatch ? beforeNo.slice(0, alleyMatch.index) : beforeNo;
  const laneMatch = beforeAlley.match(/(\d+)巷$/);
  const roadName = laneMatch ? beforeAlley.slice(0, laneMatch.index) : beforeAlley;
  const laneName = laneMatch?.[1] ?? "";
  const alleyName = alleyMatch?.[1] ?? "";
  if (!roadName) return null;
  return {
    cityName,
    cityCode,
    townName: match.groups.town,
    roadName,
    laneName,
    alleyName,
    no: noMatch.groups.no,
    floorNumber: floor.floorNumber,
    floorUnit: floor.floorUnit,
  };
}

function normalizeLandNo(value: string | null): string | null {
  if (!value) return null;
  const digits = toHalfWidthDigits(value).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length <= 4) {
    return `${digits.padStart(4, "0")}0000`;
  }
  return digits.padStart(8, "0").slice(-8);
}

export function formatEasyMapLandNoForDetail(value: string): string {
  const digits = toHalfWidthDigits(value).replace(/\D/g, "");
  if (!digits) return "0";
  if (digits.length === 8) {
    const main = digits.slice(0, 4).replace(/^0+/, "") || "0";
    const sub = digits.slice(4).replace(/^0+/, "");
    return sub ? `${main}-${sub}` : main;
  }
  return digits.replace(/^0+/, "") || "0";
}

function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function summarizeUpstreamText(value: string): string {
  return stripHtml(value).slice(0, 180);
}

function firstNumericText(value: string | null | undefined): string | null {
  return value?.match(/\d+(?:\.\d+)?/)?.[0] ?? null;
}

function firstDigits(value: string | null | undefined): string | null {
  return value?.match(/\d+/)?.[0] ?? null;
}

function splitSection(value: string | null | undefined): { code: string | null; name: string | null } {
  if (!value) return { code: null, name: null };
  const match = value.match(/(?<code>\d{4})\s*(?<name>.+段)/);
  if (!match?.groups) {
    return { code: firstDigits(value), name: value.replace(/^\d{4}\s*/, "").trim() || null };
  }
  return {
    code: match.groups.code,
    name: match.groups.name.trim(),
  };
}

function firstListValue(value: string): string {
  return value.split(",").map((item) => item.trim()).find(Boolean) ?? "";
}

function normalizeDoorCandidateMatch(value: string): string {
  return toHalfWidthDigits(value)
    .replace(/臺/g, "台")
    .replace(/[里鄰\s]/g, "")
    .replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .trim();
}

function parseFloorSuffix(value: string): { floorNumber: string; floorUnit: string } {
  const normalized = toHalfWidthDigits(value).replace(/\s+/g, "");
  const match = normalized.match(/^(?<floor>\d+|[一二三四五六七八九十百]+)樓(?:之(?<unit>\d+|[一二三四五六七八九十]+))?/);
  if (!match?.groups) {
    return { floorNumber: "", floorUnit: "" };
  }
  return {
    floorNumber: normalizeChineseNumber(match.groups.floor),
    floorUnit: normalizeChineseNumber(match.groups.unit ?? ""),
  };
}

function extractFloorKey(value: string): string | null {
  const normalized = toHalfWidthDigits(value).replace(/\s+/g, "");
  const match = normalized.match(/號(?<floor>\d+|[一二三四五六七八九十百]+)樓(?:之(?<unit>\d+|[一二三四五六七八九十]+))?/);
  if (!match?.groups) return null;
  const floor = normalizeChineseNumber(match.groups.floor);
  const unit = normalizeChineseNumber(match.groups.unit ?? "");
  return floor ? `${floor}:${unit}` : null;
}

function normalizeChineseNumber(value: string): string {
  if (!value) return "";
  const half = toHalfWidthDigits(value);
  if (/^\d+$/.test(half)) return String(Number(half));
  const parsed = parseChineseInteger(half);
  return parsed === null ? half : String(parsed);
}

function parseChineseInteger(value: string): number | null {
  const digitMap: Record<string, number> = {
    零: 0,
    一: 1,
    二: 2,
    兩: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  if (value in digitMap) return digitMap[value];
  const tenIndex = value.indexOf("十");
  if (tenIndex >= 0) {
    const before = value.slice(0, tenIndex);
    const after = value.slice(tenIndex + 1);
    const tens = before ? digitMap[before] : 1;
    const ones = after ? digitMap[after] : 0;
    if (typeof tens === "number" && typeof ones === "number") {
      return tens * 10 + ones;
    }
  }
  return null;
}

function splitSetCookieHeader(value: string | null): string[] {
  if (!value) return [];
  return value.split(/,(?=[^;,]+=)/g);
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function pickString(input: Record<string, unknown>, key: string): string | null {
  const value = input[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const CITY_CODE_BY_NAME: Record<string, string> = {
  基隆市: "C",
  臺北市: "A",
  台北市: "A",
  新北市: "F",
  桃園市: "H",
  新竹市: "O",
  新竹縣: "J",
  苗栗縣: "K",
  臺中市: "B",
  台中市: "B",
  南投縣: "M",
  彰化縣: "N",
  雲林縣: "P",
  嘉義市: "I",
  嘉義縣: "Q",
  臺南市: "D",
  台南市: "D",
  高雄市: "E",
  屏東縣: "T",
  宜蘭縣: "G",
  花蓮縣: "U",
  臺東縣: "V",
  台東縣: "V",
  澎湖縣: "X",
  金門縣: "W",
  連江縣: "Z",
};

const KNOWN_R02_TOWN_CODES: Record<string, string> = {
  "D:東區": "01",
  "D:永康區": "39",
  "E:苓雅區": "08",
  "O:北區": "01",
  "O:新竹市": "01",
};
