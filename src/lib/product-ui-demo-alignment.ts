import type { CaseRow } from "@/lib/cases-api";

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
  label: string;
  description: string;
  enabled: boolean;
  upgraded: boolean;
  ariaLabel: string;
}

export interface PdfAssetSlot {
  label: string;
  description: string;
}

const SIDEBAR_FOLDERS: DemoSidebarFolder[] = [
  {
    label: "案件管理",
    description: "案件、說明書、補件",
    items: [
      { label: "案件總覽", href: "/cases" },
      { label: "說明書工作台", href: "/cases?view=workbench" },
      { label: "補件清單", href: "/cases?view=supplements" },
    ],
  },
  {
    label: "地政資料",
    description: "基本功能",
    items: [
      { label: "地政查詢", href: "/cases/new" },
      { label: "資料來源", href: "/settings?section=registry-rules" },
      { label: "費用紀錄", href: "/settings?section=billing" },
    ],
  },
  {
    label: "產出文件",
    description: "預覽、匯出、列印",
    items: [
      { label: "PDF 預覽", href: "/cases?view=pdf" },
      { label: "列印與匯出", href: "/cases?view=export" },
    ],
  },
  {
    label: "系統設定",
    description: "授權、金鑰、開關",
    items: [
      { label: "地政授權", href: "/settings?section=registry-auth" },
      { label: "功能開關", href: "/settings?section=features" },
      { label: "授權與升級", href: "/settings?section=entitlements" },
    ],
  },
];

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  { id: "entitlements", label: "授權與升級" },
  { id: "registry-rules", label: "地政資料規則" },
  { id: "billing", label: "費用與帳務" },
  { id: "pdf-assets", label: "PDF 圖資欄位" },
  { id: "registry-auth", label: "地政授權" },
];

const SERVICE_LABELS: Record<string, string> = {
  MOI_API_005: "建物所有權資料",
  MOI_API_037: "門牌建號查詢",
  MOI_API_009: "所有權人比對服務",
  MOI_API_041: "帳務查詢",
};

const DEMO_FIELD_ROWS: DemoFieldReviewRow[] = [
  {
    fieldName: "私人屋主姓名",
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
    fieldName: "屋主姓名確認",
    helper: "用已提供姓名確認是否相符",
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
    label: "Google 地圖",
    description: "進階方案後新增進階圖資選單，不在基本方案工作台常駐顯示",
    enabled: false,
    upgraded: false,
    ariaLabel: "Google 地圖未升級",
  },
  {
    label: "空拍圖 / 街景參考",
    description: "進階方案後輸出 PDF 圖頁與外部圖資參考",
    enabled: false,
    upgraded: false,
    ariaLabel: "空拍街景未升級",
  },
  {
    label: "AI 格局圖整理",
    description: "基本方案保留手動上傳位置，進階方案才開啟 AI 整理",
    enabled: false,
    upgraded: false,
    ariaLabel: "AI 格局圖未升級",
  },
  {
    label: "地籍圖整理",
    description: "地政原始資料客戶自付，AIRE 整理功能走升級",
    enabled: true,
    upgraded: true,
    ariaLabel: "地籍圖整理已開啟",
  },
];

const PDF_ASSET_SLOTS: PdfAssetSlot[] = [
  { label: "地籍圖", description: "基本方案可放地政資料；進階整理需升級" },
  { label: "地標圖", description: "進階方案由 AIRE 產生" },
  { label: "空拍圖", description: "進階方案啟用後自動放入 PDF" },
  { label: "格局圖", description: "基本方案手動上傳；進階方案可 AI 整理" },
];

export function getDemoSidebarFolders(): DemoSidebarFolder[] {
  return SIDEBAR_FOLDERS;
}

export function getSettingsCategories(): SettingsCategory[] {
  return SETTINGS_CATEGORIES;
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
  return {
    status: "classified",
    propertyType: isLandOnly ? "land" : "residential",
    displayType: isLandOnly ? "土地" : "農舍",
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
  return {
    status: "classified",
    propertyType: hasBuilding ? "residential" : "land",
    displayType: hasBuilding ? "農舍" : "土地",
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
      statusLabel: "地政已帶入",
    });
  }

  if (caseData.owner_name?.trim()) {
    updateFieldRow(rows, "私人屋主姓名", {
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
