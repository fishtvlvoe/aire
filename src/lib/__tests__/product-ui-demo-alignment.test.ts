import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  FRONTSTAGE_FORBIDDEN_PATTERNS,
  getAddressFirstClassification,
  classifyAddressLookupResult,
  getCustomerPropertyTypeOptions,
  getCustomerServiceLabel,
  getDemoFieldReviewRows,
  getDemoSidebarFolders,
  getEntitlementFeatures,
  getSettingsCategories,
  getUpgradePlans,
  getUsageLedgerRows,
  inferPropertyTypeFromRegistryFields,
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
      "系統設定",
    ]);
    expect(getDemoSidebarFolders()[0].items.map((item) => item.label)).toEqual([
      "案件總覽",
      "新增案件",
      "物件審核",
      "補件清單",
    ]);
    expect(getDemoSidebarFolders()[1].items.map((item) => item.label)).toEqual([
      "資料來源",
      "費用紀錄",
      "地政授權",
    ]);
    expect(getSettingsCategories().map((category) => category.label)).toEqual([
      "品牌設定",
      "操作日誌",
      "方案設定",
    ]);
    expect(getDemoSidebarFolders()[2].items.map((item) => item.label)).toEqual([
      "品牌設定",
      "操作日誌",
      "方案設定",
    ]);
  });

  it("defines three customer-facing upgrade plans without engineering labels", () => {
    const plans = getUpgradePlans();
    expect(plans.map((plan) => plan.name)).toEqual(["基本款", "進階款", "高級款"]);
    expect(plans[0].current).toBe(true);
    expect(plans.map((plan) => plan.features.join(" ")).join(" ")).toContain("實價登錄");
    expect(plans.map((plan) => plan.features.join(" ")).join(" ")).not.toContain("MCP Hub");
  });

  it("defines development feature switches as off by default", () => {
    const features = getEntitlementFeatures();

    expect(features.map((feature) => feature.label)).toEqual([
      "Google 地圖",
      "空拍圖",
      "街景參考",
      "AI 格局圖整理",
      "地籍圖整理",
      "實價登錄",
    ]);
    expect(features.every((feature) => feature.description === "未啟用")).toBe(true);
    expect(features.map((feature) => feature.ariaLabel)).toEqual([
      "Google 地圖未啟用",
      "空拍圖未啟用",
      "街景參考未啟用",
      "AI 格局圖整理未啟用",
      "地籍圖整理未啟用",
      "實價登錄未啟用",
    ]);
    expect(features.every((feature) => feature.enabled === false)).toBe(true);
    expect(features.map((feature) => feature.description).join(" ")).not.toContain("測試版已開啟");
    expect(features.map((feature) => feature.description).join(" ")).not.toContain("正式版歸在");
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

    const normalBuilding = getAddressFirstClassification("台南市永康區勝利街58巷4號1樓");
    expect(normalBuilding.displayType).toBe("建物");
    expect(normalBuilding.displayType).not.toBe("農地");
    expect(normalBuilding.displayType).not.toBe("農舍");

    const land = getAddressFirstClassification("台南市永康區勝利段 123 地號");
    expect(land.displayType).toBe("土地");
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
    expect(multipleCandidates.landCount).toBe(1);
    expect(multipleCandidates.buildingCount).toBe(1);
  });

  it("exposes customer-facing property type options while keeping legacy values loadable", () => {
    const options = getCustomerPropertyTypeOptions();

    expect(options.map((option) => option.label)).toEqual(
      expect.arrayContaining(["大樓", "公寓", "透天", "成屋", "農舍", "土地", "農地", "店面", "工廠", "其他"]),
    );
    expect(options.map((option) => option.value)).toEqual(
      expect.arrayContaining(["highrise", "apartment", "townhouse", "residential", "farmhouse", "land", "farmland", "storefront", "factory", "other"]),
    );
  });

  it.each([
    ["大樓正式資料", { hasBuilding: true, totalFloorCount: 15, mainUse: "住家用" }, "highrise"],
    ["公寓正式資料", { hasBuilding: true, totalFloorCount: 5, mainUse: "集合住宅" }, "apartment"],
    ["透天正式資料", { hasBuilding: true, totalFloorCount: 3, mainUse: "住家用" }, "townhouse"],
    ["店面正式資料", { hasBuilding: true, mainUse: "店舖" }, "storefront"],
    ["工廠正式資料", { hasBuilding: true, mainUse: "廠房" }, "factory"],
    ["農地正式資料", { hasBuilding: false, zoning: "特定農業區", landUse: "農牧用地" }, "farmland"],
    ["商業用地正式資料", { hasBuilding: false, zoning: "商業區" }, "commercial-land"],
  ])("infers %s into detailed property type", (_label, input, expected) => {
    expect(inferPropertyTypeFromRegistryFields(input)).toBe(expected);
  });

  it("does not classify a floor address as land-only when discovery only finds land", () => {
    const classified = classifyAddressLookupResult("台南市東區東和路47號3樓", [
      {
        parcel_id: "DC-1514-00022132",
        address: "臺南市東區小東里３鄰東和路４７號",
        lot_number: "00022132",
        building_number: "",
      },
    ]);

    expect(classified.status).toBe("manual_required");
    expect(classified.propertyType).toBe("residential");
    expect(classified.displayType).toBe("建物需確認");
    expect(classified.summary).toBe("已找到 1 筆土地，建號需人工確認");
    expect(classified.landCount).toBe(1);
    expect(classified.buildingCount).toBe(1);
  });

  it("counts Yunong candidate land and buildings separately", () => {
    const classified = classifyAddressLookupResult("台南市東區裕農路288巷17號8樓之1", [
      { parcel_id: "DC-1556-00700000", address: "A", lot_number: "00700000", building_number: "" },
      { parcel_id: "DC-1556-00165000", address: "A", lot_number: "00700000", building_number: "00165000" },
      { parcel_id: "DC-1556-00167000", address: "A", lot_number: "00700000", building_number: "00167000" },
      { parcel_id: "DC-1556-00229000", address: "A", lot_number: "00700000", building_number: "00229000" },
      { parcel_id: "DC-1556-00230000", address: "A", lot_number: "00700000", building_number: "00230000" },
    ]);

    expect(classified.status).toBe("manual_required");
    expect(classified.landCount).toBe(1);
    expect(classified.buildingCount).toBe(4);
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

    expect(rows.some((row) => row.admin.serviceCode === "R02_FREE_DISCOVERY")).toBe(true);
    expect(rows.some((row) => row.serviceName === "地政謄本匯入" && row.outcomeLabel === "尚未匯入")).toBe(true);
  });

  it("maps provenance candidate and failed lookup states into customer-facing field review rows", () => {
    const rows = getDemoFieldReviewRows({
      id: "yunong-case",
      case_no: "AIRE-YUNONG",
      case_name: "裕農路物調",
      property_type: "residential",
      land_lot_no: "裕農段候選地號",
      land_lots: ["裕農段候選地號"],
      building_lot_no: "00165000",
      address: "台南市東區裕農路288巷17號8樓之1",
      owner_name: null,
      status: "draft",
      created_at: 1763200000,
      updated_at: 1763200000,
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-22T00:00:00.000Z",
        entries: {
          building_registry: {
            apiId: "building_registry",
            source: "public_candidate",
            status: "candidate",
            trustedForPdf: false,
            data: {
              building_number: "00165000",
              construction_date: "083/10/18",
            },
          },
          building_ownership: {
            apiId: "building_ownership",
            source: "moi_api",
            status: "failed",
            trustedForPdf: false,
            error: "授權不足，請補授權或改由屋主提供謄本",
          },
        },
      },
    });

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "登記日期",
          value: "民國083年10月18日",
          statusLabel: "候選資料",
          serviceName: "公開物件資料",
        }),
        expect.objectContaining({
          fieldName: "建物權利範圍",
          value: "授權不足，請補授權或改由屋主提供謄本",
          statusLabel: "查詢未成功",
          serviceName: "建物所有權資料",
        }),
        expect.objectContaining({
          fieldName: "門牌查詢建號",
          value: "已找到建號 00165000",
          statusLabel: "候選資料",
          serviceName: "免費物件查詢",
        }),
      ]),
    );
    expect(isFrontstageTextClean(rows.map((row) => `${row.serviceName}${row.statusLabel}${row.value}`).join(" "))).toBe(true);
  });

  it("does not keep demo registry values when provenance only has address candidates", () => {
    const rows = getDemoFieldReviewRows({
      id: "yunong-case",
      case_no: "AIRE-YUNONG",
      case_name: "裕農路物調",
      property_type: "residential",
      land_lot_no: "0001",
      land_lots: ["0001"],
      address: "台南市東區裕農路288巷17號8樓之1",
      owner_name: null,
      status: "draft",
      created_at: 1763200000,
      updated_at: 1763200000,
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-22T00:00:00.000Z",
        entries: {
          building_registry: {
            apiId: "building_registry",
            source: "public_candidate",
            status: "candidate",
            trustedForPdf: false,
            data: {
              building_number: "0001",
              lot_number: "0001",
            },
          },
          building_ownership: {
            apiId: "building_ownership",
            source: "moi_api",
            status: "failed",
            trustedForPdf: false,
            error: "尚未取得正式建物所有權資料，請補謄本或屋主授權後確認權利範圍",
          },
        },
      },
    });

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "登記日期",
          value: "待確認",
          statusLabel: "待確認",
          serviceName: "公開物件資料",
        }),
        expect.objectContaining({
          fieldName: "門牌查詢建號",
          value: "已找到建號 0001",
          statusLabel: "候選資料",
          serviceName: "免費物件查詢",
        }),
      ]),
    );
    expect(rows.map((row) => row.value)).not.toContain("113/08/12");
  });

  it("surfaces owner and zero-cost candidate values without exposing provider names", () => {
    const rows = getDemoFieldReviewRows({
      id: "donghe-case",
      case_no: "002",
      case_name: "東和路",
      property_type: "residential",
      land_lot_no: "00084000",
      land_lots: ["00084000"],
      building_lot_no: "00084000",
      address: "台南市東區東和路47號3樓",
      owner_name: "蔡國卿",
      status: "draft",
      created_at: 1763200000,
      updated_at: 1763200000,
      land_registry_data: {
        schema: "aire.registry-provenance.v1",
        generatedAt: "2026-05-26T00:00:00.000Z",
        entries: {},
        candidate_options: [
          {
            candidate_id: "building:DK-9125-00084000",
            parcel_type: "building",
            section_code: "9125",
            section_name: "東和段",
            parcel_number: "00084000",
            normalized_parcel_id: "DK-9125-00084000",
            source: "public_reference",
            confidence_label: "same_address_candidate",
            official_status: "candidate_unconfirmed",
            query_status: "candidate_data_available",
            summary_fields: {
              registeredAreaPing: 38.78,
              legalUse: "住商用",
              constructionDate: "0710804",
              floor: "三層",
              age: "44年",
            },
            warnings: [],
          },
        ],
      },
    });

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "屋主姓名",
          value: "蔡國卿",
          serviceName: "案件資料",
          statusLabel: "已提供",
        }),
        expect.objectContaining({
          fieldName: "姓名比對結果",
          value: "待正式所有權資料後再比對",
          statusLabel: "待匯入",
        }),
        expect.objectContaining({
          fieldName: "建物面積",
          value: "38.78 坪",
          helper: "建物面積",
          serviceName: "公開物件資料",
        }),
        expect.objectContaining({
          fieldName: "主要用途",
          value: "住商用",
          helper: "主要用途",
          serviceName: "公開物件資料",
        }),
        expect.objectContaining({
          fieldName: "登記日期",
          value: "民國071年08月04日",
          serviceName: "公開物件資料",
        }),
      ]),
    );
    expect(rows.map((row) => `${row.helper}${row.serviceName}`).join(" ")).not.toMatch(/R02|便民系統/);
  });
});
