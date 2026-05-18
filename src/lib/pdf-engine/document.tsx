import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { ThemeProvider } from "@/lib/pdf-themes/theme-provider";
import { getTheme } from "@/lib/pdf-themes/registry";

import {
  getThemePdfTokens,
  PdfCover,
  PdfPageHeader,
  PdfPageFooter,
  PdfSection,
  PdfFieldTable,
  PdfSignatureBlock,
} from "./react-pdf-components";

import { PropertyDataSheetPage } from "../pdf-blocks/property-data-sheet";
import { TransactionHistoryPage } from "@/lib/pdf-blocks/transaction-history-page";
import { LifeAmenitiesPage } from "@/lib/pdf-blocks/life-amenities";
import { TaxFeeOverviewPage, LandValueTaxPage } from "@/lib/pdf-blocks/tax-fee-page";
import { SignatureBlock } from "@/lib/pdf-blocks/signature-block";
import { LandConditionSurveyPages } from "@/lib/pdf-blocks/land-condition-survey";
import { BuildingConditionSurveyPages } from "@/lib/pdf-blocks/building-condition-survey";
import { LocationMapPage } from "@/lib/pdf-blocks/location-map";
import { AerialPhotoPage } from "@/lib/pdf-blocks/aerial-photo-page";
import { ExteriorPhotoPage } from "@/lib/pdf-blocks/exterior-photo-page";

// ─────────────────────────────────────────────────────────────────────────────
// CaseDossierData
// ─────────────────────────────────────────────────────────────────────────────

export interface CaseDossierData {
  // 現有欄位（不變）
  caseNo: string;
  address: string;
  propertyType: "land" | "building";
  landLotNo: string;
  ownerName: string;
  companyName: string;
  generatedAt: string;
  logoBytes?: number[];
  logo?: string;

  // 地政 API 資料（皆為 optional）
  landArea?: number;
  landPurpose?: string;
  zoningType?: string;
  usageCategory?: string;
  soilConservation?: string;
  buildingLineNote?: string;
  announcedLandValue?: number;
  assessedLandValue?: number;
  mortgages?: Array<{ creditor: string; amount: number }>;
  restrictionRegistration?: string;
  trustRegistration?: string;
  cautionRegistration?: string;
  otherRightsDetail?: string;
  currentRentalStatus?: string;
  currentOccupation?: string;
  sharedManagement?: string;
  existingRoad?: string;
  otherUsageStatus?: string;
  urbanPlanZone?: string;
  nonUrbanLandCategory?: string;
  floorAreaRatio?: string;
  buildingCoverageRatio?: string;
  specialDesignatedArea?: string;
  transactionTotalPrice?: string;
  paymentMethod?: string;
  taxBurdenAgreement?: string;
  penaltyClause?: string;
  environmentalImpact?: string;
  majorIncident?: string;
  nearbyPublicFacilities?: string;
  surroundingTransactionPrice?: string;

  // 建物版欄位
  buildingArea?: number;
  buildingPurpose?: string;
  constructionDate?: string;
  buildingCertificateNo?: string;
  buildingOwnershipDate?: string;

  // 共用
  recentSalePricePerSqm?: number;
  recentSaleCount?: number;
  legalClauses?: string[];

  // ─── 封面完整欄位 ───
  cover?: {
    propertyName: string;
    caseNumber: string;
    handlingAgent: string;
    licensedAgentName: string;
    licensedAgentCertNo: string;
    brokerageCompanyName: string;
    brokerageLicenseNo: string;
    companyAddress: string;
    companyPhone: string;
  };

  // ─── 物件資料表 ───
  propertySheet?: {
    askingPrice: number;
    landSection: string;
    landNumber: string;
    zoning: string;
    landArea: number;
    ownershipRatio: string;
    shareArea: number;
    buildingCoverage: string;
    floorAreaRatio: string;
    owner: string;
    acquisitionDate: string;
    registeredArea?: number;
    mainBuildingArea?: number;
    auxiliaryArea?: number;
    commonArea?: number;
    parkingArea?: number;
    floor?: string;
    rooms?: string;
    direction?: string;
    managementFee?: number;
    hasElevator?: boolean;
    constructionCompany?: string;
    communityName?: string;
  };

  // ─── 建物面積分欄 ───
  buildingAreaBreakdown?: {
    main: number;
    auxiliary: number;
    common: number;
    parking: number;
  };

  // ─── 後續 Wave 用，先定義型別 ───
  transactionHistory?: Array<{
    address: string;
    areaPing: number;
    totalPrice: number;
    unitPrice: number;
    transactionDate: string;
  }>;
  nearbyAmenities?: Array<{
    name: string;
    category: string;
    distanceM: number;
    address: string;
  }>;
  taxCalculation?: {
    landValueIncrementTax: number;
    landValueIncrementTaxPreferential: number;
    deedTax: number;
    stampTax: number;
    registrationFee: number;
    scrivenerFee: number;
    totalSellerCost: number;
    totalBuyerCost: number;
    warnings: string[];
  } | null;
  surveyData?: Record<string, boolean | null> | null;
  exteriorPhoto?: Uint8Array | null;
  aerialPhoto?: Uint8Array | null;
  locationMapImage?: Uint8Array | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 共用樣式
// ─────────────────────────────────────────────────────────────────────────────

function insertCjkBreaks(text: string): string {
  return text.replace(/([一-鿿㐀-䶿])/g, "​$1");
}

const PAGE_STYLE = {
  paddingTop: 36,
  paddingBottom: 48,
  paddingHorizontal: 40,
  fontFamily: "NotoSansTC",
  fontSize: 10,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 輔助：法規告知頁
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_LEGAL_CLAUSES = [
  "依不動產經紀業管理條例第二十三條規定，經紀人員在執行業務過程中，應以不動產說明書向與委託人交易之相對人解說。",
  "依不動產經紀業管理條例第二十四條規定，雙方當事人簽訂租賃或買賣契約書時，經紀人應將不動產說明書交付與委託人交易之相對人，並由相對人在不動產說明書上簽章。",
  "依不動產經紀業管理條例第二十四條之一規定，經紀業或經紀人員不得收取差價或其他報酬，其經營仲介業務者，並應依實際成交價金或租金按中央主管機關規定之報酬標準計收。",
  "本說明書內容如有不實，經紀業應負損害賠償責任。前項損害賠償責任，經紀業已盡相當之注意義務者，得減輕之。",
];

function LegalPage({
  tokens,
  header,
  footer,
  legalClauses,
}: {
  tokens: ReturnType<typeof getThemePdfTokens>;
  header: React.ReactElement;
  footer: React.ReactElement;
  legalClauses: string[];
}) {
  const clauses = legalClauses.length >= 4 ? legalClauses : DEFAULT_LEGAL_CLAUSES;
  return (
    <Page size="A4" style={PAGE_STYLE}>
      {header}
      <PdfSection tokens={tokens} title="一、法規告知">
        <View style={{ gap: 8, maxWidth: "100%" }}>
          {clauses.map((clause, i) => (
            <Text
              key={i}
              style={{ fontSize: 9, color: tokens.text, lineHeight: 1.6 }}
            >
              {insertCjkBreaks(`${i + 1}. ${clause}`)}
            </Text>
          ))}
        </View>
      </PdfSection>
      {footer}
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 輔助：成交行情頁
// ─────────────────────────────────────────────────────────────────────────────

function SalePage({
  tokens,
  header,
  footer,
  data,
}: {
  tokens: ReturnType<typeof getThemePdfTokens>;
  header: React.ReactElement;
  footer: React.ReactElement;
  data: CaseDossierData;
}) {
  return (
    <Page size="A4" style={PAGE_STYLE}>
      {header}
      <PdfSection tokens={tokens} title="六、成交行情╱周遭設施">
        <PdfFieldTable
          tokens={tokens}
          rows={[
            ["近期成交均價（元/㎡）", data.recentSalePricePerSqm?.toLocaleString("zh-TW") ?? ""],
            ["近期成交案件數（件）", data.recentSaleCount?.toString() ?? ""],
            ["最近公車站（m）", ""],
            ["最近捷運站（m）", ""],
            ["最近學校", ""],
            ["最近醫療機構", ""],
            ["周遭重大建設", ""],
          ]}
        />
      </PdfSection>
      {footer}
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 土地版 7 頁
// ─────────────────────────────────────────────────────────────────────────────

function LandPages({
  data,
  tokens,
}: {
  data: CaseDossierData;
  tokens: ReturnType<typeof getThemePdfTokens>;
}) {
  const totalPages = 10;
  const header = (pageNum: number) => (
    <PdfPageHeader tokens={tokens} caseNo={data.caseNo} pageNum={pageNum} totalPages={totalPages} />
  );
  const footer = <PdfPageFooter tokens={tokens} generatedAt={data.generatedAt} />;

  const sectionThreeMortgageDetail = data.mortgages && data.mortgages.length > 0
    ? data.mortgages
      .map((mortgage) => `${mortgage.creditor} / NT$ ${mortgage.amount.toLocaleString("zh-TW")}`)
      .join("；")
    : "";

  const urbanPlanZone = data.urbanPlanZone ?? data.zoningType ?? "";
  const nonUrbanLandCategory = data.nonUrbanLandCategory ?? data.usageCategory ?? "";
  // 優先從 transactionHistory 自動計算，fallback 到舊欄位
  const txHistory = data.transactionHistory ?? [];
  const hasTxHistory = txHistory.length > 0;

  const surroundingTransactionPriceDisplay = (() => {
    if (hasTxHistory) {
      const latest = txHistory[txHistory.length - 1];
      return `${latest.address}　NT$ ${latest.totalPrice.toLocaleString("zh-TW")}`;
    }
    return data.surroundingTransactionPrice ?? "";
  })();

  const recentSalePriceDisplay = (() => {
    if (hasTxHistory) {
      const avg = Math.round(
        txHistory.reduce((sum, tx) => sum + tx.unitPrice, 0) / txHistory.length
      );
      return `NT$ ${avg.toLocaleString("zh-TW")}/㎡`;
    }
    if (data.recentSalePricePerSqm) {
      return `NT$ ${data.recentSalePricePerSqm.toLocaleString("zh-TW")}/㎡`;
    }
    return "";
  })();

  const recentSaleCountDisplay = (() => {
    if (hasTxHistory) return `${txHistory.length} 筆`;
    if (data.recentSaleCount != null) return data.recentSaleCount.toString();
    return "";
  })();

  return (
    <>
      {/* 頁 1 — 封面 */}
      <Page size="A4" style={{ ...PAGE_STYLE, paddingTop: 0, paddingHorizontal: 0 }}>
        <PdfCover
          tokens={tokens}
          caseNo={data.caseNo}
          address={data.address}
          propertyType={data.propertyType}
          companyName={data.companyName}
          generatedAt={data.generatedAt}
          logoBytes={data.logoBytes}
          cover={data.cover}
        />
      </Page>

      {/* 頁 2 — 法規告知 */}
      <LegalPage
        tokens={tokens}
        header={header(2)}
        footer={footer}
        legalClauses={data.legalClauses ?? []}
      />

      {/* 物件資料表 */}
      <PropertyDataSheetPage propertyType="land" data={data} />

      {/* 頁 3 — 一、標示及權利範圍 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(3)}
        <PdfSection tokens={tokens} title="一、標示及權利範圍">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["地號", data.landLotNo],
              ["地目", data.landPurpose ?? ""],
              ["地積（㎡）", data.landArea?.toFixed(2) ?? ""],
              ["使用分區", data.zoningType ?? ""],
              ["使用地類別", data.usageCategory ?? ""],
              ["水土保持", data.soilConservation ?? ""],
              ["建築線指定", data.buildingLineNote ?? ""],
              ["權利範圍", ""],
              ["持分比例", ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 4 — 二、所有權人及其基本資料 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(4)}
        <PdfSection tokens={tokens} title="二、所有權人及其基本資料">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["所有權人", data.ownerName],
              ["持分比例", ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 5 — 三、權利種類及登記狀態 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(5)}
        <PdfSection tokens={tokens} title="三、權利種類及登記狀態">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["限制登記", data.restrictionRegistration ?? ""],
              ["他項權利明細", sectionThreeMortgageDetail],
              ["信託登記", data.trustRegistration ?? ""],
              ["預告登記", data.cautionRegistration ?? ""],
              ["其他權利登記事項", data.otherRightsDetail ?? ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 6 — 四、目前管理與使用情況 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(6)}
        <PdfSection tokens={tokens} title="四、目前管理與使用情況">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["出租情形", data.currentRentalStatus ?? ""],
              ["占用情形", data.currentOccupation ?? ""],
              ["共有物分管情形", data.sharedManagement ?? ""],
              ["既成道路", data.existingRoad ?? ""],
              ["其他使用情況", data.otherUsageStatus ?? ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 7 — 五、使用管制內容 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(7)}
        <PdfSection tokens={tokens} title="五、使用管制內容">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["都市計畫使用分區", urbanPlanZone],
              ["非都市土地使用分區及編定", nonUrbanLandCategory],
              ["容積率", data.floorAreaRatio ?? ""],
              ["建蔽率", data.buildingCoverageRatio ?? ""],
              ["特定目的事業用地", data.specialDesignatedArea ?? ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 8 — 六、重要交易條件 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(8)}
        <PdfSection tokens={tokens} title="六、重要交易條件">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["交易總價", data.transactionTotalPrice ?? ""],
              ["付款方式", data.paymentMethod ?? ""],
              ["稅費負擔約定", data.taxBurdenAgreement ?? ""],
              ["違約處理", data.penaltyClause ?? ""],
              ["公告現值", data.announcedLandValue ? String(data.announcedLandValue) : ""],
              ["評估地價", data.assessedLandValue ? String(data.assessedLandValue) : ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 9 — 七、其他重要事項 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(9)}
        <PdfSection tokens={tokens} title="七、其他重要事項">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["環境影響", data.environmentalImpact ?? ""],
              ["重大事故", data.majorIncident ?? ""],
              ["鄰近公共設施", data.nearbyPublicFacilities ?? ""],
              ["周遭成交行情", surroundingTransactionPriceDisplay],
              ["近期成交均價", recentSalePriceDisplay],
              ["近期成交案件數", recentSaleCountDisplay],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 費用一覽表 */}
      <TaxFeeOverviewPage taxCalculation={data.taxCalculation} propertyType="land" />
      {/* 土地增值稅概算表 */}
      <LandValueTaxPage taxCalculation={data.taxCalculation} propertyType="land" />
      {/* 土地版現況調查表（肆、35 題） */}
      <LandConditionSurveyPages surveyData={data.surveyData ?? null} />
      {/* 成交行情表 */}
      <TransactionHistoryPage data={data.transactionHistory ?? []} />
      {/* 生活機能 */}
      <LifeAmenitiesPage nearbyAmenities={data.nearbyAmenities} />
      {/* 位置圖 */}
      <LocationMapPage logo={data.logo} locationMapImage={data.locationMapImage ?? null} />
      {/* 航拍位置圖 */}
      <AerialPhotoPage logo={data.logo} aerialPhoto={data.aerialPhoto ?? null} />
      {/* 建物外觀 */}
      <ExteriorPhotoPage logo={data.logo} exteriorPhoto={data.exteriorPhoto ?? null} />
      {/* 簽章欄（只出現一次，在最後） */}
      <SignatureBlock />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 建物版 7 頁
// ─────────────────────────────────────────────────────────────────────────────

function BuildingPages({
  data,
  tokens,
}: {
  data: CaseDossierData;
  tokens: ReturnType<typeof getThemePdfTokens>;
}) {
  const totalPages = 7;
  const header = (pageNum: number) => (
    <PdfPageHeader tokens={tokens} caseNo={data.caseNo} pageNum={pageNum} totalPages={totalPages} />
  );
  const footer = <PdfPageFooter tokens={tokens} generatedAt={data.generatedAt} />;

  const firstMortgage = data.mortgages?.[0];
  const mortgageCreditor = firstMortgage?.creditor ?? "";
  const mortgageAmount = firstMortgage
    ? `NT$ ${firstMortgage.amount.toLocaleString("zh-TW")}`
    : "";

  return (
    <>
      {/* 頁 1 — 封面 */}
      <Page size="A4" style={{ ...PAGE_STYLE, paddingTop: 0, paddingHorizontal: 0 }}>
        <PdfCover
          tokens={tokens}
          caseNo={data.caseNo}
          address={data.address}
          propertyType={data.propertyType}
          companyName={data.companyName}
          generatedAt={data.generatedAt}
          logoBytes={data.logoBytes}
          cover={data.cover}
        />
      </Page>

      {/* 頁 2 — 法規告知 */}
      <LegalPage
        tokens={tokens}
        header={header(2)}
        footer={footer}
        legalClauses={data.legalClauses ?? []}
      />

      {/* 物件資料表 */}
      <PropertyDataSheetPage propertyType="building" data={data} />

      {/* 頁 3 — 建物標示 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(3)}
        <PdfSection tokens={tokens} title="二、產權調查表—建物標示">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["建物門牌", data.address],
              ["建物面積（㎡）", data.buildingArea?.toFixed(2) ?? ""],
              ["建物用途", data.buildingPurpose ?? ""],
              ["建造完成日期", data.constructionDate ?? ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 4 — 所有權/他項權利 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(4)}
        <PdfSection tokens={tokens} title="三、產權調查表—所有權及他項權利">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["所有權人", data.ownerName],
              ["權狀字號", data.buildingCertificateNo ?? ""],
              ["登記日期", data.buildingOwnershipDate ?? ""],
              ["他項權利種類", mortgageCreditor],
              ["擔保金額", mortgageAmount],
              ["存續期間", ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 5 — 建物現況調查（手填） */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(5)}
        <PdfSection tokens={tokens} title="四、建物現況調查">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["屋齡（年）", ""],
              ["樓層", ""],
              ["格局", ""],
              ["裝修狀況", ""],
              ["漏水滲水", ""],
              ["壁癌", ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 6 — 管理組織 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(6)}
        <PdfSection tokens={tokens} title="五、管理組織">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["管理委員會", ""],
              ["管理費（元/月）", ""],
              ["停車位", ""],
              ["備註", "請洽管理委員會確認"],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 費用一覽表 */}
      <TaxFeeOverviewPage taxCalculation={data.taxCalculation} propertyType="building" />
      {/* 土地增值稅概算表 */}
      <LandValueTaxPage taxCalculation={data.taxCalculation} propertyType="building" />
      {/* 成屋版現況調查表（58 題） */}
      <BuildingConditionSurveyPages surveyData={data.surveyData ?? null} />
      {/* 成交行情表 */}
      <TransactionHistoryPage data={data.transactionHistory ?? []} />
      {/* 生活機能 */}
      <LifeAmenitiesPage nearbyAmenities={data.nearbyAmenities} />
      {/* 位置圖 */}
      <LocationMapPage logo={data.logo} locationMapImage={data.locationMapImage ?? null} />
      {/* 航拍位置圖 */}
      <AerialPhotoPage logo={data.logo} aerialPhoto={data.aerialPhoto ?? null} />
      {/* 建物外觀 */}
      <ExteriorPhotoPage logo={data.logo} exteriorPhoto={data.exteriorPhoto ?? null} />
      {/* 簽章欄（只出現一次，在最後） */}
      <SignatureBlock />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PdfDocument
// ─────────────────────────────────────────────────────────────────────────────

export function PdfDocument({
  data,
  themeId,
}: {
  data: CaseDossierData;
  themeId: string;
}): React.ReactElement {
  const tokens = getThemePdfTokens(themeId);
  const theme = getTheme(themeId) ?? getTheme("theme-a-minimal")!;

  return (
    <ThemeProvider theme={theme}>
      <Document>
        {data.propertyType === "building" ? (
          <BuildingPages data={data} tokens={tokens} />
        ) : (
          <LandPages data={data} tokens={tokens} />
        )}
      </Document>
    </ThemeProvider>
  );
}
