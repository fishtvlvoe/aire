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
  caseNo: string;
  address: string;
  propertyType: "land" | "building";
  landLotNo: string;
  ownerName: string;
  companyName: string;
  generatedAt: string;
  logoBytes?: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 固定法規告知條文（v3）
// ─────────────────────────────────────────────────────────────────────────────

const LEGAL_CLAUSES = [
  "依不動產經紀業管理條例第 23 條規定，不動產經紀人員應依本說明書說明標的物狀況。",
  "依消費者保護法第 11 條規定，企業經營者應確保其提供之商品或服務符合安全衛生之標準。",
  "依公平交易法第 21 條規定，事業不得在商品或廣告上，或以其他使公眾得知之方法，對於商品為虛偽不實或引人錯誤之表示、陳述或保證。",
  "本說明書所載資料以簽約當日前最新調查資料為準，後續如有變動依實際狀況為準。",
  "買賣雙方應自行確認本說明書所載各項資料，如有疑義應向主管機關或專業人士諮詢。",
];

const BUILDING_PLACEHOLDER = "建物版說明書（建置中）";

const PAGE_STYLE = {
  paddingTop: 36,
  paddingBottom: 48,
  paddingHorizontal: 40,
  fontFamily: "NotoSansTC",
  fontSize: 10,
} as const;

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

  if (data.propertyType === "building") {
    return (
      <Document>
        <Page size="A4" style={PAGE_STYLE}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: tokens.textMuted }}>
              {BUILDING_PLACEHOLDER}
            </Text>
            <Text style={{ fontSize: 10, color: tokens.textMuted, marginTop: 8 }}>
              本 App 版本 v0.x 僅支援土地版
            </Text>
          </View>
        </Page>
      </Document>
    );
  }

  // ── 土地版 7 頁 ──────────────────────────────────────────────────────────
  const totalPages = 7;
  const header = (pageNum: number) => (
    <PdfPageHeader tokens={tokens} caseNo={data.caseNo} pageNum={pageNum} totalPages={totalPages} />
  );
  const footer = <PdfPageFooter tokens={tokens} generatedAt={data.generatedAt} />;

  return (
    <Document>
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
      <Page size="A4" style={PAGE_STYLE}>
        {header(2)}
        <PdfSection tokens={tokens} title="一、法規告知">
          <View style={{ gap: 6 }}>
            {LEGAL_CLAUSES.map((clause, i) => (
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

      {/* 頁 3 — 產權調查表：土地標示 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(3)}
        <PdfSection tokens={tokens} title="二、產權調查表—土地標示">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["地號", data.landLotNo],
              ["地目", ""],
              ["地積（㎡）", ""],
              ["使用分區", ""],
              ["地上權登記", ""],
              ["地籍圖謄本", ""],
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
              ["他項權利種類", ""],
              ["他項權利人", ""],
              ["擔保金額", ""],
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
              ["建築線指定", ""],
              ["水土保持", ""],
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
              ["地價稅（元/年）", ""],
              ["契稅（元）", ""],
              ["印花稅（元）", ""],
              ["代書費（元）", ""],
              ["登記規費（元）", ""],
            ]}
          />
        </PdfSection>
        {footer}
      </Page>

      {/* 頁 7 — 成交行情/周遭設施 */}
      <Page size="A4" style={PAGE_STYLE}>
        {header(7)}
        <PdfSection tokens={tokens} title="六、成交行情╱周遭設施">
          <PdfFieldTable
            tokens={tokens}
            rows={[
              ["近期成交均價（元/㎡）", ""],
              ["近期成交案件數（件）", ""],
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
    </Document>
  );
}
