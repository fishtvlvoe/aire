import { describe, it, expect, beforeAll } from "vitest";
import React from "react";
import { pdf, Document, Page } from "@react-pdf/renderer";
import { initReactPdfEngine } from "../react-pdf-init";
import {
  getThemePdfTokens,
  PdfCover,
  PdfPageHeader,
  PdfPageFooter,
  PdfSection,
  PdfFieldTable,
  PdfSignatureBlock,
} from "../react-pdf-components";

beforeAll(() => initReactPdfEngine());

// ────────────────────────────────────────────────────────────
// getThemePdfTokens
// ────────────────────────────────────────────────────────────
describe("getThemePdfTokens", () => {
  it("theme-a-minimal returns object with required string fields (all truthy)", () => {
    const tokens = getThemePdfTokens("theme-a-minimal");
    expect(typeof tokens.primary).toBe("string");
    expect(typeof tokens.text).toBe("string");
    expect(typeof tokens.bg).toBe("string");
    expect(typeof tokens.border).toBe("string");
    expect(typeof tokens.fontFamily).toBe("string");
    expect(tokens.primary).toBeTruthy();
    expect(tokens.text).toBeTruthy();
    expect(tokens.bg).toBeTruthy();
    expect(tokens.border).toBeTruthy();
    expect(tokens.fontFamily).toBeTruthy();
  });

  it("theme-b-professional returns primary = #1E3A5F", () => {
    const tokens = getThemePdfTokens("theme-b-professional");
    expect(tokens.primary).toBe("#1E3A5F");
  });

  it("unknown-theme falls back to theme-a-minimal primary", () => {
    const fallback = getThemePdfTokens("theme-a-minimal");
    const unknown = getThemePdfTokens("unknown-theme");
    expect(unknown.primary).toBe(fallback.primary);
  });
});

// ────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────
async function blobSize(element: React.ReactElement): Promise<number> {
  const doc = React.createElement(
    Document,
    null,
    React.createElement(Page, { size: "A4" }, element)
  );
  const blob = await pdf(doc).toBlob();
  return blob.size;
}

// ────────────────────────────────────────────────────────────
// PdfCover
// ────────────────────────────────────────────────────────────
describe("PdfCover", () => {
  it("renders to PDF blob size > 0 with valid tokens and props", async () => {
    const tokens = getThemePdfTokens("theme-a-minimal");
    const element = React.createElement(PdfCover, {
      tokens,
      caseNo: "AIRE-001",
      clientName: "測試客戶",
      generatedAt: "2026/05/15",
    });
    const size = await blobSize(element);
    expect(size).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────
// PdfPageHeader
// ────────────────────────────────────────────────────────────
describe("PdfPageHeader", () => {
  it("renders to PDF blob size > 0 with tokens, caseNo, pageNum", async () => {
    const tokens = getThemePdfTokens("theme-a-minimal");
    const element = React.createElement(PdfPageHeader, {
      tokens,
      caseNo: "AIRE-001",
      pageNum: 2,
    });
    const size = await blobSize(element);
    expect(size).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────
// PdfPageFooter
// ────────────────────────────────────────────────────────────
describe("PdfPageFooter", () => {
  it("renders to PDF blob size > 0 with tokens and generatedAt", async () => {
    const tokens = getThemePdfTokens("theme-a-minimal");
    const element = React.createElement(PdfPageFooter, {
      tokens,
      generatedAt: "2026/05/15",
    });
    const size = await blobSize(element);
    expect(size).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────
// PdfSection
// ────────────────────────────────────────────────────────────
describe("PdfSection", () => {
  it("renders to PDF blob size > 0 with tokens, title, and a Text child", async () => {
    const { Text } = await import("@react-pdf/renderer");
    const tokens = getThemePdfTokens("theme-a-minimal");
    const element = React.createElement(
      PdfSection,
      { tokens, title: "一、法規告知" },
      React.createElement(Text, null, "內容文字")
    );
    const size = await blobSize(element);
    expect(size).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────
// PdfFieldTable
// ────────────────────────────────────────────────────────────
describe("PdfFieldTable", () => {
  it("renders to PDF blob size > 0 with rows data", async () => {
    const tokens = getThemePdfTokens("theme-a-minimal");
    const element = React.createElement(PdfFieldTable, {
      tokens,
      rows: [["地號", "123-45"]],
    });
    const size = await blobSize(element);
    expect(size).toBeGreaterThan(0);
  });

  it("renders to PDF blob size > 0 with empty value row", async () => {
    const tokens = getThemePdfTokens("theme-a-minimal");
    const element = React.createElement(PdfFieldTable, {
      tokens,
      rows: [["備註", ""]],
    });
    const size = await blobSize(element);
    expect(size).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────
// PdfSignatureBlock
// ────────────────────────────────────────────────────────────
describe("PdfSignatureBlock", () => {
  it("renders to PDF blob size > 0 with tokens", async () => {
    const tokens = getThemePdfTokens("theme-a-minimal");
    const element = React.createElement(PdfSignatureBlock, { tokens });
    const size = await blobSize(element);
    expect(size).toBeGreaterThan(0);
  });
});
