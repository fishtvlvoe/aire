import { describe, expect, it } from "vitest";
import {
  getCaseManagementViews,
  getProductNavigationModel,
  getVisibleCaseManagementScope,
} from "@/lib/product-navigation-ia";

describe("product navigation IA", () => {
  it("separates primary, secondary, and case-workbench levels", () => {
    const model = getProductNavigationModel();

    expect(model.some((item) => item.level === "primary" && item.label === "案件管理")).toBe(true);
    expect(model.some((item) => item.level === "secondary" && item.label === "案件總覽")).toBe(true);
    expect(model.some((item) => item.level === "case-workbench" && item.label === "現場必問")).toBe(true);

    const secondaryLabels = model
      .filter((item) => item.level === "secondary")
      .map((item) => item.label);
    expect(secondaryLabels).toContain("新增案件");
    expect(secondaryLabels).toContain("補件清單");
    expect(secondaryLabels).toContain("方案與升級");
    expect(secondaryLabels).not.toContain("地政查詢");
    expect(secondaryLabels).not.toContain("功能開關");
    expect(secondaryLabels).not.toContain("授權與升級");
    expect(secondaryLabels).not.toContain("現場必問");
  });

  it("maps case management views to distinct main content scopes", () => {
    expect(getCaseManagementViews().map((view) => view.id)).toEqual([
      "overview",
      "workbench",
      "supplements",
      "pdf",
      "export",
    ]);

    expect(getVisibleCaseManagementScope("overview")).toMatchObject({
      heading: "案件總覽",
      showsCaseOverview: true,
      showsWorkbenchPrompt: false,
      showsSupplementTasks: false,
    });
    expect(getVisibleCaseManagementScope("workbench")).toMatchObject({
      heading: "說明書工作台",
      showsCaseOverview: false,
      showsWorkbenchPrompt: true,
      showsSupplementTasks: false,
    });
    expect(getVisibleCaseManagementScope("supplements")).toMatchObject({
      heading: "補件清單",
      showsCaseOverview: false,
      showsWorkbenchPrompt: false,
      showsSupplementTasks: true,
    });
    expect(getVisibleCaseManagementScope("pdf")).toMatchObject({
      heading: "PDF 預覽",
      showsCaseOverview: false,
      documentPrompt: "請先選擇案件產生 PDF 預覽。",
    });
    expect(getVisibleCaseManagementScope("export")).toMatchObject({
      heading: "列印與匯出",
      showsCaseOverview: false,
      documentPrompt: "請先選擇案件列印或匯出文件。",
    });
  });
});
