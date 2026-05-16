import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { PdfDocument, type CaseDossierData } from "../document";

vi.mock("@react-pdf/renderer", () => ({
  Document: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pdf-document">{children}</div>
  ),
  Page: ({ children }: { children: React.ReactNode }) => (
    <section data-testid="pdf-page">{children}</section>
  ),
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Image: () => <img alt="pdf-image" />,
}));

const baseLandData: CaseDossierData = {
  caseNo: "AIRE-2026-LAND-001",
  address: "新北市板橋區文化路一段 188 號",
  propertyType: "land",
  landLotNo: "板橋段二小段 88-1",
  ownerName: "林大華",
  companyName: "測試不動產",
  generatedAt: "2026/05/16",
  legalClauses: ["法規條文 A", "法規條文 B"],
};

const baseBuildingData: CaseDossierData = {
  caseNo: "AIRE-2026-BUILD-001",
  address: "台北市大安區和平東路一段 100 號",
  propertyType: "building",
  landLotNo: "",
  ownerName: "陳小美",
  companyName: "測試不動產",
  generatedAt: "2026/05/16",
  legalClauses: ["法規條文 A", "法規條文 B"],
};

describe("CaseDossierData extended fields", () => {
  it("accepts new Section 3~7 optional fields without type errors", () => {
    const data: CaseDossierData = {
      ...baseLandData,
      restrictionRegistration: "禁止處分",
      trustRegistration: "無",
      cautionRegistration: "無",
      otherRightsDetail: "無其他登記事項",
      currentRentalStatus: "出租中，月租 NT$25,000",
      currentOccupation: "自用",
      sharedManagement: "依分管協議",
      existingRoad: "臨 8 米道路",
      otherUsageStatus: "現況空地",
      urbanPlanZone: "住宅區",
      nonUrbanLandCategory: "非都市土地甲種建築用地",
      floorAreaRatio: "225%",
      buildingCoverageRatio: "60%",
      specialDesignatedArea: "無",
      transactionTotalPrice: "NT$ 38,000,000",
      paymentMethod: "簽約 10%、過戶 90%",
      taxBurdenAgreement: "依約分擔",
      penaltyClause: "逾期每日千分之一",
      environmentalImpact: "無已知污染",
      majorIncident: "無重大事故",
      nearbyPublicFacilities: "捷運站 500m",
      surroundingTransactionPrice: "近期約 NT$ 48 萬/坪",
    };

    expect(data.restrictionRegistration).toBe("禁止處分");
    expect(data.surroundingTransactionPrice).toBe("近期約 NT$ 48 萬/坪");
  });
});

describe("PdfDocument land government format", () => {
  it("renders 10 pages and includes section titles 1~7 plus signature page", () => {
    render(<PdfDocument data={baseLandData} themeId="theme-a-minimal" />);

    expect(screen.getAllByTestId("pdf-page")).toHaveLength(10);
    expect(screen.getByText("一、標示及權利範圍")).toBeInTheDocument();
    expect(screen.getByText("二、所有權人及其基本資料")).toBeInTheDocument();
    expect(screen.getByText("三、權利種類及登記狀態")).toBeInTheDocument();
    expect(screen.getByText("四、目前管理與使用情況")).toBeInTheDocument();
    expect(screen.getByText("五、使用管制內容")).toBeInTheDocument();
    expect(screen.getByText("六、重要交易條件")).toBeInTheDocument();
    expect(screen.getByText("七、其他重要事項")).toBeInTheDocument();
    expect(screen.getByText("簽章欄")).toBeInTheDocument();
  });

  it("shows mortgage detail and fallback zoning values", () => {
    render(
      <PdfDocument
        data={{
          ...baseLandData,
          mortgages: [{ creditor: "台灣銀行", amount: 5000000 }],
          zoningType: "住宅區",
          usageCategory: "乙種住宅用地",
        }}
        themeId="theme-a-minimal"
      />,
    );

    expect(screen.getByText("台灣銀行 / NT$ 5,000,000")).toBeInTheDocument();
    expect(screen.getAllByText("住宅區").length).toBeGreaterThan(0);
    expect(screen.getAllByText("乙種住宅用地").length).toBeGreaterThan(0);
  });

  it("renders signature block with four columns and date lines", () => {
    render(<PdfDocument data={baseLandData} themeId="theme-a-minimal" />);

    expect(screen.getAllByText("不動產經紀業").length).toBeGreaterThan(0);
    expect(screen.getAllByText("經紀人").length).toBeGreaterThan(0);
    expect(screen.getAllByText("買方").length).toBeGreaterThan(0);
    expect(screen.getAllByText("賣方").length).toBeGreaterThan(0);
    expect(screen.getAllByText("日期：＿＿年＿＿月＿＿日")).toHaveLength(4);
  });

  it("shows pending placeholders for empty values", () => {
    render(<PdfDocument data={baseLandData} themeId="theme-a-minimal" />);
    expect(screen.getAllByText("待補").length).toBeGreaterThan(0);
  });
});

describe("PdfDocument building pages unchanged", () => {
  it("keeps building version at 7 pages", () => {
    render(<PdfDocument data={baseBuildingData} themeId="theme-a-minimal" />);
    expect(screen.getAllByTestId("pdf-page")).toHaveLength(7);
    expect(screen.queryByText("簽章欄")).toBeNull();
  });
});
