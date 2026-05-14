/**
 * Phase 2 紅燈測試 — LegalNoticeBlock 空 cache 狀態
 *
 * LPB-009：空 cache 顯示 placeholder；LPB-010：日期格式（西元 + 民國）
 * 所有 import 指向尚未實作的模組 → 編譯/import 失敗 = 紅燈
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { Document, pdf } from "@react-pdf/renderer";

// ❌ 這個模組還不存在 — 紅燈起點
import {
  LegalNoticeBlock,
  EMPTY_CACHE_PLACEHOLDER,
  formatVersionDate,
  type LegalClauseData,
} from "../legal-notice";

// ─────────────────────────────────────────────────────────────────────────────
// LPB-009 / spec: 空 cache 渲染 placeholder
// ─────────────────────────────────────────────────────────────────────────────
describe("LPB-009 — Empty cache renders placeholder text", () => {
  it("EMPTY_CACHE_PLACEHOLDER 常數必須是指定文字", () => {
    // ❌ EMPTY_CACHE_PLACEHOLDER 尚未實作 → import 失敗 = 紅燈
    expect(EMPTY_CACHE_PLACEHOLDER).toBe(
      "（法規資料同步中，下次重新產出說明書時將自動補入）"
    );
  });

  it("空 clauses 陣列應渲染 placeholder，不渲染任何 law heading", async () => {
    const doc = (
      <Document>
        <LegalNoticeBlock clauses={[]} theme="theme-a-minimal" />
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const text = await blob.text();

    // 應有 placeholder
    expect(text).toContain("法規資料同步中");

    // 不應有任何法規標題
    expect(text).not.toContain("不動產經紀業管理條例");
    expect(text).not.toContain("消費者保護法");
    expect(text).not.toContain("公平交易法");
  });

  it("null clauses 應視為空 cache 並渲染 placeholder", async () => {
    const doc = (
      <Document>
        {/* @ts-expect-error 故意傳 null 測試防禦性 */}
        <LegalNoticeBlock clauses={null} theme="theme-a-minimal" />
      </Document>
    );

    // 不應 throw，應 gracefully 渲染 placeholder
    const blob = await pdf(doc).toBlob();
    const text = await blob.text();
    expect(text).toContain("法規資料同步中");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LPB-010 / spec: 版本日期格式（西元 + 民國）
// 對應失敗矩陣 LPB-010：month/day zero-padding
// ─────────────────────────────────────────────────────────────────────────────
describe("LPB-010 — Version date format includes both Western and ROC year", () => {
  it("formatVersionDate('2024-08-15') 應包含西元年和民國年", () => {
    // ❌ formatVersionDate 尚未實作 → import 失敗 = 紅燈
    const formatted = formatVersionDate("2024-08-15");

    // 應包含西元年格式：「2024 年 08 月 15 日」
    expect(formatted).toContain("2024 年 08 月 15 日");

    // 應包含民國年格式：「民國 113 年 08 月 15 日」（2024 - 1911 = 113）
    expect(formatted).toContain("民國 113 年 08 月 15 日");
  });

  it("月份和日期必須 zero-padding（1 → '01'，不是 '1'）", () => {
    const formatted = formatVersionDate("2024-01-05");

    // 月份必須是 2 位數
    expect(formatted).toContain("01 月");
    expect(formatted).not.toContain(" 1 月"); // 不應是 1 月（一位數）

    // 日期必須是 2 位數
    expect(formatted).toContain("05 日");
    expect(formatted).not.toContain(" 5 日"); // 不應是 5 日（一位數）
  });

  it("民國年計算正確（2024 - 1911 = 113）", () => {
    const formatted = formatVersionDate("2024-08-15");
    expect(formatted).toContain("113");
  });

  it("民國元年（1912）的計算正確", () => {
    const formatted = formatVersionDate("1912-01-01");
    expect(formatted).toContain("民國 1 年");
  });

  it("formatVersionDate 對無效日期字串返回 fallback 而非 throw", () => {
    // 不應 throw，應返回 fallback 字串
    expect(() => formatVersionDate("invalid-date")).not.toThrow();
    const fallback = formatVersionDate("invalid-date");
    expect(typeof fallback).toBe("string");
    expect(fallback.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LPB-010 補充：PDF 渲染中的日期格式
// ─────────────────────────────────────────────────────────────────────────────
describe("LPB-010 — PDF renders both year systems for version date", () => {
  it("渲染出的 PDF 文字包含西元和民國年份", async () => {
    const clause: LegalClauseData = {
      law_id: "real-estate-broker-act",
      title: "不動產經紀業管理條例",
      content_markdown: "第一條 本條例規定。",
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

    // 西元年
    expect(text).toContain("2024");
    // 民國年
    expect(text).toContain("113");
  });
});
