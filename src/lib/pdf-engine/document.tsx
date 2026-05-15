import React from "react";
import { Document, Page, Text } from "@react-pdf/renderer";

import type { PdfTheme } from "../pdf-themes/types";
import { ThemeProvider } from "../pdf-themes/theme-provider";
import { LegalNoticeBlock, type LegalClauseData } from "../pdf-blocks/legal-notice";
import { initReactPdfEngine } from "./react-pdf-init";

export interface CaseData {
  caseId: string;
  caseType: "residential" | "land";
  propertyName: string;
  dynamicSections?: string[];
  // ...其他欄位（Stage 3+ 再補齊）
}

export function PdfDocument(_props: {
  caseData: CaseData;
  theme: PdfTheme;
  logo: Uint8Array | null;
  legalClauses?: LegalClauseData[];
}): React.ReactElement {
  initReactPdfEngine();
  const legalClauses = Array.isArray(_props.legalClauses) ? _props.legalClauses : [];
  const dynamicSections = Array.isArray(_props.caseData.dynamicSections)
    ? _props.caseData.dynamicSections
    : [];
  const pageStyle = { padding: 24, fontFamily: "NotoSansTC", fontSize: 12 } as const;

  return (
    <ThemeProvider theme={_props.theme}>
      <Document>
        <Page size="A4" style={pageStyle}>
          <Text>封面頁（Page 1）</Text>
        </Page>
        <Page size="A4" style={pageStyle}>
          <Text>基本資訊（Page 2）</Text>
        </Page>
        <Page size="A4" style={pageStyle}>
          <Text>位置圖（Page 3）</Text>
        </Page>
        <LegalNoticeBlock clauses={legalClauses} theme={_props.theme.id} />
        {dynamicSections.map((sectionTitle, index) => (
          <Page key={`dynamic-${index}`} size="A4" style={pageStyle}>
            <Text>{sectionTitle}</Text>
          </Page>
        ))}
      </Document>
    </ThemeProvider>
  );
}
