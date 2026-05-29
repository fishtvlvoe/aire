import { describe, expect, it } from "vitest";
import {
  getCaseManagementViews,
  getCaseRowDestination,
  getProductNavigationModel,
  getVisibleCaseManagementScope,
} from "@/lib/product-navigation-ia";

describe("product navigation IA", () => {
  it("separates primary, secondary, and case-workbench levels", () => {
    const model = getProductNavigationModel();

    expect(model.some((item) => item.level === "primary" && item.label === "案件管理")).toBe(true);
    expect(model.some((item) => item.level === "secondary" && item.label === "案件總覽")).toBe(true);
    expect(model.some((item) => item.level === "case-workbench" && item.label === "補件/現場")).toBe(true);

    const secondaryLabels = model
      .filter((item) => item.level === "secondary")
      .map((item) => item.label);
    expect(secondaryLabels).toContain("新增案件");
    expect(secondaryLabels).toContain("補件清單");
    expect(secondaryLabels).toContain("方案設定");
    expect(secondaryLabels).not.toContain("個人設定");
    expect(secondaryLabels).not.toContain("方案與升級");
    expect(secondaryLabels).not.toContain("PDF 預覽");
    expect(secondaryLabels).not.toContain("列印與匯出");
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
    ]);

    expect(getVisibleCaseManagementScope("overview")).toMatchObject({
      heading: "案件總覽",
      showsCaseOverview: true,
      showsWorkbenchPrompt: false,
      showsSupplementTasks: false,
    });
    expect(getVisibleCaseManagementScope("workbench")).toMatchObject({
      heading: "物件審核",
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
      heading: "案件總覽",
      showsCaseOverview: true,
    });
  });

  it("routes case rows according to the selected workflow scope", () => {
    expect(getCaseRowDestination("overview", "case-1")).toBe("/cases/case-1");
    expect(getCaseRowDestination("workbench", "case-1")).toBe("/cases/case-1");
    expect(getCaseRowDestination("supplements", "case-1")).toBe("/cases/case-1?tab=supplements");
  });
});
