import React from "react";
import { Document, Page, Text } from "@react-pdf/renderer";

import type { PdfTheme } from "../pdf-themes/types";
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
}): React.ReactElement {
  initReactPdfEngine();

  return (
    <Document>
      <Page size="A4" style={{ padding: 24, fontFamily: "NotoSansTC", fontSize: 12 }}>
        <Text>placeholder</Text>
      </Page>
    </Document>
  );
}
