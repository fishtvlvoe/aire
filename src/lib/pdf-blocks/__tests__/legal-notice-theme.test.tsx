/**
 * Phase 2 紅燈測試 — LegalNoticeBlock 主題 token 消費
 *
 * LPB-005 / LPB-006：useTheme() 在 @react-pdf context 中的行為 + 主題 A vs C 顏色差異
 * 所有 import 指向尚未實作的模組 → 編譯/import 失敗 = 紅燈
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { Document, pdf } from "@react-pdf/renderer";

// ❌ 這些模組還不存在 — 紅燈起點
import {
  LegalNoticeBlock,
  type LegalClauseData,
  getLegalNoticeThemeStyles,
} from "../legal-notice";

import type { LegalNoticeThemeStyles } from "../legal-notice";

// ─────────────────────────────────────────────────────────────────────────────
// Test fixtures
// ─────────────────────────────────────────────────────────────────────────────

const ONE_CLAUSE: LegalClauseData[] = [
  {
    law_id: "real-estate-broker-act",
    title: "不動產經紀業管理條例",
    content_markdown: "第一條 測試內容。",
    version_date: "2024-08-15",
    fetched_at: "2026-05-14T10:00:00Z",
    source_url: "https://law.moj.gov.tw/test",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LPB-005 / spec: 主題 A 和主題 C 的 heading color 不同
// 對應失敗矩陣 LPB-005：@react-pdf context 限制
// ─────────────────────────────────────────────────────────────────────────────
describe("LPB-005 — Theme A and Theme C produce different style values", () => {
  it("getLegalNoticeThemeStyles 對不同主題應返回不同的 headingColor", () => {
    // ❌ getLegalNoticeThemeStyles 尚未實作 → import 失敗 = 紅燈
    const stylesA: LegalNoticeThemeStyles = getLegalNoticeThemeStyles("theme-a-minimal");
    const stylesC: LegalNoticeThemeStyles = getLegalNoticeThemeStyles("theme-c-tech-elegant");

    // heading color 必須不同
    expect(stylesA.headingColor).not.toBe(stylesC.headingColor);
    // body color 必須不同
    expect(stylesA.bodyColor).not.toBe(stylesC.bodyColor);
  });

  it("主題 A 的 headingColor 不應為 undefined 或空字串", () => {
    const stylesA: LegalNoticeThemeStyles = getLegalNoticeThemeStyles("theme-a-minimal");

    expect(stylesA.headingColor).toBeTruthy();
    expect(typeof stylesA.headingColor).toBe("string");
    // 必須是有效的 CSS 顏色（十六進位或 rgb 格式）
    expect(stylesA.headingColor).toMatch(/^#[0-9a-fA-F]{3,6}$|^rgb\(/);
  });

  it("所有必要的 style 欄位都存在（不依賴 hardcoded 值）", () => {
    const styles: LegalNoticeThemeStyles = getLegalNoticeThemeStyles("theme-a-minimal");

    // LegalNoticeThemeStyles 必須包含這些 keys
    const requiredKeys: (keyof LegalNoticeThemeStyles)[] = [
      "headingColor",
      "bodyColor",
      "accentColor",
      "headingFontSize",
      "bodyFontSize",
      "sectionSpacing",
    ];

    for (const key of requiredKeys) {
      expect(styles[key]).toBeDefined();
      expect(styles[key]).not.toBeNull();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LPB-006 / spec: 主題 token 未覆蓋時不 fallback 到相同顏色
// 對應失敗矩陣 LPB-006：theme-c 的 heading token 未覆蓋
// ─────────────────────────────────────────────────────────────────────────────
describe("LPB-006 — Theme C overrides default heading color", () => {
  it("theme-c-tech-elegant 的 headingColor 應與 theme-a-minimal 不同", () => {
    const stylesA: LegalNoticeThemeStyles = getLegalNoticeThemeStyles("theme-a-minimal");
    const stylesC: LegalNoticeThemeStyles = getLegalNoticeThemeStyles("theme-c-tech-elegant");

    // 如果兩個主題返回相同的 headingColor，表示 theme-c 未正確覆蓋 default token
    expect(stylesA.headingColor).not.toEqual(stylesC.headingColor);
  });

  it("PDF 渲染時 theme-a 和 theme-c 輸出的 style props 不同", async () => {
    const docA = (
      <Document>
        <LegalNoticeBlock clauses={ONE_CLAUSE} theme="theme-a-minimal" />
      </Document>
    );

    const docC = (
      <Document>
        <LegalNoticeBlock clauses={ONE_CLAUSE} theme="theme-c-tech-elegant" />
      </Document>
    );

    // 兩個 PDF blob 應不同（因為 style 不同）
    const blobA = await pdf(docA).toBlob();
    const blobC = await pdf(docC).toBlob();

    const textA = await blobA.text();
    const textC = await blobC.text();

    // PDF 內部的 style token 應不同（這是粗略驗證）
    // 更精準的驗證在 E2E 截圖比對
    expect(textA).not.toBe(textC);
  });
});
