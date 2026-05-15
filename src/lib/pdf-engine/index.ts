import React from "react";
import { pdf } from "@react-pdf/renderer";

import type { LegalClauseData } from "../pdf-blocks/legal-notice";
import type { PdfTheme } from "../pdf-themes/types";
import { PdfDocument, type CaseData } from "./document";
import { initReactPdfEngine } from "./react-pdf-init";

export { PdfRenderError, PdfRenderErrorCode } from "./engine";
export type { CaseData };

const LEGAL_LAW_IDS = [
  "real-estate-broker-act",
  "consumer-protection-relevant",
  "fair-trade-relevant",
] as const;

function isLegalClauseData(value: unknown): value is LegalClauseData {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.law_id === "string" &&
    typeof record.title === "string" &&
    typeof record.content_markdown === "string" &&
    typeof record.version_date === "string" &&
    typeof record.fetched_at === "string" &&
    typeof record.source_url === "string"
  );
}

async function fetchLegalClausesFromIpc(): Promise<LegalClauseData[]> {
  const { invoke } = await import("@tauri-apps/api/core");
  const responses = await Promise.all(
    LEGAL_LAW_IDS.map(async (lawId) => {
      const result = await invoke("get_legal_clause", { law_id: lawId });
      return isLegalClauseData(result) ? result : null;
    }),
  );
  return responses.filter((item): item is LegalClauseData => item !== null);
}

export async function renderDisclosurePdf(
  caseData: CaseData,
  theme: PdfTheme,
  logo: Uint8Array | null,
  legalClauses?: LegalClauseData[],
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

  let resolvedLegalClauses = Array.isArray(legalClauses) ? legalClauses : [];
  if (resolvedLegalClauses.length === 0) {
    try {
      resolvedLegalClauses = await fetchLegalClausesFromIpc();
    } catch (e) {
      console.warn("[pdf-engine] get_legal_clause failed, falling back to empty clauses.", e);
    }
  }

  try {
    const doc = React.createElement(PdfDocument, {
      caseData,
      theme,
      logo,
      legalClauses: resolvedLegalClauses,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await pdf(doc as any).toBlob();
  } catch (e) {
    const { PdfRenderError, PdfRenderErrorCode } = await import("./engine");
    throw new PdfRenderError(PdfRenderErrorCode.EngineFailure, e);
  }
}
