export type ProductNavigationLevel = "primary" | "secondary" | "case-workbench";
export type ProductNavigationScope = "global" | "module" | "case";
export type CaseManagementViewId = "overview" | "workbench" | "supplements" | "pdf" | "export";

export interface ProductNavigationItem {
  level: ProductNavigationLevel;
  label: string;
  href: string;
  scope: ProductNavigationScope;
  parentLabel?: string;
  description?: string;
  primaryAction?: boolean;
}

export interface CaseManagementView {
  id: CaseManagementViewId;
  label: string;
  href: string;
  heading: string;
  eyebrow: string;
  description: string;
  showsCaseOverview: boolean;
  showsWorkbenchPrompt: boolean;
  showsSupplementTasks: boolean;
  documentPrompt?: string;
}

const PRIMARY_NAVIGATION: ProductNavigationItem[] = [
  {
    level: "primary",
    label: "案件管理",
    href: "/cases",
    scope: "global",
    description: "案件、說明書、補件",
  },
  {
    level: "primary",
    label: "地政資料",
    href: "/cases/new",
    scope: "global",
    description: "基本功能",
  },
  {
    level: "primary",
    label: "產出文件",
    href: "/cases?view=pdf",
    scope: "global",
    description: "預覽、匯出、列印",
  },
  {
    level: "primary",
    label: "系統設定",
    href: "/settings",
    scope: "global",
    description: "帳號、授權、升級",
  },
];

const SECONDARY_NAVIGATION: ProductNavigationItem[] = [
  { level: "secondary", label: "案件總覽", href: "/cases", scope: "module", parentLabel: "案件管理" },
  { level: "secondary", label: "新增案件", href: "/cases/new", scope: "module", parentLabel: "案件管理" },
  { level: "secondary", label: "說明書工作台", href: "/cases?view=workbench", scope: "module", parentLabel: "案件管理" },
  { level: "secondary", label: "補件清單", href: "/cases?view=supplements", scope: "module", parentLabel: "案件管理" },
  { level: "secondary", label: "資料來源", href: "/settings?section=registry-rules", scope: "module", parentLabel: "地政資料" },
  { level: "secondary", label: "費用紀錄", href: "/settings?section=billing", scope: "module", parentLabel: "地政資料" },
  { level: "secondary", label: "PDF 預覽", href: "/cases?view=pdf", scope: "module", parentLabel: "產出文件" },
  { level: "secondary", label: "列印與匯出", href: "/cases?view=export", scope: "module", parentLabel: "產出文件" },
  { level: "secondary", label: "個人設定", href: "/settings", scope: "module", parentLabel: "系統設定" },
  { level: "secondary", label: "地政授權", href: "/settings?section=registry-auth", scope: "module", parentLabel: "系統設定" },
  { level: "secondary", label: "方案與升級", href: "/settings?section=plans", scope: "module", parentLabel: "系統設定" },
];

const CASE_WORKBENCH_NAVIGATION: ProductNavigationItem[] = [
  { level: "case-workbench", label: "基本資料", href: "#basic", scope: "case", parentLabel: "說明書工作台", primaryAction: true },
  { level: "case-workbench", label: "地政資料", href: "#registry", scope: "case", parentLabel: "說明書工作台" },
  { level: "case-workbench", label: "揭露資料", href: "#disclosure", scope: "case", parentLabel: "說明書工作台" },
  { level: "case-workbench", label: "現場必問", href: "#field-visit", scope: "case", parentLabel: "說明書工作台" },
  { level: "case-workbench", label: "補件", href: "#supplements", scope: "case", parentLabel: "說明書工作台" },
  { level: "case-workbench", label: "PDF 檢查", href: "#pdf", scope: "case", parentLabel: "說明書工作台" },
];

const CASE_MANAGEMENT_VIEWS: CaseManagementView[] = [
  {
    id: "overview",
    label: "案件總覽",
    href: "/cases",
    heading: "案件總覽",
    eyebrow: "案件管理",
    description: "選擇要處理的案件，或建立新案件。",
    showsCaseOverview: true,
    showsWorkbenchPrompt: false,
    showsSupplementTasks: false,
  },
  {
    id: "workbench",
    label: "說明書工作台",
    href: "/cases?view=workbench",
    heading: "說明書工作台",
    eyebrow: "案件管理",
    description: "請先選擇案件，再進入該案件的說明書工作台。",
    showsCaseOverview: false,
    showsWorkbenchPrompt: true,
    showsSupplementTasks: false,
  },
  {
    id: "supplements",
    label: "補件清單",
    href: "/cases?view=supplements",
    heading: "補件清單",
    eyebrow: "案件管理",
    description: "只顯示目前需要補資料的案件。",
    showsCaseOverview: false,
    showsWorkbenchPrompt: false,
    showsSupplementTasks: true,
  },
  {
    id: "pdf",
    label: "PDF 預覽",
    href: "/cases?view=pdf",
    heading: "PDF 預覽",
    eyebrow: "產出文件",
    description: "請先選擇案件產生 PDF 預覽。",
    showsCaseOverview: false,
    showsWorkbenchPrompt: false,
    showsSupplementTasks: false,
    documentPrompt: "請先選擇案件產生 PDF 預覽。",
  },
  {
    id: "export",
    label: "列印與匯出",
    href: "/cases?view=export",
    heading: "列印與匯出",
    eyebrow: "產出文件",
    description: "請先選擇案件列印或匯出文件。",
    showsCaseOverview: false,
    showsWorkbenchPrompt: false,
    showsSupplementTasks: false,
    documentPrompt: "請先選擇案件列印或匯出文件。",
  },
];

export function getProductNavigationModel(): ProductNavigationItem[] {
  return [...PRIMARY_NAVIGATION, ...SECONDARY_NAVIGATION, ...CASE_WORKBENCH_NAVIGATION];
}

export function getPrimaryNavigation(): ProductNavigationItem[] {
  return PRIMARY_NAVIGATION;
}

export function getSecondaryNavigation(parentLabel: string): ProductNavigationItem[] {
  return SECONDARY_NAVIGATION.filter((item) => item.parentLabel === parentLabel);
}

export function getCaseWorkbenchNavigation(): ProductNavigationItem[] {
  return CASE_WORKBENCH_NAVIGATION;
}

export function getCaseManagementViews(): CaseManagementView[] {
  return CASE_MANAGEMENT_VIEWS;
}

export function normalizeCaseManagementView(value: string | null): CaseManagementViewId {
  if (value === "workbench" || value === "supplements" || value === "pdf" || value === "export") return value;
  return "overview";
}

export function getVisibleCaseManagementScope(value: string | null): CaseManagementView {
  const normalized = normalizeCaseManagementView(value);
  return CASE_MANAGEMENT_VIEWS.find((view) => view.id === normalized) ?? CASE_MANAGEMENT_VIEWS[0];
}

export function getCaseRowDestination(view: CaseManagementViewId, caseId: string): string {
  switch (view) {
    case "supplements":
      return `/cases/${caseId}?tab=supplements`;
    case "pdf":
      return `/cases/${caseId}/preview`;
    case "export":
      return `/cases/${caseId}/preview?mode=export`;
    case "workbench":
    case "overview":
    default:
      return `/cases/${caseId}`;
  }
}
