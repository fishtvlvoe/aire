/**
 * Phase 2 紅燈測試 — LegalNoticeBlock 長內容換頁與「（續下頁）」標記
 *
 * LPB-007 / LPB-008：wrap + continuation marker + 頁面斷點
 * 所有 import 指向尚未實作的模組 → 編譯/import 失敗 = 紅燈
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { Document, pdf } from "@react-pdf/renderer";

// ❌ 這個模組還不存在 — 紅燈起點
import {
  LegalNoticeBlock,
  type LegalClauseData,
  CONTINUATION_MARKER,
} from "../legal-notice";

// ─────────────────────────────────────────────────────────────────────────────
// Helper：粗估 PDF 頁數
// ─────────────────────────────────────────────────────────────────────────────
async function countPdfPages(blob: Blob): Promise<number> {
  const text = await blob.text();
  const matches = text.match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// LPB-007 / spec: 長法規內容跨頁時有「（續下頁）」標記
// 對應失敗矩陣 LPB-007：每頁都加標記而非只在有溢出的頁尾
// ─────────────────────────────────────────────────────────────────────────────
describe("LPB-007 — Long law content gets continuation marker on overflow page", () => {
  it("CONTINUATION_MARKER 常數必須是「（續下頁）」", () => {
    // ❌ CONTINUATION_MARKER 尚未實作 → import 失敗 = 紅燈
    expect(CONTINUATION_MARKER).toBe("（續下頁）");
  });

  it("法規內容超過一頁時，PDF 應包含「（續下頁）」標記", async () => {
    // 產生超長 content_markdown（超過一頁）
    const longContent = "第一條 " + "本條例規定。".repeat(200); // ~1000 字，約超過一頁

    const clause: LegalClauseData = {
      law_id: "real-estate-broker-act",
      title: "不動產經紀業管理條例（長版）",
      content_markdown: longContent,
      version_date: "2024-08-15",
      fetched_at: "2026-05-14T10:00:00Z",
      source_url: "https://law.moj.gov.tw/test",
    };

    const doc = (
      <Document>
        <LegalNoticeBlock clauses={[clause]} theme="theme-a-minimal" />
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const text = await blob.text();
    const pageCount = await countPdfPages(blob);

    // 應有超過 1 頁
    expect(pageCount).toBeGreaterThan(1);

    // 應包含「（續下頁）」
    expect(text).toContain("（續下頁）");
  });

  it("法規內容不超過一頁時，不應有「（續下頁）」標記", async () => {
    const shortContent = "第一條 本條例規定。"; // 短內容

    const clause: LegalClauseData = {
      law_id: "real-estate-broker-act",
      title: "不動產經紀業管理條例（短版）",
      content_markdown: shortContent,
      version_date: "2024-08-15",
      fetched_at: "2026-05-14T10:00:00Z",
      source_url: "https://law.moj.gov.tw/test",
    };

    const doc = (
      <Document>
        <LegalNoticeBlock clauses={[clause]} theme="theme-a-minimal" />
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const text = await blob.text();

    // 不應有「（續下頁）」（短內容不換頁）
    expect(text).not.toContain("（續下頁）");
  });

  it("超過 3 頁的法規不應在每頁都有「（續下頁）」（只在溢出頁有）", async () => {
    // 產生超長內容（超過 3 頁）
    const veryLongContent = "第一條 " + "本條例規定。".repeat(600);

    const clause: LegalClauseData = {
      law_id: "real-estate-broker-act",
      title: "不動產經紀業管理條例（超長版）",
      content_markdown: veryLongContent,
      version_date: "2024-08-15",
      fetched_at: "2026-05-14T10:00:00Z",
      source_url: "https://law.moj.gov.tw/test",
    };

    const doc = (
      <Document>
        <LegalNoticeBlock clauses={[clause]} theme="theme-a-minimal" />
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const text = await blob.text();
    const pageCount = await countPdfPages(blob);

    // 應有超過 3 頁
    expect(pageCount).toBeGreaterThan(3);

    // 「（續下頁）」的出現次數應 = pageCount - 1（最後一頁沒有）
    const continuationMatches = text.match(/（續下頁）/g) ?? [];
    expect(continuationMatches.length).toBe(pageCount - 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LPB-014 / spec: Markdown 語法不原文渲染
// 對應失敗矩陣 LPB-014：@react-pdf 不解析 Markdown
// ─────────────────────────────────────────────────────────────────────────────
describe("LPB-014 — Markdown in content_markdown is parsed, not raw-rendered", () => {
  it("**bold** Markdown 語法不應在 PDF 中顯示為 '**bold**'", async () => {
    const clause: LegalClauseData = {
      law_id: "real-estate-broker-act",
      title: "不動產經紀業管理條例",
      content_markdown: "第一條 **重要規定**：本條例管理不動產。",
      version_date: "2024-08-15",
      fetched_at: "2026-05-14T10:00:00Z",
      source_url: "https://law.moj.gov.tw/test",
    };

    const doc = (
      <Document>
        <LegalNoticeBlock clauses={[clause]} theme="theme-a-minimal" />
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const text = await blob.text();

    // PDF 中不應出現 Markdown 的 ** 符號
    expect(text).not.toContain("**重要規定**");

    // 「重要規定」文字應該存在（只是被 parse 後以粗體渲染）
    expect(text).toContain("重要規定");
  });
});
