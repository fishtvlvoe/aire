import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  FRONTSTAGE_FORBIDDEN_PATTERNS,
  getAddressFirstClassification,
  classifyAddressLookupResult,
  getCustomerServiceLabel,
  getDemoSidebarFolders,
  getSettingsCategories,
  getUsageLedgerRows,
  isFrontstageTextClean,
} from "../product-ui-demo-alignment";

const projectRoot = process.cwd();

describe("product-ui-demo-alignment contract", () => {
  it("keeps the two demo HTML files as the UI source of truth", () => {
    const workbench = readFileSync(
      join(projectRoot, "UI-UX-DEMO-REFERENCE/registry-autofill-workbench.html"),
      "utf8",
    );
    const settings = readFileSync(
      join(projectRoot, "UI-UX-DEMO-REFERENCE/registry-autofill-settings.html"),
      "utf8",
    );

    expect(workbench).toContain("說明書工作台");
    expect(workbench).toContain("案件與章節");
    expect(workbench).toContain("欄位審核");
    expect(settings).toContain("授權與升級");
    expect(settings).toContain("費用與帳務");
    expect(settings).toContain("PDF 圖資欄位");
  });

  it("defines the folder sidebar and settings categories expected by the demo", () => {
    expect(getDemoSidebarFolders().map((folder) => folder.label)).toEqual([
      "案件管理",
      "地政資料",
      "產出文件",
      "系統設定",
    ]);
    expect(getDemoSidebarFolders()[0].items.map((item) => item.label)).toEqual([
      "案件總覽",
      "說明書工作台",
      "補件清單",
    ]);
    expect(getSettingsCategories().map((category) => category.label)).toEqual([
      "授權與升級",
      "地政資料規則",
      "費用與帳務",
      "PDF 圖資欄位",
      "地政授權",
    ]);
  });

  it("classifies case creation from address first and only falls back when ambiguous", () => {
    const classified = getAddressFirstClassification("宜蘭縣五結鄉協和村親河路二段 1 號");
    expect(classified.status).toBe("classified");
    expect(classified.propertyType).toBe("residential");
    expect(classified.displayType).toBe("建物");
    expect(classified.manualSelectionRequired).toBe(false);
    expect(classified.summary).toContain("已找到 2 筆土地、1 筆建物");

    const ambiguous = getAddressFirstClassification("");
    expect(ambiguous.status).toBe("manual_required");
    expect(ambiguous.manualSelectionRequired).toBe(true);

    const multipleCandidates = getAddressFirstClassification("宜蘭縣五結鄉協和村親河路二段 候選多筆");
    expect(multipleCandidates.status).toBe("manual_required");
    expect(multipleCandidates.manualSelectionRequired).toBe(true);
    expect(multipleCandidates.summary).toContain("多筆候選");
  });

  it("classifies case creation from backend address lookup results", () => {
    const classified = classifyAddressLookupResult("宜蘭縣五結鄉協和村親河路二段 1 號", [
      {
        parcel_id: "0001-0001",
        address: "宜蘭縣五結鄉協和村親河路二段 1 號",
        lot_number: "0001",
        building_number: "0001",
      },
    ]);

    expect(classified.status).toBe("classified");
    expect(classified.displayType).toBe("建物");
    expect(classified.summary).toBe("已找到 1 筆土地、1 筆建物");
    expect(classified.manualSelectionRequired).toBe(false);

    const multipleCandidates = classifyAddressLookupResult("宜蘭縣五結鄉協和村親河路二段 1 號", [
      { parcel_id: "0001-0000", address: "A", lot_number: "0001", building_number: "" },
      { parcel_id: "0001-0001", address: "A", lot_number: "0001", building_number: "0001" },
    ]);

    expect(multipleCandidates.status).toBe("manual_required");
    expect(multipleCandidates.summary).toContain("多筆候選");
  });

  it("maps internal MOI labels to customer-facing Traditional Chinese labels", () => {
    expect(getCustomerServiceLabel("MOI_API_005")).toBe("建物所有權資料");
    expect(getCustomerServiceLabel("MOI_API_037")).toBe("門牌建號查詢");
    expect(getCustomerServiceLabel("MOI_API_009")).toBe("所有權人比對服務");
  });

  it("keeps frontstage copy free of engineering labels while preserving audit rows", () => {
    const rows = getUsageLedgerRows();
    const customerText = rows.map((row) => `${row.serviceName}${row.outcomeLabel}${row.amountLabel}`).join(" ");

    expect(isFrontstageTextClean(customerText)).toBe(true);
    for (const pattern of FRONTSTAGE_FORBIDDEN_PATTERNS) {
      expect(customerText).not.toMatch(pattern);
    }

    expect(rows.some((row) => row.admin.serviceCode === "MOI_API_005")).toBe(true);
  });
});
