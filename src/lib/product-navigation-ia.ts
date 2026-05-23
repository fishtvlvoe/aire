export type ProductNavigationLevel = "primary" | "secondary" | "case-workbench";
export type ProductNavigationScope = "global" | "module" | "case";
export type CaseManagementViewId = "overview" | "workbench" | "supplements";

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
    label: "系統設定",
    href: "/settings",
    scope: "global",
    description: "帳號、授權、升級",
  },
];

const SECONDARY_NAVIGATION: ProductNavigationItem[] = [
  { level: "secondary", label: "案件總覽", href: "/cases", scope: "module", parentLabel: "案件管理" },
  { level: "secondary", label: "新增案件", href: "/cases/new", scope: "module", parentLabel: "案件管理" },
  { level: "secondary", label: "物件審核", href: "/cases?view=workbench", scope: "module", parentLabel: "案件管理" },
  { level: "secondary", label: "補件清單", href: "/cases?view=supplements", scope: "module", parentLabel: "案件管理" },
  { level: "secondary", label: "資料來源", href: "/settings?section=registry-rules", scope: "module", parentLabel: "地政資料" },
  { level: "secondary", label: "費用紀錄", href: "/settings?section=billing", scope: "module", parentLabel: "地政資料" },
  { level: "secondary", label: "個人設定", href: "/settings", scope: "module", parentLabel: "系統設定" },
  { level: "secondary", label: "品牌與交付資訊", href: "/settings/branding", scope: "module", parentLabel: "系統設定" },
  { level: "secondary", label: "地政授權", href: "/settings?section=registry-auth", scope: "module", parentLabel: "系統設定" },
  { level: "secondary", label: "方案與升級", href: "/settings?section=plans", scope: "module", parentLabel: "系統設定" },
];

const CASE_WORKBENCH_NAVIGATION: ProductNavigationItem[] = [
  { level: "case-workbench", label: "欄位", href: "#fields", scope: "case", parentLabel: "物件審核", primaryAction: true },
  { level: "case-workbench", label: "資料來源", href: "#sources", scope: "case", parentLabel: "物件審核" },
  { level: "case-workbench", label: "補件/現場", href: "#supplements", scope: "case", parentLabel: "物件審核" },
  { level: "case-workbench", label: "PDF 檢查", href: "#pdf", scope: "case", parentLabel: "物件審核" },
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
    label: "物件審核",
    href: "/cases?view=workbench",
    heading: "物件審核",
    eyebrow: "案件管理",
    description: "請先選擇案件，再進入該案件的物件審核流程。",
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
  if (value === "workbench" || value === "supplements") return value;
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
    case "workbench":
    case "overview":
    default:
      return `/cases/${caseId}`;
  }
}
