/**
 * Stage 6 整合測試 — PDF 文件含法規告知區塊
 *
 * RWL-001：LegalNoticeBlock 在固定頁後出現恰好 1 次
 * RWL-002：legalClauses 為空時仍渲染（空狀態 placeholder）
 * RWL-003：legalClauses 有資料時，clauses 被傳入 LegalNoticeBlock
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// ─── Mock @react-pdf/renderer ──────────────────────────────────────────────
// 讓所有 react-pdf 元件在 jsdom 環境可渲染（省去 canvas 依賴）
vi.mock("@react-pdf/renderer", () => ({
  Document: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "pdf-document" }, children),
  Page: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "pdf-page" }, children),
  Text: ({ children }: { children: React.ReactNode }) =>
    React.createElement("span", null, children),
  View: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  StyleSheet: { create: (s: unknown) => s },
  Font: { register: vi.fn() },
  pdf: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// ─── Mock theme-provider ────────────────────────────────────────────────────
vi.mock("../../pdf-themes/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useTheme: () => ({ id: "theme-a-minimal", tokens: { colors: {}, primaryColor: "#111827", textColor: "#111827", accentColor: "#3B82F6" } }),
}));

// ─── Mock react-pdf-init ────────────────────────────────────────────────────
vi.mock("../react-pdf-init", () => ({
  initReactPdfEngine: vi.fn(),
  getRegisteredFontFamilies: vi.fn(() => ["NotoSansTC"]),
}));

// ─── Mock LegalNoticeBlock ──────────────────────────────────────────────────
// 用 data-testid 追蹤渲染次數和傳入 props
const mockLegalNoticeBlock = vi.fn(
  ({ clauses }: { clauses: unknown[]; theme: string }) =>
    React.createElement(
      "div",
      {
        "data-testid": "legal-notice-block",
        "data-clause-count": clauses?.length ?? 0,
      },
      "法規告知區塊（Mock）",
    ),
);

vi.mock("../../pdf-blocks/legal-notice", () => ({
  LegalNoticeBlock: (props: { clauses: unknown[]; theme: string }) =>
    mockLegalNoticeBlock(props),
  // 讓 type import 正常
  EMPTY_CACHE_PLACEHOLDER: "（法規資料同步中）",
}));

import { PdfDocument, type CaseData } from "../document";
import { renderDisclosurePdf } from "../index";
import type { PdfTheme } from "../../pdf-themes/types";
import { invoke } from "@tauri-apps/api/core";
import { pdf } from "@react-pdf/renderer";

// ─── 測試資料 ───────────────────────────────────────────────────────────────

const stubTheme: PdfTheme = {
  id: "theme-a-minimal",
  name: "A - Minimal",
  tokens: {
    primaryColor: "#111827",
    textColor: "#374151",
    accentColor: "#3B82F6",
    colors: { primary: "#111827", text: "#374151", accent: "#3B82F6" },
  },
} as unknown as PdfTheme;

const stubCase: CaseData = {
  caseId: "T-001",
  caseType: "residential",
  propertyName: "測試物件",
};

const stubClauses = [
  {
    law_id: "art-1",
    title: "不動產說明書應記載事項",
    content_markdown: "依規定記載...",
    version_date: "2024-01-01",
    fetched_at: "2025-01-01T00:00:00Z",
    source_url: "https://example.gov.tw/law/1",
  },
];

// ─── RWL-001：legal block 渲染恰好 1 次，在固定頁之後 ──────────────────────

describe("RWL-001 — LegalNoticeBlock 渲染恰好 1 次，在固定頁之後", () => {
  beforeEach(() => {
    mockLegalNoticeBlock.mockClear();
  });

  it("PdfDocument 含 legalClauses 時，LegalNoticeBlock 被呼叫恰好 1 次", () => {
    render(
      React.createElement(PdfDocument, {
        caseData: stubCase,
        theme: stubTheme,
        logo: null,
        legalClauses: stubClauses,
      }),
    );

    // LegalNoticeBlock mock 被呼叫 1 次
    expect(mockLegalNoticeBlock).toHaveBeenCalledTimes(1);
  });

  it("legal-notice-block 在 DOM 中存在 1 個", () => {
    const { getAllByTestId } = render(
      React.createElement(PdfDocument, {
        caseData: stubCase,
        theme: stubTheme,
        logo: null,
        legalClauses: stubClauses,
      }),
    );

    const blocks = getAllByTestId("legal-notice-block");
    expect(blocks).toHaveLength(1);
  });

  it("legal-notice-block 出現在固定頁（pdf-page）之後", () => {
    const { getByTestId, getAllByTestId } = render(
      React.createElement(PdfDocument, {
        caseData: stubCase,
        theme: stubTheme,
        logo: null,
        legalClauses: stubClauses,
      }),
    );

    const document = getByTestId("pdf-document");
    const children = Array.from(document.children);

    // 找固定頁（pdf-page）和 legal-notice-block 的索引
    const fixedPageIndices = getAllByTestId("pdf-page").map((el) =>
      children.indexOf(el),
    );
    const legalBlock = getByTestId("legal-notice-block");
    const legalIndex = children.indexOf(legalBlock);

    // legal block 必須在最後一個固定頁之後
    const lastFixedIndex = Math.max(...fixedPageIndices);
    expect(legalIndex).toBeGreaterThan(lastFixedIndex);
  });

  it("有動態頁時，legal-notice-block 應在第一個動態頁之前", () => {
    const { getByTestId, getByText } = render(
      React.createElement(PdfDocument, {
        caseData: {
          ...stubCase,
          dynamicSections: ["現況照片 1/4", "生活機能"],
        },
        theme: stubTheme,
        logo: null,
        legalClauses: stubClauses,
      }),
    );

    const document = getByTestId("pdf-document");
    const children = Array.from(document.children);
    const legalBlock = getByTestId("legal-notice-block");
    const legalIndex = children.indexOf(legalBlock);
    const firstDynamicPageText = getByText("現況照片 1/4");
    const firstDynamicPage = firstDynamicPageText.closest("[data-testid='pdf-page']");
    expect(firstDynamicPage).toBeTruthy();
    const dynamicIndex = children.indexOf(firstDynamicPage as Element);
    expect(legalIndex).toBeLessThan(dynamicIndex);
  });
});

// ─── RWL-002：legalClauses 未傳入時，LegalNoticeBlock 仍被渲染（空陣列） ────

describe("RWL-002 — legalClauses 未傳入，LegalNoticeBlock 仍渲染（空狀態）", () => {
  beforeEach(() => {
    mockLegalNoticeBlock.mockClear();
  });

  it("不傳 legalClauses 時，LegalNoticeBlock 被呼叫 1 次，clauses 為空陣列", () => {
    render(
      React.createElement(PdfDocument, {
        caseData: stubCase,
        theme: stubTheme,
        logo: null,
        // legalClauses 故意省略
      }),
    );

    expect(mockLegalNoticeBlock).toHaveBeenCalledTimes(1);
    // 第一次呼叫的 clauses 應為空陣列
    const [firstCall] = mockLegalNoticeBlock.mock.calls;
    expect(firstCall![0].clauses).toEqual([]);
  });
});

// ─── RWL-003：legalClauses 有資料時，clauses 完整傳入 LegalNoticeBlock ──────

describe("RWL-003 — legalClauses 有資料，完整傳入 LegalNoticeBlock", () => {
  beforeEach(() => {
    mockLegalNoticeBlock.mockClear();
  });

  it("傳入 stubClauses，LegalNoticeBlock 的 clauses prop 與輸入相同", () => {
    render(
      React.createElement(PdfDocument, {
        caseData: stubCase,
        theme: stubTheme,
        logo: null,
        legalClauses: stubClauses,
      }),
    );

    const [firstCall] = mockLegalNoticeBlock.mock.calls;
    expect(firstCall![0].clauses).toEqual(stubClauses);
  });

  it("LegalNoticeBlock 的 theme prop 與 PdfDocument 的 theme.id 相同", () => {
    render(
      React.createElement(PdfDocument, {
        caseData: stubCase,
        theme: stubTheme,
        logo: null,
        legalClauses: stubClauses,
      }),
    );

    const [firstCall] = mockLegalNoticeBlock.mock.calls;
    expect(firstCall![0].theme).toBe(stubTheme.id);
  });
});

describe("RWL-004 — renderDisclosurePdf 會取三條法規並傳入 PdfDocument", () => {
  beforeEach(() => {
    mockLegalNoticeBlock.mockClear();
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
