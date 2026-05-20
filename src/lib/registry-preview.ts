export interface RegistryPreviewField {
  label: string;
  value: string;
  target: string;
}

export interface RegistryPreviewSection {
  id: string;
  title: string;
  source: string;
  fields: RegistryPreviewField[];
  missing: string[];
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
): RegistryPreviewField {
  const value = firstValue(record, keys);
  return {
    label,
    value: transform ? transform(value, record) : formatValue(value),
    target,
  };
}

function makeSection(
  id: string,
  title: string,
  source: string,
  fields: RegistryPreviewField[],
): RegistryPreviewSection {
  const visible = fields.filter((item) => item.value);
  const missing = fields.filter((item) => !item.value).map((item) => item.label);
  return { id, title, source, fields: visible, missing };
}

export function buildRegistryPreviewSections(
  payload: RegistryRecord | null | undefined,
  now = new Date(),
): RegistryPreviewSection[] {
  if (!payload) return [];

  const land = unwrapApiData(payload, "land_registry");
  const landOwnership = {
    ...unwrapApiData(payload, "land_ownership"),
    ...unwrapApiData(payload, "co_owners"),
  };
  const landRights = {
    ...unwrapApiData(payload, "land_other_rights"),
    ...unwrapApiData(payload, "mortgages"),
  };
  const building = unwrapApiData(payload, "building_registry");
  const buildingOwnership = unwrapApiData(payload, "building_ownership");
  const buildingRights = unwrapApiData(payload, "building_other_rights");

  const completion = formatValue(
    firstValue(building, ["COMPLETEDATE", "construction_date", "completion_date"]),
  );

  return [
    makeSection("land_registry", "土地標示部", "MOI_API_001 地籍土地標示部", [
      field(land, "地段", ["SECTION", "section", "SUBSECTION", "subsection"], "土地標示/土地坐落"),
      field(land, "地號", ["NO", "lot_number", "land_no", "lot"], "土地標示/地號"),
      field(land, "登記日期", ["RDATE", "registration_date"], "土地標示/登記日期"),
      field(land, "登記原因", ["REASON", "registration_reason"], "土地標示/土地登記原因"),
      field(land, "土地面積", ["AREA", "area", "land_area"], "土地標示/總面積"),
      field(land, "使用分區", ["ZONING", "zoning", "purpose", "land_purpose"], "土地標示/使用分區"),
      field(land, "使用地類別", ["LCLASS", "usage_category"], "土地標示/使用編定"),
      field(land, "公告土地現值", ["ALVALUE", "announced_value"], "稅費/公告現值"),
      field(land, "公告地價", ["ALPRICE", "assessed_value"], "稅費/公告地價"),
      field(land, "地上建物建號數量", ["BUILDINGCOUNT", "building_count"], "土地標示/地上建物"),
    ]),
    makeSection("land_ownership", "土地所有權部", "MOI_API_002 地籍土地所有權部", [
      field(landOwnership, "所有權人", ["OWNER.LNAME", "LNAME", "owner_name", "name"], "土地標示/所有權人"),
      field(landOwnership, "登記日期", ["RDATE", "registration_date"], "土地標示/登記日期"),
      field(landOwnership, "登記原因", ["REASON", "registration_reason"], "土地標示/登記原因"),
      field(landOwnership, "原因發生日期", ["REASONDATE", "reason_date"], "土地標示/取得日期"),
      {
        label: "權利範圍",
        value: formatRatio(landOwnership),
        target: "土地標示/權利範圍",
      },
      field(landOwnership, "申報地價", ["DLPRICE", "declared_land_price"], "稅費/申報地價"),
      field(landOwnership, "前次移轉年月", ["LTDATE", "previous_transfer_date"], "增值稅/前次移轉"),
      field(landOwnership, "前次移轉現值", ["LTVALUE", "previous_transfer_value"], "增值稅/前次移轉現值"),
    ]),
    makeSection("building_registry", "建物標示部", "MOI_API_004 地籍建物標示部", [
      field(building, "建號", ["NO", "building_number", "building_no"], "建物標示/建號"),
      field(building, "建物門牌", ["BNUMBER", "building_address", "address"], "建物標示/門牌地址"),
      field(building, "坐落地號", ["LANDNO", "land_no", "land_number"], "建物標示/坐落地號"),
      field(building, "主要用途", ["PURPOSE", "purpose", "building_purpose"], "建物標示/法定用途"),
      field(building, "主要建材", ["MATERIAL", "material"], "建物標示/主要建材"),
      field(building, "建物層數", ["BUILDINGFLOOR", "building_floor", "total_floors"], "建物標示/總樓層"),
      field(building, "總面積", ["AREA", "area", "building_area"], "建物標示/登記坪數"),
      {
        label: "建築完成日期",
        value: completion,
        target: "建物標示/建築完成日",
      },
      {
        label: "屋齡",
        value: completion ? calculateBuildingAge(completion, now) : "",
        target: "物件資料表/屋齡",
      },
      field(building, "主建物面積", ["MAINAREA", "main_building_area"], "建物標示/主建坪數"),
      field(building, "附屬建物面積", ["ATTAREA", "auxiliary_area"], "建物標示/附屬建物"),
      field(building, "共有部分面積", ["SHAREAREA", "common_area"], "建物標示/公共設施"),
      field(building, "車位面積", ["PARKAREA", "parking_area"], "建物標示/車位坪數"),
      field(building, "建設公司", ["CONBUILDNAME", "construction_company"], "基本資料/建設公司"),
    ]),
    makeSection("building_ownership", "建物所有權部", "MOI_API_005 地籍建物所有權部", [
      field(buildingOwnership, "所有權人", ["OWNER.LNAME", "LNAME", "owner_name", "name"], "建物標示/所有權人"),
      field(buildingOwnership, "登記日期", ["RDATE", "registration_date", "ownership_date"], "建物標示/取得日期"),
      field(buildingOwnership, "登記原因", ["REASON", "registration_reason"], "建物標示/取得原因"),
      {
        label: "權利範圍",
        value: formatRatio(buildingOwnership),
        target: "建物標示/權利範圍",
      },
      field(buildingOwnership, "權狀字號", ["CERTIFICATENO", "certificate_no"], "建物標示/權狀字號"),
    ]),
    makeSection("rights", "他項權利/抵押", "MOI_API_003 土地他項權利 / MOI_API_006 建物他項權利", [
      field({ ...landRights, ...buildingRights }, "權利種類", ["RIGHTTYPE", "right_type"], "產權注意事項/他項權利"),
      field({ ...landRights, ...buildingRights }, "擔保債權總金額", ["CCP_RV", "amount"], "產權注意事項/抵押金額"),
      field({ ...landRights, ...buildingRights }, "權利人", ["LNAME", "creditor"], "產權注意事項/權利人"),
      field({ ...landRights, ...buildingRights }, "共同擔保地號", ["collateral_land_no", "collateral_land_numbers"], "土地標示/共同擔保地號"),
      field({ ...landRights, ...buildingRights }, "共同擔保建號", ["collateral_building_no", "collateral_building_numbers"], "土地標示/共同擔保建號"),
    ]),
  ];
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
