import type { CasePropertyType, CaseRow } from "@/lib/cases-api";
import { getPrimaryNavigation, getSecondaryNavigation } from "@/lib/product-navigation-ia";
import {
  extractCandidateOptions,
  extractPreSurveyRegistryData,
  extractRegistryFailureReasons,
  isRegistryProvenancePayload,
  type CandidateParcelOption,
  type RegistryProvenanceEntry,
} from "@/lib/registry-provenance";

export const FRONTSTAGE_FORBIDDEN_PATTERNS = [
  /MOI_API_/,
  /\bCOP\b/,
  /COP\d{3}/,
  /\bR02\b/,
  /便民系統/,
  /\bBASIC\b/,
  /\bpro\b/,
  /\badvanced\b/,
  /domain_failure/,
  /integration_gap/,
] as const;

export interface DemoSidebarItem {
  label: string;
  href: string;
}

export interface DemoSidebarFolder {
  label: string;
  description: string;
  items: DemoSidebarItem[];
}

export interface SettingsCategory {
  id: string;
  label: string;
}

export interface AddressFirstClassification {
  status: "classified" | "manual_required";
  propertyType: CasePropertyType;
  displayType: string;
  summary: string;
  manualSelectionRequired: boolean;
  landCount: number;
  buildingCount: number;
  note: string;
}

export interface AddressLookupParcel {
  parcel_id: string;
  address: string;
  lot_number: string;
  building_number?: string;
  main_use?: string;
  building_type?: string;
  floor?: string | number;
  total_floor_count?: string | number;
  zoning?: string;
  land_use?: string;
}

export interface CustomerPropertyTypeOption {
  value: CasePropertyType;
  label: string;
  group: "building" | "land" | "other";
}

export interface DemoFieldReviewRow {
  fieldName: string;
  helper: string;
  value: string;
  serviceName: string;
  statusLabel: string;
  amountLabel: string;
}

export interface UsageLedgerRow {
  serviceName: string;
  outcomeLabel: string;
  returnRowsLabel: string;
  amountLabel: string;
  reason: string;
  admin: {
    serviceCode: string;
    rawCode?: string;
    transactionId?: string;
  };
}

export interface EntitlementFeature {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  upgraded: boolean;
  ariaLabel: string;
}

export interface PdfAssetSlot {
  label: string;
  description: string;
  basicFallback: string;
  upgradeAutomation: string;
}

export interface UpgradePlan {
  id: "basic" | "advanced" | "premium";
  name: string;
  badge: string;
  priceLabel: string;
  description: string;
  current: boolean;
  ctaLabel: string;
  features: string[];
}

const SERVICE_LABELS: Record<string, string> = {
  MOI_API_005: "建物所有權資料",
  MOI_API_037: "門牌建號查詢",
  MOI_API_009: "所有權人比對服務",
  MOI_API_041: "帳務查詢",
};

const CUSTOMER_PROPERTY_TYPE_OPTIONS: CustomerPropertyTypeOption[] = [
  { value: "highrise", label: "大樓", group: "building" },
  { value: "apartment", label: "公寓", group: "building" },
  { value: "townhouse", label: "透天", group: "building" },
  { value: "residential", label: "成屋", group: "building" },
  { value: "farmhouse", label: "農舍", group: "building" },
  { value: "land", label: "土地", group: "land" },
  { value: "farmland", label: "農地", group: "land" },
  { value: "commercial-land", label: "商業用地", group: "land" },
  { value: "residential-land", label: "建地 / 住宅用地", group: "land" },
  { value: "industrial-land", label: "工業用地", group: "land" },
  { value: "storefront", label: "店面", group: "building" },
  { value: "factory", label: "工廠", group: "building" },
  { value: "other", label: "其他", group: "other" },
];

const DEMO_FIELD_ROWS: DemoFieldReviewRow[] = [
  {
    fieldName: "屋主姓名",
    helper: "由屋主或正式文件提供",
    value: "待屋主提供",
    serviceName: "屋主提供資料",
    statusLabel: "需人工提供",
    amountLabel: "0 元",
  },
  {
    fieldName: "建物權利範圍",
    helper: "正式謄本或建物所有權資料",
    value: "待地政謄本匯入",
    serviceName: "地政謄本匯入",
    statusLabel: "待匯入",
    amountLabel: "0 元",
  },
  {
    fieldName: "登記日期",
    helper: "公開物件資料或正式謄本",
    value: "待地政謄本匯入",
    serviceName: "公開物件資料",
    statusLabel: "待匯入",
    amountLabel: "0 元",
  },
  {
    fieldName: "姓名比對結果",
    helper: "用屋主姓名比對所有權人",
    value: "待正式所有權資料後再比對",
    serviceName: "所有權人比對服務",
    statusLabel: "待匯入",
    amountLabel: "0 元",
  },
  {
    fieldName: "門牌查詢建號",
    helper: "地政查詢未成功",
    value: "需改用候選建號確認",
    serviceName: "門牌建號查詢",
    statusLabel: "查詢未成功",
    amountLabel: "0 元",
  },
];

const USAGE_LEDGER_ROWS: UsageLedgerRow[] = [
  {
    serviceName: "物件基本資料",
    outcomeLabel: "候選成功",
    returnRowsLabel: "1 筆",
    amountLabel: "0 元",
    reason: "免費候選資料，不列入正式地政費用",
    admin: {
      serviceCode: "R02_FREE_DISCOVERY",
    },
  },
  {
    serviceName: "地政謄本匯入",
    outcomeLabel: "尚未匯入",
    returnRowsLabel: "0 筆",
    amountLabel: "0 元",
    reason: "尚未進行正式所有權資料查詢",
    admin: {
      serviceCode: "FORMAL_REGISTRY_IMPORT",
    },
  },
  {
    serviceName: "帳務查詢",
    outcomeLabel: "免費",
    returnRowsLabel: "帳務同步",
    amountLabel: "0 元",
    reason: "授權帳號查帳，不列入案件扣款",
    admin: {
      serviceCode: "MOI_API_041",
    },
  },
];

const ENTITLEMENT_FEATURES: EntitlementFeature[] = [
  {
    id: "google-map",
    label: "Google 地圖",
    description: "未啟用",
    enabled: false,
    upgraded: false,
    ariaLabel: "Google 地圖未啟用",
  },
  {
    id: "aerial-photo",
    label: "空拍圖",
    description: "未啟用",
    enabled: false,
    upgraded: false,
    ariaLabel: "空拍圖未啟用",
  },
  {
    id: "street-view-reference",
    label: "街景參考",
    description: "未啟用",
    enabled: false,
    upgraded: false,
    ariaLabel: "街景參考未啟用",
  },
  {
    id: "ai-floor-plan",
    label: "AI 格局圖整理",
    description: "未啟用",
    enabled: false,
    upgraded: false,
    ariaLabel: "AI 格局圖整理未啟用",
  },
  {
    id: "cadastral-map",
    label: "地籍圖整理",
    description: "未啟用",
    enabled: false,
    upgraded: false,
    ariaLabel: "地籍圖整理未啟用",
  },
  {
    id: "premium_real_price_enabled",
    label: "實價登錄",
    description: "未啟用",
    enabled: false,
    upgraded: false,
    ariaLabel: "實價登錄未啟用",
  },
];

const UPGRADE_PLANS: UpgradePlan[] = [
  {
    id: "basic",
    name: "基本款",
    badge: "目前方案",
    priceLabel: "已啟用",
    description: "適合先完成不動產說明書、地政資料查詢與 PDF 產出的基本流程。",
    current: true,
    ctaLabel: "目前使用中",
    features: ["案件管理", "地政資料查詢", "不動產物件審核", "PDF 預覽與匯出"],
  },
  {
    id: "advanced",
    name: "進階款",
    badge: "升級",
    priceLabel: "洽 OPCOS",
    description: "加入進階圖資與實價登錄，協助助理更快補齊物件周邊資料。",
    current: false,
    ctaLabel: "前往升級",
    features: ["Google 地圖", "地籍圖整理", "實價登錄", "地標圖與生活機能"],
  },
  {
    id: "premium",
    name: "高級款",
    badge: "高階功能",
    priceLabel: "洽 OPCOS",
    description: "提供空拍、街景、AI 格局圖與高階輸出，支援完整銷售素材準備。",
    current: false,
    ctaLabel: "前往升級",
    features: ["空拍圖", "街景參考", "AI 格局圖整理", "進階 PDF 圖頁"],
  },
];

const PDF_ASSET_SLOTS: PdfAssetSlot[] = [
  {
    label: "地籍圖",
    description: "放入不動產說明書的地籍圖頁面",
    basicFallback: "基本款可手動上傳地籍圖檔",
    upgradeAutomation: "進階款可由地政圖資整理帶入",
  },
  {
    label: "空拍圖",
    description: "放入 PDF 圖頁或外部圖資參考",
    basicFallback: "基本款可手動上傳空拍圖",
    upgradeAutomation: "高級款可自動取得或整理空拍圖",
  },
  {
    label: "格局圖",
    description: "放入建物格局與室內配置頁面",
    basicFallback: "尚未上傳時 PDF 保留空白框，供現場手繪或後續補圖",
    upgradeAutomation: "高級款可將現場手稿照片整理成正式格局圖",
  },
  {
    label: "地標圖",
    description: "放入位置圖、地標與生活機能參考",
    basicFallback: "基本款可手動上傳地標圖",
    upgradeAutomation: "進階款可由地圖資料產生",
  },
];

export function getDemoSidebarFolders(): DemoSidebarFolder[] {
  return getPrimaryNavigation().map((folder) => ({
    label: folder.label,
    description: folder.description ?? "",
    items: getSecondaryNavigation(folder.label).map((item) => ({
      label: item.label,
      href: item.href,
    })),
  }));
}

export function getSettingsCategories(): SettingsCategory[] {
  return [
    { id: "delivery-profile", label: "品牌設定" },
    { id: "audit-log", label: "操作日誌" },
    { id: "plans", label: "方案設定" },
  ];
}

export function getUpgradePlans(): UpgradePlan[] {
  return UPGRADE_PLANS;
}

export function getCustomerServiceLabel(serviceCode: string): string {
  return SERVICE_LABELS[serviceCode] ?? "地政資料";
}

export function getCustomerPropertyTypeOptions(): CustomerPropertyTypeOption[] {
  return CUSTOMER_PROPERTY_TYPE_OPTIONS.map((option) => ({ ...option }));
}

export interface RegistryPropertyTypeInput {
  hasBuilding: boolean;
  mainUse?: string | null;
  buildingType?: string | null;
  floor?: string | number | null;
  totalFloorCount?: number | null;
  zoning?: string | null;
  landUse?: string | null;
  address?: string | null;
}

export function inferPropertyTypeFromRegistryFields(input: RegistryPropertyTypeInput): CasePropertyType {
  const mainUse = normalizePropertyTypeText(input.mainUse);
  const buildingType = normalizePropertyTypeText(input.buildingType);
  const zoning = normalizePropertyTypeText(input.zoning);
  const landUse = normalizePropertyTypeText(input.landUse);
  const address = normalizePropertyTypeText(input.address);
  const buildingText = `${mainUse} ${buildingType} ${address}`;
  const landText = `${zoning} ${landUse} ${address}`;

  if (!input.hasBuilding) {
    if (/農業|農牧|農地|田|旱/.test(landText)) return "farmland";
    if (/商業/.test(landText)) return "commercial-land";
    if (/工業/.test(landText)) return "industrial-land";
    if (/鄉村/.test(landText)) return "village-land";
    if (/住宅|住居|建地|宅地/.test(landText)) return "residential-land";
    return "land";
  }

  if (/店舖|店鋪|店面|商場|商業/.test(buildingText)) return "storefront";
  if (/工廠|廠房|工業/.test(buildingText)) return "factory";
  if (/農舍/.test(buildingText)) return "farmhouse";
  if (/套房/.test(buildingText)) return "studio";
  if (/透天|別墅/.test(buildingText)) return "townhouse";
  if (/公寓/.test(buildingText)) return "apartment";
  if (/大樓|華廈|集合住宅/.test(buildingText)) {
    return typeof input.totalFloorCount === "number" && input.totalFloorCount > 0 && input.totalFloorCount <= 5
      ? "apartment"
      : "highrise";
  }
  if (typeof input.totalFloorCount === "number") {
    if (input.totalFloorCount >= 7) return "highrise";
    if (input.totalFloorCount >= 4) return "apartment";
    if (input.totalFloorCount >= 1) return "townhouse";
  }
  return "residential";
}

export function getAddressFirstClassification(address: string): AddressFirstClassification {
  if (!address.trim()) {
    return {
      status: "manual_required",
      propertyType: "residential",
      displayType: "需要人工確認",
      summary: "尚未取得地政判斷",
      manualSelectionRequired: true,
      landCount: 0,
      buildingCount: 0,
      note: "請輸入地址，或改用地號、建號建立案件。",
    };
  }

  if (/候選|多筆|結果不明確/.test(address)) {
    return {
      status: "manual_required",
      propertyType: "residential",
      displayType: "需要人工確認",
      summary: "找到多筆候選物件資料，請人工確認土地或建物",
      manualSelectionRequired: true,
      landCount: 2,
      buildingCount: 2,
      note: "多筆候選時先顯示候選資料，再由使用者選擇正確類型。",
    };
  }

  const isLandOnly = /農地|土地|地號/.test(address);
  const isFarmhouse = /農舍/.test(address);
  return {
    status: "classified",
    propertyType: isLandOnly ? "land" : "residential",
    displayType: isLandOnly ? "土地" : isFarmhouse ? "農舍" : "建物",
    summary: isLandOnly ? "已找到 2 筆土地" : "已找到 2 筆土地、1 筆建物",
    manualSelectionRequired: false,
    landCount: 2,
    buildingCount: isLandOnly ? 0 : 1,
    note: "只有地址查不到或結果不明確時才需要人工選擇。",
  };
}

export function classifyAddressLookupResult(
  address: string,
  parcels: AddressLookupParcel[],
): AddressFirstClassification {
  if (!address.trim()) return getAddressFirstClassification(address);

  if (parcels.length === 0) {
    return {
      status: "manual_required",
      propertyType: "residential",
      displayType: "需要人工確認",
      summary: "地政查無可判斷資料，請人工確認土地或建物",
      manualSelectionRequired: true,
      landCount: 0,
      buildingCount: 0,
      note: "查不到地政候選資料時才需要人工選擇。",
    };
  }

  if (parcels.length > 1) {
    const landLots = new Set(
      parcels.map((parcel) => parcel.lot_number?.trim()).filter(Boolean),
    );
    const buildingCount = parcels.filter((parcel) => Boolean(parcel.building_number?.trim())).length;
    return {
      status: "manual_required",
      propertyType: "residential",
      displayType: "需要人工確認",
      summary: "找到多筆候選物件資料，請人工確認土地或建物",
      manualSelectionRequired: true,
      landCount: landLots.size || parcels.filter((parcel) => !parcel.building_number?.trim()).length,
      buildingCount,
      note: "多筆候選時先顯示候選資料，再由使用者選擇正確類型。",
    };
  }

  const [parcel] = parcels;
  const hasBuilding = Boolean(parcel.building_number?.trim());
  const addressLooksLikeBuilding = /(\d+樓(?:之\d+)?|公寓|大樓|華廈|透天|別墅|套房)/.test(address);
  const isFarmhouse = /農舍/.test(parcel.address ?? address);
  const propertyType = inferPropertyTypeFromRegistryFields({
    hasBuilding,
    mainUse: parcel.main_use,
    buildingType: parcel.building_type,
    floor: parcel.floor,
    totalFloorCount: normalizeTotalFloorCount(parcel.total_floor_count),
    zoning: parcel.zoning,
    landUse: parcel.land_use,
    address: parcel.address || address,
  });
  if (!hasBuilding && addressLooksLikeBuilding) {
    return {
      status: "manual_required",
      propertyType: "residential",
      displayType: "建物需確認",
      summary: "已找到 1 筆土地，建號需人工確認",
      manualSelectionRequired: true,
      landCount: 1,
      buildingCount: 1,
      note: "門牌已定位到土地，但尚未取得建號；請人工確認建號後再建立正式案件。",
    };
  }
  return {
    status: "classified",
    propertyType,
    displayType: hasBuilding ? (isFarmhouse ? "農舍" : "建物") : "土地",
    summary: hasBuilding ? "已找到 1 筆土地、1 筆建物" : "已找到 1 筆土地",
    manualSelectionRequired: false,
    landCount: 1,
    buildingCount: hasBuilding ? 1 : 0,
    note: "由地政地址查詢結果自動判斷。",
  };
}

function normalizeTotalFloorCount(value: string | number | undefined): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return undefined;
  const parsed = Number.parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractFloorFromAddress(address?: string | null): string | undefined {
  const match = address?.match(/(\d+樓(?:之\d+)?)/);
  return match?.[1];
}

function normalizeUnitFloor(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes("樓")) return trimmed;
  return undefined;
}

function resolveDisplayFloor(input: {
  address?: string | null;
  registryFloor?: string;
  candidateFloor?: string;
  totalFloor?: string;
}): string | undefined {
  const addressFloor = extractFloorFromAddress(input.address);
  const unitFloor = normalizeUnitFloor(input.registryFloor) ?? normalizeUnitFloor(input.candidateFloor) ?? addressFloor;
  const totalFloor =
    normalizeTotalFloorCount(input.totalFloor) ??
    normalizeTotalFloorCount(input.registryFloor);
  if (unitFloor) {
    return [unitFloor, totalFloor ? `總樓層 ${totalFloor}` : ""].filter(Boolean).join(" / ");
  }
  if (totalFloor) return `本戶樓層待確認 / 總樓層 ${totalFloor}`;
  return undefined;
}

function formatRegistryCodeValue(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^[0-9A-Z]{1,4}$/i.test(trimmed)) return `代碼 ${trimmed}（待代碼表轉換）`;
  return trimmed;
}

function normalizePropertyTypeText(value: string | number | null | undefined): string {
  return String(value ?? "")
    .trim()
    .replace(/臺/g, "台")
    .replace(/\s+/g, "");
}

export function getDemoFieldReviewRows(caseData?: CaseRow): DemoFieldReviewRow[] {
  const rows = DEMO_FIELD_ROWS.map((row) => ({ ...row }));
  const registry = caseData?.land_registry_data;
  const ownerName = caseData?.owner_name?.trim();
  if (!ownerName) {
    removeFieldRow(rows, "姓名比對結果");
  }
  if (!registry) return rows;

  const ownership = getRegistryData(registry, "building_ownership");
  const building = getRegistryData(registry, "building_registry");
  const ownershipEntry = getProvenanceEntry(registry, "building_ownership");
  const buildingEntry = getProvenanceEntry(registry, "building_registry");
  const failures = isRegistryProvenancePayload(registry)
    ? extractRegistryFailureReasons(registry)
    : [];
  const hasProvenance = isRegistryProvenancePayload(registry);
  const landCandidate = findDisplayCandidate(registry, "land");
  const landCandidateFields = landCandidate?.summary_fields;
  const buildingCandidate = findDisplayCandidate(registry, "building");
  const buildingCandidateFields = buildingCandidate?.summary_fields;
  const realPriceEntry = getProvenanceEntry(registry, "real_price_query");

  const numerator = ownership?.numerator;
  const denominator = ownership?.denominator;
  if (
    typeof numerator === "number" &&
    typeof denominator === "number" &&
    isFormalRegistryEntry(ownershipEntry, hasProvenance)
  ) {
    updateFieldRow(rows, "建物權利範圍", {
      value: `${numerator}/${denominator}`,
      statusLabel: "地政已帶入",
      serviceName: "建物所有權資料",
      amountLabel: "已含本次費用",
    });
  }

  const constructionDate =
    textFromRecord(building, ["construction_date", "completion_date_roc", "COMPLETEDATE"]) ??
    textFromSummary(buildingCandidateFields, "constructionDate");
  const buildingStatus = isFormalRegistryEntry(buildingEntry, hasProvenance)
    ? { serviceName: "建物標示資料", statusLabel: "地政已帶入", amountLabel: "已含本次費用" }
    : { serviceName: "公開物件資料", statusLabel: "候選資料", amountLabel: "0 元" };
  if (typeof constructionDate === "string" && constructionDate.trim()) {
    updateFieldRow(rows, "登記日期", {
      value: formatRocDate(constructionDate),
      ...buildingStatus,
    });
  } else if (hasProvenance && building) {
    updateFieldRow(rows, "登記日期", {
      value: "待確認",
      serviceName: "公開物件資料",
      statusLabel: "待確認",
    });
  }

  const ownershipFailure = failures.find((failure) => failure.apiId === "building_ownership");
  if (ownershipFailure) {
    updateFieldRow(rows, "建物權利範圍", {
      value: ownershipFailure.reason,
      serviceName: "建物所有權資料",
      statusLabel: "查詢未成功",
      amountLabel: "0 元",
    });
  }

  const buildingNumber =
    textFromRecord(building, ["building_number", "NO", "BUILDINGNO"]) ??
    buildingCandidate?.parcel_number;
  if (buildingNumber) {
    updateFieldRow(rows, "門牌查詢建號", {
      helper: "免費物件查詢取得的建號",
      value: `已找到建號 ${buildingNumber}`,
      serviceName: "免費物件查詢",
      statusLabel: "候選資料",
      amountLabel: "0 元",
    });
  }

  const registeredAreaSqm = numberFromRecord(building, ["area", "building_area", "AREA"]);
  const registeredAreaPing =
    numberFromSummary(buildingCandidateFields, "registeredAreaPing") ??
    m2ToPing(registeredAreaSqm);
  if (registeredAreaPing !== undefined || registeredAreaSqm !== undefined) {
    appendOrUpdateFieldRow(rows, {
      fieldName: "建物面積",
      helper: "建物面積",
      value: registeredAreaSqm !== undefined && registeredAreaPing !== undefined
        ? `${registeredAreaSqm.toFixed(2)} 平方公尺（${registeredAreaPing.toFixed(2)} 坪）`
        : `${registeredAreaPing?.toFixed(2) ?? ""} 坪`,
      ...buildingStatus,
    });
  }

  const legalUse = formatRegistryCodeValue(
    textFromRecord(building, ["main_use", "purpose", "building_purpose", "PURPOSE"]) ??
      textFromSummary(buildingCandidateFields, "legalUse"),
  );
  if (legalUse) {
    appendOrUpdateFieldRow(rows, {
      fieldName: "主要用途",
      helper: "主要用途",
      value: legalUse,
      ...buildingStatus,
    });
  }

  const landStatus = { serviceName: "公開物件資料", statusLabel: "候選資料", amountLabel: "0 元" };
  const landAreaSqm = numberFromSummary(landCandidateFields, "landAreaSqm");
  if (landAreaSqm !== undefined) {
    appendOrUpdateFieldRow(rows, {
      fieldName: "土地面積",
      helper: "土地面積",
      value: `${landAreaSqm.toLocaleString("zh-TW")} 平方公尺`,
      ...landStatus,
    });
  }

  const announcedLandCurrentValue = numberFromSummary(landCandidateFields, "announcedLandCurrentValue");
  if (announcedLandCurrentValue !== undefined) {
    appendOrUpdateFieldRow(rows, {
      fieldName: "公告土地現值",
      helper: "公告土地現值",
      value: `${announcedLandCurrentValue.toLocaleString("zh-TW")} 元/平方公尺`,
      ...landStatus,
    });
  }

  const announcedLandValue = numberFromSummary(landCandidateFields, "announcedLandValue");
  if (announcedLandValue !== undefined) {
    appendOrUpdateFieldRow(rows, {
      fieldName: "公告地價",
      helper: "公告地價",
      value: `${announcedLandValue.toLocaleString("zh-TW")} 元/平方公尺`,
      ...landStatus,
    });
  }

  if (
    realPriceEntry?.status === "candidate" &&
    realPriceEntry.source === "public_candidate" &&
    Array.isArray(realPriceEntry.data) &&
    realPriceEntry.data.length > 0
  ) {
    appendOrUpdateFieldRow(rows, {
      fieldName: "實價登錄行情",
      helper: "附近成交行情",
      value: `已取得 ${realPriceEntry.data.length} 筆附近成交行情`,
      serviceName: "免費附近行情",
      statusLabel: "候選資料",
      amountLabel: "0 元",
    });
  }

  const floor = textFromRecord(building, ["building_floor", "floor_label", "BUILDINGFLOOR"]);
  const candidateFloor = textFromSummary(buildingCandidateFields, "floor");
  const totalFloor =
    textFromRecord(building, ["total_floor_count", "totalFloorCount", "TOTALFLOOR"]) ??
    textFromSummary(buildingCandidateFields, "totalFloorCount");
  const displayFloor = resolveDisplayFloor({
    address: caseData?.address,
    registryFloor: floor,
    candidateFloor,
    totalFloor,
  });
  if (displayFloor) {
    appendOrUpdateFieldRow(rows, {
      fieldName: "樓層",
      helper: "樓層",
      value: displayFloor,
      ...buildingStatus,
    });
  }

  const age =
    textFromRecord(building, ["age_years", "building_age"]) ??
    textFromSummary(buildingCandidateFields, "age");
  if (age) {
    appendOrUpdateFieldRow(rows, {
      fieldName: "屋齡",
      helper: "屋齡",
      value: formatAge(age),
      ...buildingStatus,
    });
  }

  if (ownerName) {
    updateFieldRow(rows, "屋主姓名", {
      value: ownerName,
      serviceName: "案件資料",
      statusLabel: "已提供",
    });
  }

  return rows;
}

export function getUsageLedgerRows(caseData?: CaseRow): UsageLedgerRow[] {
  const registry = caseData?.land_registry_data;
  if (!registry || !isRegistryProvenancePayload(registry)) {
    return USAGE_LEDGER_ROWS.filter((row) => row.amountLabel === "0 元");
  }
  const formalSuccessCount = Object.values(registry.entries).filter(
    (entry) => entry.source === "moi_api" && entry.status === "success" && entry.trustedForPdf,
  ).length;
  if (formalSuccessCount === 0) {
    return USAGE_LEDGER_ROWS.filter((row) => row.amountLabel === "0 元");
  }
  const amountLabel = typeof registry.totalCost === "number"
    ? `${registry.totalCost.toLocaleString("zh-TW")} 元`
    : "待帳務同步";
  return [
    USAGE_LEDGER_ROWS[0],
    {
      serviceName: "地政謄本匯入",
      outcomeLabel: "成功",
      returnRowsLabel: `${formalSuccessCount} 組`,
      amountLabel,
      reason: "使用者確認後執行正式地政資料匯入",
      admin: {
        serviceCode: "FORMAL_REGISTRY_IMPORT",
      },
    },
  ];
}

export function getEntitlementFeatures(): EntitlementFeature[] {
  return ENTITLEMENT_FEATURES;
}

export function getPdfAssetSlots(): PdfAssetSlot[] {
  return PDF_ASSET_SLOTS;
}

export function isFrontstageTextClean(text: string): boolean {
  return FRONTSTAGE_FORBIDDEN_PATTERNS.every((pattern) => !pattern.test(text));
}

function getRegistryData(registry: Record<string, unknown>, key: string): Record<string, unknown> | null {
  if (isRegistryProvenancePayload(registry)) {
    const preSurvey = extractPreSurveyRegistryData(registry);
    const section = preSurvey[key];
    return section && typeof section === "object" && !Array.isArray(section)
      ? (section as Record<string, unknown>)
      : null;
  }
  const section = registry[key];
  if (!section || typeof section !== "object") return null;
  const data = (section as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return null;
  return data as Record<string, unknown>;
}

function updateFieldRow(rows: DemoFieldReviewRow[], fieldName: string, patch: Partial<DemoFieldReviewRow>) {
  const index = rows.findIndex((row) => row.fieldName === fieldName);
  if (index === -1) return;
  rows[index] = { ...rows[index], ...patch };
}

function appendOrUpdateFieldRow(rows: DemoFieldReviewRow[], row: DemoFieldReviewRow) {
  const index = rows.findIndex((current) => current.fieldName === row.fieldName);
  if (index === -1) {
    rows.push(row);
    return;
  }
  rows[index] = { ...rows[index], ...row };
}

function removeFieldRow(rows: DemoFieldReviewRow[], fieldName: string) {
  const index = rows.findIndex((row) => row.fieldName === fieldName);
  if (index !== -1) rows.splice(index, 1);
}

function getProvenanceEntry(registry: unknown, key: string): RegistryProvenanceEntry | undefined {
  if (!isRegistryProvenancePayload(registry)) return undefined;
  return registry.entries[key];
}

function isFormalRegistryEntry(entry: RegistryProvenanceEntry | undefined, hasProvenance: boolean): boolean {
  if (!hasProvenance) return true;
  return Boolean(
    entry &&
    entry.trustedForPdf &&
    (entry.status === "success" || entry.status === "manual_confirmed") &&
    (entry.source === "moi_api" || entry.source === "manual"),
  );
}

function findDisplayCandidate(
  registry: unknown,
  parcelType: "land" | "building",
): CandidateParcelOption | undefined {
  if (!isRegistryProvenancePayload(registry)) return undefined;
  const options = extractCandidateOptions(registry).filter(
    (candidate) => candidate.parcel_type === parcelType && candidate.query_status !== "failed",
  );
  const selectedId = registry.confirmed_parcel_ids?.[parcelType] ?? registry.selected_candidate_ids?.[parcelType];
  if (selectedId) {
    const selected = options.find((candidate) => candidate.candidate_id === selectedId);
    if (selected) return selected;
  }
  const confirmed = options.find((candidate) => candidate.confirmation_state === "confirmed");
  if (confirmed) return confirmed;
  const selected = options.find((candidate) => candidate.confirmation_state === "selected_candidate");
  if (selected) return selected;
  return options.length === 1 ? options[0] : undefined;
}

function numberFromSummary(fields: CandidateParcelOption["summary_fields"] | undefined, key: string): number | undefined {
  const value = fields?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function textFromSummary(fields: CandidateParcelOption["summary_fields"] | undefined, key: string): string | undefined {
  const value = fields?.[key];
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function textFromRecord(record: Record<string, unknown> | null, keys: string[]): string | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function numberFromRecord(record: Record<string, unknown> | null, keys: string[]): number | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/,/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function m2ToPing(value?: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value * 0.3025 * 100) / 100
    : undefined;
}

function formatAge(value: string): string {
  return /年$/.test(value) ? value : `${value}年`;
}

function formatRocDate(value: string): string {
  const trimmed = value.trim();
  const slash = trimmed.match(/^(\d{2,3})\/(\d{1,2})\/(\d{1,2})$/);
  if (slash) {
    const [, year, month, day] = slash;
    return `民國${year.padStart(3, "0")}年${month.padStart(2, "0")}月${day.padStart(2, "0")}日`;
  }
  const compact = trimmed.match(/^(\d{3})(\d{2})(\d{2})$/);
  if (compact) {
    const [, year, month, day] = compact;
    return `民國${year.padStart(3, "0")}年${month.padStart(2, "0")}月${day.padStart(2, "0")}日`;
  }
  return trimmed;
}
