import {
  isRegistryProvenancePayload,
  normalizeRegistryPayloadForPreview,
} from "@/lib/registry-provenance";
import { formatRegistryCodeValue } from "@/lib/registry-display";

export interface RegistryPreviewField {
  label: string;
  value: string;
  target: string;
  internalKeys?: string[];
  fallbackKey?: "sectionName" | "sectionCode" | "landNo" | "buildingNo";
}

export type RegistryMissingReasonCode =
  | "verified_target_fallback"
  | "upstream_missing"
  | "mapping_gap";

export interface RegistryPreviewMissingField {
  label: string;
  target: string;
  reasonCode: RegistryMissingReasonCode;
  reasonLabel: string;
}

export interface RegistryPreviewSection {
  id: string;
  title: string;
  source: string;
  internalSource?: string;
  fields: RegistryPreviewField[];
  missing: string[];
  missingDetails: RegistryPreviewMissingField[];
}

type RegistryRecord = Record<string, unknown>;

const EMPTY_MARK = "空白";

function isRecord(value: unknown): value is RegistryRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapApiData(payload: RegistryRecord, apiId: string): RegistryRecord {
  const raw = payload[apiId];
  if (Array.isArray(raw)) return isRecord(raw[0]) ? raw[0] : {};
  if (!isRecord(raw)) return {};
  const data = raw.data;
  if (Array.isArray(data)) return isRecord(data[0]) ? data[0] : {};
  const record = isRecord(data) ? data : raw;
  for (const listKey of ["owners", "mortgages", "rights"]) {
    const rows = record[listKey];
    if (Array.isArray(rows) && isRecord(rows[0])) return rows[0];
  }
  return record;
}

function hasApiData(payload: RegistryRecord, apiId: string): boolean {
  const raw = payload[apiId];
  if (Array.isArray(raw)) return raw.length > 0;
  if (!isRecord(raw)) return false;
  const data = raw.data;
  if (Array.isArray(data)) return data.length > 0;
  if (isRecord(data)) return Object.keys(data).length > 0;
  return Object.keys(raw).length > 0;
}

function firstValue(record: RegistryRecord, keys: string[]): unknown {
  for (const key of keys) {
    const value = key.includes(".")
      ? key.split(".").reduce<unknown>((current, part) => {
          return isRecord(current) ? current[part] : undefined;
        }, record)
      : record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (isRecord(item)) return Object.values(item).filter(Boolean).join(" / ");
        return String(item);
      })
      .filter(Boolean)
      .join("；");
  }
  if (isRecord(value)) return Object.values(value).filter(Boolean).join(" / ");
  return String(value);
}

function hasPath(record: RegistryRecord, key: string): boolean {
  if (key.includes(".")) {
    let current: unknown = record;
    for (const part of key.split(".")) {
      if (!isRecord(current) || !(part in current)) return false;
      current = current[part];
    }
    return true;
  }
  return key in record;
}

function squareMetersToPing(value: unknown): string {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value.replace(/,/g, ""))
        : NaN;
  if (!Number.isFinite(numeric)) return "";
  return (Math.round(numeric * 0.3025 * 100) / 100).toFixed(2);
}

function formatRocDate(value: unknown): string {
  const raw = formatValue(value).trim();
  const compact = raw.match(/^(\d{3})(\d{2})(\d{2})$/);
  if (compact) return `民國${compact[1]}年${compact[2]}月${compact[3]}日`;
  const separated = raw.match(/^(?:民國)?(\d{2,3})[年/-](\d{1,2})[月/-](\d{1,2})日?$/);
  if (separated) {
    return `民國${separated[1].padStart(3, "0")}年${separated[2].padStart(2, "0")}月${separated[3].padStart(2, "0")}日`;
  }
  return raw;
}

function formatRatio(record: RegistryRecord): string {
  const denominator = firstValue(record, ["DENOMINATOR", "denominator", "right_denominator"]);
  const numerator = firstValue(record, ["NUMERATOR", "numerator", "right_numerator"]);
  const direct = firstValue(record, ["RIGHT", "right", "ownership_scope", "right_scope"]);
  if (numerator && denominator) return `${formatValue(numerator)}/${formatValue(denominator)}`;
  return formatValue(direct);
}

export function calculateBuildingAge(constructionDate: string, now = new Date()): string {
  const match = constructionDate.match(/(?:(?:民國)?(\d{2,3})|(\d{4}))[年/-](\d{1,2})[月/-](\d{1,2})?/);
  if (!match) return "";
  const year = match[2] ? Number(match[2]) : Number(match[1]) + 1911;
  const month = Number(match[3] ?? 1);
  const day = Number(match[4] ?? 1);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return "";
  let age = now.getFullYear() - year;
  const currentMonth = now.getMonth() + 1;
  if (currentMonth < month || (currentMonth === month && now.getDate() < day)) age -= 1;
  return age >= 0 ? `${age} 年` : "";
}

function field(
  record: RegistryRecord,
  label: string,
  keys: string[],
  target: string,
  transform?: (value: unknown, record: RegistryRecord) => string,
  options?: {
    fallbackKey?: "sectionName" | "sectionCode" | "landNo" | "buildingNo";
    internalKeys?: string[];
  },
): RegistryPreviewField {
  const value = firstValue(record, keys);
  return {
    label,
    value: transform ? transform(value, record) : formatValue(value),
    target,
    internalKeys: options?.internalKeys ?? keys,
    fallbackKey: options?.fallbackKey,
  };
}

function makeSection(
  id: string,
  title: string,
  source: string,
  fields: RegistryPreviewField[],
  internalSource?: string,
  rawRecord?: RegistryRecord,
  verifiedTarget?: {
    sectionName?: string;
    sectionCode?: string;
    landNo?: string;
    buildingNo?: string;
  } | null,
): RegistryPreviewSection {
  const visible = fields.filter((item) => item.value);
  const missingDetails = fields
    .filter((item) => !item.value)
    .map((item) => ({
      label: item.label,
      target: item.target,
      ...classifyMissingField(item, rawRecord, verifiedTarget),
    }));
  const missing = missingDetails.map((item) => item.label);
  return { id, title, source, internalSource, fields: visible, missing, missingDetails };
}

function classifyMissingField(
  field: RegistryPreviewField,
  rawRecord?: RegistryRecord,
  verifiedTarget?: {
    sectionName?: string;
    sectionCode?: string;
    landNo?: string;
    buildingNo?: string;
  } | null,
): Pick<RegistryPreviewMissingField, "reasonCode" | "reasonLabel"> {
  const fallbackKey = field.fallbackKey;
  if (fallbackKey && verifiedTarget?.[fallbackKey]) {
    return {
      reasonCode: "verified_target_fallback",
      reasonLabel: "案件已驗證到此鍵值，但目前匯入明細 fallback 尚未完整接通",
    };
  }

  if (!rawRecord || Object.keys(rawRecord).length === 0) {
    return {
      reasonCode: "mapping_gap",
      reasonLabel: "本地 mapping / fallback 尚未接通",
    };
  }

  const keys = field.internalKeys ?? [];
  const keyExists = keys.some((key) => hasPath(rawRecord, key));
  if (!keyExists) {
    return {
      reasonCode: "upstream_missing",
      reasonLabel: "COP 上游未回傳此欄位",
    };
  }

  return {
    reasonCode: "mapping_gap",
    reasonLabel: "本地 mapping / fallback 尚未接通",
  };
}

function getVerifiedTargetFallback(payload: RegistryRecord | null | undefined): {
  sectionName?: string;
  sectionCode?: string;
  landNo?: string;
  buildingNo?: string;
} | null {
  if (!isRegistryProvenancePayload(payload)) return null;
  const match = payload.confirmed_registry_match;
  if (!isRecord(match)) return null;
  const sectionName = formatValue(match.section_name).trim();
  const sectionCode = formatValue(match.section_code).trim();
  const landNo = formatValue(match.land_no).trim();
  const buildingNo = formatValue(match.building_no).trim();
  if (!sectionName && !sectionCode && !landNo && !buildingNo) return null;
  return {
    sectionName: sectionName || undefined,
    sectionCode: sectionCode || undefined,
    landNo: landNo || undefined,
    buildingNo: buildingNo || undefined,
  };
}

export function buildRegistryPreviewSections(
  payload: RegistryRecord | null | undefined,
  now = new Date(),
): RegistryPreviewSection[] {
  const normalizedPayload = normalizeRegistryPayloadForPreview(payload);
  if (!normalizedPayload) return [];

  const verifiedTarget = getVerifiedTargetFallback(payload);
  const land = {
    ...unwrapApiData(normalizedPayload, "land_registry"),
    ...(verifiedTarget?.sectionName ? { section: verifiedTarget.sectionName } : {}),
    ...(verifiedTarget?.landNo ? { land_no: verifiedTarget.landNo, lot_number: verifiedTarget.landNo } : {}),
  } as RegistryRecord;
  const landOwnership = {
    ...unwrapApiData(normalizedPayload, "land_ownership"),
    ...unwrapApiData(normalizedPayload, "co_owners"),
  };
  const landRights = {
    ...unwrapApiData(normalizedPayload, "land_other_rights"),
    ...unwrapApiData(normalizedPayload, "mortgages"),
  };
  const building = {
    ...unwrapApiData(normalizedPayload, "building_registry"),
    ...(verifiedTarget?.buildingNo
      ? { building_no: verifiedTarget.buildingNo, building_number: verifiedTarget.buildingNo, NO: verifiedTarget.buildingNo }
      : {}),
  } as RegistryRecord;
  const buildingOwnership = unwrapApiData(normalizedPayload, "building_ownership");
  const buildingRights = unwrapApiData(normalizedPayload, "building_other_rights");

  const completion = formatRocDate(
    firstValue(building, ["COMPLETEDATE", "construction_date", "completion_date"]),
  );

  const sections: RegistryPreviewSection[] = [];

  if (hasApiData(normalizedPayload, "land_registry")) {
    sections.push(makeSection(
      "land_registry",
      "土地標示部",
      "土地標示資料",
      [
        field(land, "地段", ["SECTION", "section", "SUBSECTION", "subsection"], "土地標示/土地坐落", undefined, {
          fallbackKey: "sectionName",
        }),
        field(land, "地號", ["NO", "lot_number", "land_no", "lot"], "土地標示/地號", undefined, {
          fallbackKey: "landNo",
        }),
        field(land, "登記日期", ["RDATE", "registration_date"], "土地標示/登記日期"),
        field(
          land,
          "登記原因",
          ["REASON", "registration_reason"],
          "土地標示/土地登記原因",
          (value) => formatRegistryCodeValue(formatValue(value)) ?? "",
        ),
        field(land, "土地面積", ["AREA", "area", "land_area"], "土地標示/總面積"),
        field(land, "使用分區", ["ZONING", "zoning", "purpose", "land_purpose"], "土地標示/使用分區"),
        field(land, "使用地類別", ["LCLASS", "usage_category"], "土地標示/使用編定"),
        field(land, "公告土地現值", ["ALVALUE", "announced_value"], "稅費/公告現值"),
        field(land, "公告地價", ["ALPRICE", "assessed_value"], "稅費/公告地價"),
        field(land, "地上建物建號數量", ["BUILDINGCOUNT", "building_count"], "土地標示/地上建物"),
      ],
      "MOI_API_001 地籍土地標示部",
      isRecord(land.raw) ? land.raw : land,
      verifiedTarget,
    ));
  }

  if (hasApiData(normalizedPayload, "land_ownership") || hasApiData(normalizedPayload, "co_owners")) {
    sections.push(makeSection(
      "land_ownership",
      "土地所有權部",
      "土地所有權資料",
      [
        field(
          landOwnership,
          "所有權人",
          ["OWNER.LNAME", "LNAME", "owner_name", "name"],
          "土地標示/所有權人",
        ),
        field(landOwnership, "登記日期", ["RDATE", "registration_date"], "土地標示/登記日期"),
        field(
          landOwnership,
          "登記原因",
          ["REASON", "registration_reason"],
          "土地標示/登記原因",
          (value) => formatRegistryCodeValue(formatValue(value)) ?? "",
        ),
        field(landOwnership, "原因發生日期", ["REASONDATE", "reason_date"], "土地標示/取得日期"),
        {
          label: "權利範圍",
          value: formatRatio(landOwnership),
          target: "土地標示/權利範圍",
        },
        field(landOwnership, "申報地價", ["DLPRICE", "declared_land_price"], "稅費/申報地價"),
        field(landOwnership, "前次移轉年月", ["LTDATE", "previous_transfer_date"], "增值稅/前次移轉"),
        field(
          landOwnership,
          "前次移轉現值",
          ["LTVALUE", "previous_transfer_value"],
          "增值稅/前次移轉現值",
        ),
      ],
      "MOI_API_002 地籍土地所有權部",
      isRecord(landOwnership.raw) ? landOwnership.raw : landOwnership,
      verifiedTarget,
    ));
  }

  if (hasApiData(normalizedPayload, "building_registry")) {
    sections.push(makeSection(
      "building_registry",
      "建物標示部",
      "建物標示資料",
      [
        field(building, "建號", ["NO", "building_number", "building_no"], "建物標示/建號", undefined, {
          fallbackKey: "buildingNo",
        }),
        field(building, "建物門牌", ["BNUMBER", "building_address", "address"], "建物標示/門牌地址"),
        field(building, "坐落地號", ["LANDNO", "land_no", "land_number"], "建物標示/坐落地號"),
        field(
          building,
          "法定用途",
          ["PURPOSE", "purpose", "building_purpose"],
          "建物標示/法定用途",
          (value) => formatRegistryCodeValue(formatValue(value)) ?? "",
        ),
        field(
          building,
          "主要建材",
          ["MATERIAL", "material"],
          "建物標示/主要建材",
          (value) => formatRegistryCodeValue(formatValue(value)) ?? "",
        ),
        field(
          building,
          "建物層數",
          ["BUILDINGFLOOR", "building_floor", "total_floors"],
          "建物標示/總樓層",
        ),
        field(
          building,
          "登記坪數",
          ["AREA", "area", "building_area"],
          "建物標示/登記坪數",
          squareMetersToPing,
        ),
        {
          label: "建築完成日",
          value: completion,
          target: "建物標示/建築完成日",
        },
        {
          label: "屋齡",
          value: completion ? calculateBuildingAge(completion, now) : "",
          target: "物件資料表/屋齡",
        },
        field(building, "主建坪數", ["MAINAREA", "main_building_area"], "建物標示/主建坪數", squareMetersToPing),
        field(building, "附屬建物", ["ATTAREA", "auxiliary_area"], "建物標示/附屬建物", squareMetersToPing),
        field(building, "公共設施", ["SHAREAREA", "common_area"], "建物標示/公共設施", squareMetersToPing),
        field(building, "車位坪數", ["PARKAREA", "parking_area"], "建物標示/車位坪數", squareMetersToPing),
        field(building, "建設公司", ["CONBUILDNAME", "construction_company"], "基本資料/建設公司"),
      ],
      "MOI_API_004 地籍建物標示部",
      isRecord(building.raw) ? building.raw : building,
      verifiedTarget,
    ));
  }

  if (hasApiData(normalizedPayload, "building_ownership")) {
    sections.push(makeSection(
      "building_ownership",
      "建物所有權部",
      "建物所有權資料",
      [
        field(
          buildingOwnership,
          "所有權人",
          ["OWNER.LNAME", "LNAME", "owner_name", "name"],
          "建物標示/所有權人",
        ),
        field(
          buildingOwnership,
          "登記日期",
          ["RDATE", "registration_date", "ownership_date"],
          "建物標示/取得日期",
        ),
        field(
          buildingOwnership,
          "登記原因",
          ["REASON", "registration_reason"],
          "建物標示/取得原因",
          (value) => formatRegistryCodeValue(formatValue(value)) ?? "",
        ),
        {
          label: "權利範圍",
          value: formatRatio(buildingOwnership),
          target: "建物標示/權利範圍",
        },
        field(buildingOwnership, "權狀字號", ["CERTIFICATENO", "certificate_no"], "建物標示/權狀字號"),
      ],
      "MOI_API_005 地籍建物所有權部",
      isRecord(buildingOwnership.raw) ? buildingOwnership.raw : buildingOwnership,
      verifiedTarget,
    ));
  }

  if (
    hasApiData(normalizedPayload, "land_other_rights") ||
    hasApiData(normalizedPayload, "mortgages") ||
    hasApiData(normalizedPayload, "building_other_rights")
  ) {
    sections.push(makeSection(
      "rights",
      "他項權利/抵押",
      "他項權利與抵押資料",
      [
        field(
          { ...landRights, ...buildingRights },
          "權利種類",
          ["RIGHTTYPE", "right_type"],
          "產權注意事項/他項權利",
        ),
        field(
          { ...landRights, ...buildingRights },
          "擔保債權總金額",
          ["CCP_RV", "amount"],
          "產權注意事項/抵押金額",
        ),
        field(
          { ...landRights, ...buildingRights },
          "權利人",
          ["LNAME", "creditor"],
          "產權注意事項/權利人",
        ),
        field(
          { ...landRights, ...buildingRights },
          "共同擔保地號",
          ["collateral_land_no", "collateral_land_numbers"],
          "土地標示/共同擔保地號",
        ),
        field(
          { ...landRights, ...buildingRights },
          "共同擔保建號",
          ["collateral_building_no", "collateral_building_numbers"],
          "土地標示/共同擔保建號",
        ),
      ],
      "MOI_API_003 土地他項權利 / MOI_API_006 建物他項權利",
      isRecord(landRights.raw) ? landRights.raw : isRecord(buildingRights.raw) ? buildingRights.raw : { ...landRights, ...buildingRights },
      verifiedTarget,
    ));
  }

  return sections;
}

export function summarizeRegistryPreview(sections: RegistryPreviewSection[]) {
  const fieldCount = sections.reduce((sum, section) => sum + section.fields.length, 0);
  const missingCount = sections.reduce((sum, section) => sum + section.missing.length, 0);
  return {
    fieldCount,
    missingCount,
    statusText: fieldCount > 0 ? `已讀到 ${fieldCount} 個欄位` : EMPTY_MARK,
  };
}

export function buildRegistryPreviewDiagnostics(sections: RegistryPreviewSection[]) {
  const acquiredFields = sections.flatMap((section) =>
    section.fields.map((field) => ({
      sectionId: section.id,
      sectionTitle: section.title,
      label: field.label,
      value: field.value,
      target: field.target,
    })),
  );
  const missingFields = sections.flatMap((section) =>
    section.missingDetails.map((field) => ({
      sectionId: section.id,
      sectionTitle: section.title,
      label: field.label,
      target: field.target,
      reasonCode: field.reasonCode,
      reasonLabel: field.reasonLabel,
    })),
  );
  return {
    acquiredFields,
    missingFields,
    counts: {
      acquired: acquiredFields.length,
      missing: missingFields.length,
      verifiedTargetFallback: missingFields.filter((field) => field.reasonCode === "verified_target_fallback").length,
      upstreamMissing: missingFields.filter((field) => field.reasonCode === "upstream_missing").length,
      mappingGap: missingFields.filter((field) => field.reasonCode === "mapping_gap").length,
    },
  };
}
