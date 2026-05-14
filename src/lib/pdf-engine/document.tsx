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

  return (
    <ThemeProvider theme={_props.theme}>
      <Document>
        <Page size="A4" style={{ padding: 24, fontFamily: "NotoSansTC", fontSize: 12 }}>
          <Text>封面頁（Page 1）</Text>
        </Page>
        <Page size="A4" style={{ padding: 24, fontFamily: "NotoSansTC", fontSize: 12 }}>
          <Text>基本資訊（Page 2）</Text>
        </Page>
        <Page size="A4" style={{ padding: 24, fontFamily: "NotoSansTC", fontSize: 12 }}>
          <Text>區域與生活機能（Page 3）</Text>
        </Page>
        <Page size="A4" style={{ padding: 24, fontFamily: "NotoSansTC", fontSize: 12 }}>
          <Text>現況調查（Page 4）</Text>
        </Page>
        <LegalNoticeBlock clauses={legalClauses} theme={_props.theme.id} />
      </Document>
    </ThemeProvider>
  );
}
