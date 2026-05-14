import React from "react";
import { pdf } from "@react-pdf/renderer";

import type { LegalClauseData } from "../pdf-blocks/legal-notice";
import type { PdfTheme } from "../pdf-themes/types";
import { PdfDocument, type CaseData } from "./document";
import { initReactPdfEngine } from "./react-pdf-init";

export { PdfRenderError, PdfRenderErrorCode } from "./engine";
export type { CaseData };

export async function renderDisclosurePdf(
  caseData: CaseData,
  theme: PdfTheme,
  logo: Uint8Array | null,
): Promise<Blob> {
  initReactPdfEngine();

  if (!caseData.caseId) {
    const { PdfRenderError, PdfRenderErrorCode } = await import("./engine");
    throw new PdfRenderError(
      PdfRenderErrorCode.EngineFailure,
      new Error("missing required field: caseId"),
    );
  }
  if (!caseData.caseType) {
    const { PdfRenderError, PdfRenderErrorCode } = await import("./engine");
    throw new PdfRenderError(
      PdfRenderErrorCode.EngineFailure,
      new Error("missing required field: caseType"),
    );
  }
  if (!caseData.propertyName) {
    const { PdfRenderError, PdfRenderErrorCode } = await import("./engine");
    throw new PdfRenderError(
      PdfRenderErrorCode.EngineFailure,
      new Error("missing required field: propertyName"),
    );
  }

  let legalClauses: LegalClauseData[] = [];
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const clausePayload = await invoke("get_legal_clause");
    legalClauses = Array.isArray(clausePayload) ? (clausePayload as LegalClauseData[]) : [];
  } catch (e) {
    console.warn("[pdf-engine] get_legal_clause failed, falling back to empty clauses.", e);
  }

  try {
    const doc = React.createElement(PdfDocument, { caseData, theme, logo, legalClauses });
    return await pdf(doc).toBlob();
  } catch (e) {
    const { PdfRenderError, PdfRenderErrorCode } = await import("./engine");
    throw new PdfRenderError(PdfRenderErrorCode.EngineFailure, e);
  }
}
