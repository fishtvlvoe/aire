import type { CaseRow } from "@/lib/cases-api";
import { getPrimaryNavigation, getSecondaryNavigation } from "@/lib/product-navigation-ia";
import {
  extractPreSurveyRegistryData,
  extractRegistryFailureReasons,
  isRegistryProvenancePayload,
} from "@/lib/registry-provenance";

export const FRONTSTAGE_FORBIDDEN_PATTERNS = [
  /MOI_API_/,
  /COP\d{3}/,
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
  propertyType: CaseRow["property_type"];
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

const DEMO_FIELD_ROWS: DemoFieldReviewRow[] = [
  {
    fieldName: "屋主姓名",
    helper: "由屋主或正式文件提供",
    value: "待屋主提供或由謄本帶入",
    serviceName: "屋主提供資料",
    statusLabel: "需人工提供",
    amountLabel: "0 元",
  },
  {
    fieldName: "建物權利範圍",
    helper: "建物所有權資料",
    value: "全部 1/1",
    serviceName: "建物所有權資料",
    statusLabel: "地政已帶入",
    amountLabel: "27 元",
  },
  {
    fieldName: "登記日期",
    helper: "建物所有權資料",
    value: "113/08/12",
    serviceName: "建物所有權資料",
    statusLabel: "地政已帶入",
    amountLabel: "已含本次費用",
  },
  {
    fieldName: "姓名比對結果",
    helper: "用屋主姓名比對所有權人",
    value: "等待屋主姓名後再比對",
    serviceName: "所有權人比對服務",
    statusLabel: "待資料",
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
    serviceName: "建物所有權資料",
    outcomeLabel: "成功",
    returnRowsLabel: "27 筆",
    amountLabel: "27 元",
    reason: "依回傳筆數計費",
    admin: {
      serviceCode: "MOI_API_005",
      transactionId: "08d28190-1640-4673-9371-f8691d48c5bb",
    },
  },
  {
    serviceName: "門牌建號查詢",
    outcomeLabel: "查詢未成功",
    returnRowsLabel: "0 筆",
    amountLabel: "0 元",
    reason: "地政查詢失敗，預設不計費",
    admin: {
      serviceCode: "MOI_API_037",
      rawCode: "COP309",
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
    { id: "profile", label: "個人設定" },
    { id: "registry-auth", label: "地政授權" },
    { id: "plans", label: "方案與升級" },
  ];
}

export function getUpgradePlans(): UpgradePlan[] {
  return UPGRADE_PLANS;
}

export function getCustomerServiceLabel(serviceCode: string): string {
  return SERVICE_LABELS[serviceCode] ?? "地政資料";
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
      summary: "找到多筆候選地政資料，請人工確認土地或建物",
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
    return {
      status: "manual_required",
      propertyType: "residential",
      displayType: "需要人工確認",
      summary: "找到多筆候選地政資料，請人工確認土地或建物",
      manualSelectionRequired: true,
      landCount: parcels.length,
      buildingCount: parcels.filter((parcel) => Boolean(parcel.building_number?.trim())).length,
      note: "多筆候選時先顯示候選資料，再由使用者選擇正確類型。",
    };
  }

  const [parcel] = parcels;
  const hasBuilding = Boolean(parcel.building_number?.trim());
  const isFarmhouse = /農舍/.test(parcel.address ?? address);
  return {
    status: "classified",
    propertyType: hasBuilding ? "residential" : "land",
    displayType: hasBuilding ? (isFarmhouse ? "農舍" : "建物") : "土地",
    summary: hasBuilding ? "已找到 1 筆土地、1 筆建物" : "已找到 1 筆土地",
    manualSelectionRequired: false,
    landCount: 1,
    buildingCount: hasBuilding ? 1 : 0,
    note: "由地政地址查詢結果自動判斷。",
  };
}

export function getDemoFieldReviewRows(caseData?: CaseRow): DemoFieldReviewRow[] {
  const rows = DEMO_FIELD_ROWS.map((row) => ({ ...row }));
  const registry = caseData?.land_registry_data;
  if (!registry) return rows;

  const ownership = getRegistryData(registry, "building_ownership");
  const building = getRegistryData(registry, "building_registry");
  const failures = isRegistryProvenancePayload(registry)
    ? extractRegistryFailureReasons(registry)
    : [];
  const hasProvenance = isRegistryProvenancePayload(registry);

  const numerator = ownership?.numerator;
  const denominator = ownership?.denominator;
  if (typeof numerator === "number" && typeof denominator === "number") {
    updateFieldRow(rows, "建物權利範圍", {
      value: `${numerator}/${denominator}`,
      statusLabel: "地政已帶入",
    });
  }

  const constructionDate = building?.construction_date;
  if (typeof constructionDate === "string" && constructionDate.trim()) {
    updateFieldRow(rows, "登記日期", {
      value: constructionDate,
      serviceName: hasProvenance ? "建物標示資料" : "建物所有權資料",
      statusLabel: hasProvenance ? "待確認" : "地政已帶入",
    });
  } else if (hasProvenance && building) {
    updateFieldRow(rows, "登記日期", {
      value: "待確認",
      serviceName: "建物標示資料",
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

  if (caseData.owner_name?.trim()) {
    updateFieldRow(rows, "屋主姓名", {
      value: "已由案件資料提供，可進行比對",
      statusLabel: "待系統補齊",
    });
  }

  return rows;
}

export function getUsageLedgerRows(): UsageLedgerRow[] {
  return USAGE_LEDGER_ROWS;
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
