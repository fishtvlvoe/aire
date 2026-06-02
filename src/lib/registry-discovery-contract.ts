import type { R02DiscoveryRun, R02RecordedDiscoveryRun } from "./land-registry-api";

export type DiscoveryStatus = "candidate_found" | "manual_required" | "error";

export type DiscoverySource = "easymap_r02" | "local_discovery" | "tauri_desktop";

export type DiscoveryInputKind = "doorplate" | "land_descriptor" | "incomplete";

export type DiscoveryCandidateConfidence = "high" | "needs_selection" | "low";

export type DiscoveryObjectType = "building" | "land";

export type DiscoverySelectionState = "not_required" | "required" | "selected";

export type DiscoveryIntendedObjectType = "building" | "land" | "unknown";

export interface ParsedDiscoveryInput {
  cityName: string | null;
  districtName: string | null;
  roadName: string | null;
  laneName: string | null;
  alleyName: string | null;
  doorNumber: string | null;
  sectionName: string | null;
  landNumber: string | null;
}

export interface DiscoveryInputClassification {
  inputKind: DiscoveryInputKind;
  intendedObjectType: DiscoveryIntendedObjectType;
  parsedInput: ParsedDiscoveryInput;
}

export interface DiscoveryCorrectionSuggestion {
  from: string;
  to: string;
  reason: string;
}

export interface DiscoveryCandidate {
  registryKey: string;
  sectionName: string | null;
  landNumber: string | null;
  buildingNumber: string | null;
  source: DiscoverySource;
  confidence?: DiscoveryCandidateConfidence;
  objectType?: DiscoveryObjectType;
}

export interface DiscoveryError {
  source: string;
  code: string;
  message: string;
}

export interface DiscoveryResult {
  status: DiscoveryStatus;
  source: DiscoverySource;
  normalizedAddress: string;
  candidates: DiscoveryCandidate[];
  errors: DiscoveryError[];
  trustedForPdf: false;
  totalCostCents: 0;
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

export function normalizeDiscoveryResult(input: {
  status: DiscoveryStatus;
  source: DiscoverySource;
  normalizedAddress: string;
  candidates?: DiscoveryCandidate[];
  errors?: DiscoveryError[];
  cacheHit?: boolean;
  sourceRunId?: string | null;
  selectedRegistryKey?: string | null;
}): DiscoveryResult {
  const normalizedAddress = input.normalizedAddress.trim();
  const classification = classifyDiscoveryInput(normalizedAddress);
  const candidateCount = input.candidates?.length ?? 0;
  const selectedRegistryKey = input.selectedRegistryKey ?? null;
  return {
    status: input.status,
    source: input.source,
    normalizedAddress,
    candidates: normalizeCandidateSelectionState(input.candidates ?? []),
    errors: input.errors ?? [],
    trustedForPdf: false,
    totalCostCents: 0,
    cacheHit: input.cacheHit ?? false,
    sourceRunId: input.sourceRunId ?? null,
    inputKind: classification.inputKind,
    intendedObjectType: classification.intendedObjectType,
    parsedInput: classification.parsedInput,
    requiresCandidateSelection: candidateCount > 1 && !selectedRegistryKey,
    candidateSelection: buildCandidateSelection(input.candidates ?? [], selectedRegistryKey),
    suggestedCorrections: suggestDiscoveryCorrections(normalizedAddress),
  };
}

export function normalizeR02DiscoveryRun(
  run: R02DiscoveryRun,
  options: { cacheHit?: boolean; sourceRunId?: string | null } = {},
): DiscoveryResult {
  return normalizeDiscoveryResult({
    status: run.candidates.length > 0 ? "candidate_found" : "manual_required",
    source: "easymap_r02",
    normalizedAddress: run.input_address,
    candidates: run.candidates.map((candidate) => ({
      registryKey: buildR02RegistryKey(candidate.section_code, candidate.land_no, candidate.building_no),
      sectionName: candidate.section_name,
      landNumber: candidate.land_no,
      buildingNumber: candidate.building_no,
      source: "easymap_r02",
      confidence: run.candidates.length > 1 ? "needs_selection" : "high",
      objectType: candidate.building_no ? "building" : "land",
    })),
    errors: [],
    cacheHit: options.cacheHit,
    sourceRunId: options.sourceRunId,
  });
}

export function normalizeR02RecordedDiscoveryRun(
  recorded: R02RecordedDiscoveryRun,
  fallbackAddress = "",
): DiscoveryResult {
  if (recorded.ok && recorded.discovery) {
    return normalizeR02DiscoveryRun(recorded.discovery, { sourceRunId: recorded.run_id });
  }

  const error = normalizeR02Error(recorded.error);
  return normalizeDiscoveryResult({
    status: error.code === "r02_upstream_error" ? "error" : "manual_required",
    source: "easymap_r02",
    normalizedAddress: fallbackAddress,
    candidates: [],
    errors: [error],
    cacheHit: false,
    sourceRunId: recorded.run_id,
  });
}

function buildR02RegistryKey(sectionCode: string | null, landNo: string | null, buildingNo: string | null): string {
  return `r02:${sectionCode || "unknown-section"}:${landNo || "unknown-land"}:${buildingNo || "unknown-building"}`;
}

function normalizeR02Error(error: Record<string, unknown> | null): DiscoveryError {
  const code = pickString(error, "error_code") ?? pickString(error, "errorCode") ?? "r02_no_usable_candidate";
  const missingFields = pickStringArray(error, "missing_fields") ?? pickStringArray(error, "missingFields") ?? [];

  return {
    source: "easymap_r02",
    code,
    message: buildR02ErrorMessage(code, missingFields),
  };
}

export function classifyDiscoveryInput(input: string): DiscoveryInputClassification {
  const normalized = normalizeInput(input);
  const base = emptyParsedInput();
  const administrative = normalized.match(/^(?<city>[^縣市]+[縣市])(?<district>[^區鄉鎮市]+[區鄉鎮市])(?<rest>.*)$/);
  if (!administrative?.groups) {
    const sectionOnly = normalized.match(/(?<section>[^縣市區鄉鎮市]+段)/)?.groups?.section ?? null;
    return {
      inputKind: "incomplete",
      intendedObjectType: sectionOnly ? "land" : "unknown",
      parsedInput: { ...base, sectionName: sectionOnly, landNumber: null },
    };
  }

  const cityName = administrative.groups.city;
  const districtName = administrative.groups.district;
  const rest = administrative.groups.rest;
  const land = parseLandDescriptor(rest);
  if (land) {
    return {
      inputKind: "land_descriptor",
      intendedObjectType: "land",
      parsedInput: {
        ...base,
        cityName,
        districtName,
        sectionName: land.sectionName,
        landNumber: land.landNumber,
      },
    };
  }

  const doorplate = parseDoorplate(rest);
  if (doorplate) {
    return {
      inputKind: "doorplate",
      intendedObjectType: "building",
      parsedInput: {
        ...base,
        cityName,
        districtName,
        roadName: doorplate.roadName,
        laneName: doorplate.laneName,
        alleyName: doorplate.alleyName,
        doorNumber: doorplate.doorNumber,
      },
    };
  }

  return {
    inputKind: "incomplete",
    intendedObjectType: "unknown",
    parsedInput: {
      ...base,
      cityName,
      districtName,
      sectionName: rest.match(/(?<section>[^縣市區鄉鎮市]+段)/)?.groups?.section ?? null,
    },
  };
}

export function suggestDiscoveryCorrections(input: string): DiscoveryCorrectionSuggestion[] {
  const normalized = normalizeInput(input);
  if (normalized.includes("高雄市苓雅區苓雅路二段") || normalized.includes("高雄市苓雅區苓雅路2段")) {
    return [
      {
        from: "苓雅路二段",
        to: "苓雅二路",
        reason: "suspected_kaohsiung_road_order_typo",
      },
    ];
  }
  return [];
}

function buildR02ErrorMessage(code: string, missingFields: string[]): string {
  if (code === "r02_required_fields_missing" && missingFields.length > 0) {
    return `缺少${missingFields.map(formatMissingField).join("、")}，請人工確認地段、地號或建號。`;
  }
  if (code === "r02_no_usable_candidate") {
    return "查不到可用候選資料，請人工確認地段、地號或建號。";
  }
  return "地址資料需要人工確認，請補齊地段、地號或建號。";
}

function normalizeCandidateSelectionState(candidates: DiscoveryCandidate[]): DiscoveryCandidate[] {
  const confidence: DiscoveryCandidateConfidence = candidates.length > 1 ? "needs_selection" : "high";
  return candidates.map((candidate) => ({
    ...candidate,
    confidence: candidate.confidence ?? confidence,
    objectType: candidate.objectType ?? (candidate.buildingNumber ? "building" : "land"),
  }));
}

function buildCandidateSelection(
  candidates: DiscoveryCandidate[],
  selectedRegistryKey: string | null,
): DiscoveryResult["candidateSelection"] {
  if (selectedRegistryKey) {
    return {
      state: "selected",
      selectedRegistryKey,
    };
  }
  if (candidates.length > 1) {
    return {
      state: "required",
      selectedRegistryKey: null,
    };
  }
  return {
    state: "not_required",
    selectedRegistryKey: null,
  };
}

function normalizeInput(input: string): string {
  return convertChineseAddressNumerals((input ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0)));
}

function convertChineseAddressNumerals(value: string): string {
  return value
    .replace(/([零一二兩三四五六七八九十百]+)(?=[段巷弄號樓])/g, (match) => {
      const parsed = parseChineseInteger(match);
      return parsed === null ? match : String(parsed);
    })
    .replace(/之([零一二兩三四五六七八九十百]+)/g, (_match, digits: string) => {
      const parsed = parseChineseInteger(digits);
      return parsed === null ? `之${digits}` : `之${parsed}`;
    });
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

function emptyParsedInput(): ParsedDiscoveryInput {
  return {
    cityName: null,
    districtName: null,
    roadName: null,
    laneName: null,
    alleyName: null,
    doorNumber: null,
    sectionName: null,
    landNumber: null,
  };
}

function parseLandDescriptor(rest: string): Pick<ParsedDiscoveryInput, "sectionName" | "landNumber"> | null {
  const match = rest.match(/(?<section>[^縣市區鄉鎮市路街巷弄號]+段)(?<land>\d{1,4}(?:[-之]\d{1,4})?)(?:地號)?$/);
  if (!match?.groups) return null;
  return {
    sectionName: match.groups.section,
    landNumber: match.groups.land.replace("之", "-"),
  };
}

function parseDoorplate(rest: string): Pick<ParsedDiscoveryInput, "roadName" | "laneName" | "alleyName" | "doorNumber"> | null {
  const doorMatch = rest.match(/(?<door>\d+(?:-\d+)?)號/);
  if (!doorMatch?.groups || doorMatch.index === undefined) return null;

  const beforeDoor = rest.slice(0, doorMatch.index);
  const alleyMatch = beforeDoor.match(/(?<alley>\d+)弄$/);
  const beforeAlley = alleyMatch?.groups ? beforeDoor.slice(0, alleyMatch.index) : beforeDoor;
  const laneMatch = beforeAlley.match(/(?<lane>\d+)巷$/);
  const roadName = laneMatch?.groups ? beforeAlley.slice(0, laneMatch.index) : beforeAlley;
  if (!roadName) return null;
  return {
    roadName,
    laneName: laneMatch?.groups?.lane ?? null,
    alleyName: alleyMatch?.groups?.alley ?? null,
    doorNumber: doorMatch.groups.door,
  };
}

function formatMissingField(field: string): string {
  const names: Record<string, string> = {
    section_code: "地段代碼",
    section_name: "地段名稱",
    land_no: "地號",
    building_no: "建號",
  };
  return names[field] ?? field;
}

function pickString(input: Record<string, unknown> | null, key: string): string | null {
  const value = input?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function pickStringArray(input: Record<string, unknown> | null, key: string): string[] | null {
  const value = input?.[key];
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is string => typeof item === "string");
}
