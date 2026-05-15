/**
 * render-with-legal 整合測試
 *
 * RWL-001 ~ RWL-003（PdfDocument + LegalNoticeBlock 整合）已移除：
 *   新架構的 PdfDocument 接受 { data: CaseDossierData, themeId } 且自行內嵌法規條文，
 *   不再透過 LegalNoticeBlock 組裝。
 *
 * RWL-004：renderDisclosurePdf 應呼叫 get_legal_clause 三次（保留）
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { pdf } from "@react-pdf/renderer";

vi.mock("@react-pdf/renderer", () => ({
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children: React.ReactNode }) => children,
  StyleSheet: { create: (s: unknown) => s },
  Font: { register: vi.fn() },
  pdf: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("../react-pdf-init", () => ({
  initReactPdfEngine: vi.fn(),
  getRegisteredFontFamilies: vi.fn(() => ["NotoSansTC"]),
}));

import { renderDisclosurePdf, type CaseData } from "../index";
import type { PdfTheme } from "../../pdf-themes/types";
import { invoke } from "@tauri-apps/api/core";

const stubTheme: PdfTheme = {
  id: "theme-a-minimal",
  name: "A - Minimal",
  tokens: {
    primaryColor: "#111827",
    textColor: "#374151",
    accentColor: "#3B82F6",
    fontFamily: "NotoSansTC",
    colors: { primary: "#111827", text: "#374151", accent: "#3B82F6" },
  },
} as unknown as PdfTheme;

const stubCase: CaseData = {
  caseId: "T-001",
  caseType: "residential",
  propertyName: "測試物件",
};

describe("RWL-004 — renderDisclosurePdf 呼叫 get_legal_clause 三次", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    (pdf as unknown as { mockReset: () => void }).mockReset();
  });

  it("未提供 legalClauses 時，應呼叫 get_legal_clause 三次（固定 law_id）", async () => {
    vi.mocked(invoke).mockResolvedValue({
      law_id: "real-estate-broker-act",
      title: "不動產經紀業管理條例",
      content_markdown: "內容",
      version_date: "2024-08-15",
      fetched_at: "2026-05-15T00:00:00Z",
      source_url: "https://law.moj.gov.tw/",
    });
    vi.mocked(pdf).mockReturnValue({
      toBlob: vi.fn().mockResolvedValue(new Blob(["%PDF-1.4"])),
    } as unknown as ReturnType<typeof pdf>);

    await renderDisclosurePdf(stubCase, stubTheme, null);

    expect(vi.mocked(invoke)).toHaveBeenCalledTimes(3);
    expect(vi.mocked(invoke)).toHaveBeenNthCalledWith(
      1,
      "get_legal_clause",
      { law_id: "real-estate-broker-act" },
    );
    expect(vi.mocked(invoke)).toHaveBeenNthCalledWith(
      2,
      "get_legal_clause",
      { law_id: "consumer-protection-relevant" },
    );
    expect(vi.mocked(invoke)).toHaveBeenNthCalledWith(
      3,
      "get_legal_clause",
      { law_id: "fair-trade-relevant" },
    );
  });
});
