import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";

import {
  getThemePdfTokens,
  PdfCover,
  PdfPageHeader,
  PdfPageFooter,
  PdfSection,
  PdfFieldTable,
} from "./react-pdf-components";

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
}

// ─────────────────────────────────────────────────────────────────────────────
// 共用樣式
// ─────────────────────────────────────────────────────────────────────────────

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
  return (
    <Page size="A4" style={PAGE_STYLE}>
      {header}
      <PdfSection tokens={tokens} title="一、法規告知">
        <View style={{ gap: 6 }}>
          {legalClauses.map((clause, i) => (
            <Text
              key={i}
              style={{ fontSize: 9, color: tokens.text, lineHeight: 1.6 }}
            >
              {i + 1}. {clause}
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
        />
      </Page>

      {/* 頁 2 — 法規告知 */}
      <LegalPage
        tokens={tokens}
        header={header(2)}
        footer={footer}
        legalClauses={data.legalClauses ?? []}
      />

      {/* 頁 3 — 產權調查表：土地標示 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(3)}
        <PdfSection tokens={tokens} title="二、產權調查表—土地標示">
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
              ["地上權登記", ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 4 — 產權調查表：權利/他項權利 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(4)}
        <PdfSection tokens={tokens} title="三、產權調查表—所有權及他項權利">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["所有權人", data.ownerName],
              ["持分比例", ""],
              ["他項權利種類", mortgageCreditor],
              ["他項權利人", ""],
              ["擔保金額", mortgageAmount],
              ["存續期間", ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 5 — 基地/土地現況調查 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(5)}
        <PdfSection tokens={tokens} title="四、基地╱土地現況調查">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["臨路狀況", ""],
              ["道路寬度（m）", ""],
              ["地勢高低", ""],
              ["排水設施", ""],
              ["土地使用管制", ""],
              ["特定目的事業用地", ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 6 — 稅費/規費 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(6)}
        <PdfSection tokens={tokens} title="五、稅費╱規費">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["土地增值稅（元）", ""],
              ["公告現值（元/㎡）", data.announcedLandValue ? String(data.announcedLandValue) : ""],
              ["評估地價（元/㎡）", data.assessedLandValue ? String(data.assessedLandValue) : ""],
              ["地價稅（元/年）", ""],
              ["代書費（元）", ""],
              ["登記規費（元）", ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 7 — 成交行情/周遭設施 */}
      <SalePage tokens={tokens} header={header(7)} footer={footer} data={data} />
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
        />
      </Page>

      {/* 頁 2 — 法規告知 */}
      <LegalPage
        tokens={tokens}
        header={header(2)}
        footer={footer}
        legalClauses={data.legalClauses ?? []}
      />

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
              ["備注", "請洽管理委員會確認"],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 7 — 成交行情 */}
      <SalePage tokens={tokens} header={header(7)} footer={footer} data={data} />
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

  return (
    <Document>
      {data.propertyType === "building" ? (
        <BuildingPages data={data} tokens={tokens} />
      ) : (
        <LandPages data={data} tokens={tokens} />
      )}
    </Document>
  );
}
