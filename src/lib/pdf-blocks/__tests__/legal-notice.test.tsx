/**
 * Phase 2 紅燈測試 — LegalNoticeBlock 主功能
 *
 * LPB-001 ~ LPB-006：PDF 位置、三條法規渲染、主題 token 消費
 * 所有 import 指向尚未實作的模組 → 編譯/import 失敗 = 紅燈
 */

import { describe, it, expect } from "vitest";
import React from "react";
import { Document, pdf } from "@react-pdf/renderer";

// ❌ 這個模組還不存在 — 紅燈起點
import {
  LegalNoticeBlock,
  type LegalNoticeBlockProps,
  type LegalClauseData,
} from "../legal-notice";

// ─────────────────────────────────────────────────────────────────────────────
// Test fixtures
// ─────────────────────────────────────────────────────────────────────────────

const THREE_CLAUSES: LegalClauseData[] = [
  {
    law_id: "real-estate-broker-act",
    title: "不動產經紀業管理條例",
    content_markdown: "第一條 本條例用以管理不動產經紀業之設立、登記及相關事項。",
    version_date: "2024-08-15",
    fetched_at: "2026-05-14T10:00:00Z",
    source_url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0060013",
  },
  {
    law_id: "consumer-protection-relevant",
    title: "消費者保護法相關條款",
    content_markdown: "第一條 為保護消費者權益，促進國民消費生活安全。",
    version_date: "2024-08-15",
    fetched_at: "2026-05-14T10:00:00Z",
    source_url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=J0170001",
  },
  {
    law_id: "fair-trade-relevant",
    title: "公平交易法相關條款",
    content_markdown: "第一條 為維護交易秩序與消費者利益，確保公平競爭。",
    version_date: "2024-08-15",
    fetched_at: "2026-05-14T10:00:00Z",
    source_url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=J0150001",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LPB-001 / spec: 三條法規各自的 title 都出現在渲染樹中
// ─────────────────────────────────────────────────────────────────────────────
describe("LPB-001 — LegalNoticeBlock renders three law titles", () => {
  it("三條法規的 title 都應出現在 React PDF 元件樹中", async () => {
    // ❌ LegalNoticeBlock 尚未實作 → import 失敗 = 紅燈
    const doc = (
      <Document>
        <LegalNoticeBlock clauses={THREE_CLAUSES} theme="theme-a-minimal" />
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const text = await blob.text();

    expect(text).toContain("不動產經紀業管理條例");
    expect(text).toContain("消費者保護法相關條款");
    expect(text).toContain("公平交易法相關條款");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LPB-003 / spec: 每條法規有 metadata footer，包含「資料來源：」
// ─────────────────────────────────────────────────────────────────────────────
describe("LPB-003 — Each law has metadata footer with 資料來源", () => {
  it("每條法規下方應有 metadata footer 含「資料來源：」", async () => {
    const doc = (
      <Document>
        <LegalNoticeBlock clauses={THREE_CLAUSES} theme="theme-a-minimal" />
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const text = await blob.text();

    // 三條法規 × 每條有一個「資料來源：」標示
    const sourceMatches = text.match(/資料來源：/g) ?? [];
    expect(sourceMatches.length).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LPB-004 / spec: 三條法規渲染順序固定（依 law_id 字母序）
// 對應失敗矩陣 LPB-004：SQLite SELECT 不加 ORDER BY 導致順序不定
// ─────────────────────────────────────────────────────────────────────────────
describe("LPB-004 — Law render order is deterministic", () => {
  it("三條法規應依固定順序渲染（不受 DB 查詢順序影響）", async () => {
    // 故意打亂傳入順序
    const shuffled: LegalClauseData[] = [
      THREE_CLAUSES[2], // fair-trade
      THREE_CLAUSES[0], // real-estate
      THREE_CLAUSES[1], // consumer
    ];

    const doc = (
      <Document>
        <LegalNoticeBlock clauses={shuffled} theme="theme-a-minimal" />
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const text = await blob.text();

    // 不論傳入順序，渲染順序應固定為 consumer → fair-trade → real-estate（字母序）
    const consumerIdx = text.indexOf("消費者保護法相關條款");
    const fairTradeIdx = text.indexOf("公平交易法相關條款");
    const realEstateIdx = text.indexOf("不動產經紀業管理條例");

    // 實作應對 clauses 陣列排序後再渲染
    // 若未排序，這個測試的斷言順序會與預期不同
    expect(consumerIdx).toBeLessThan(realEstateIdx);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LPB-009 / spec: 部分 cache（1/3 條）時的混合狀態渲染
// 對應失敗矩陣 LPB-009：只實作了全空或全有
// ─────────────────────────────────────────────────────────────────────────────
describe("LPB-009 — Partial cache renders available laws + placeholder for missing", () => {
  it("只有 1 條法規時，應渲染該條並對其他兩條顯示 placeholder", async () => {
    const partial: LegalClauseData[] = [THREE_CLAUSES[0]]; // 只有第一條

    const doc = (
      <Document>
        <LegalNoticeBlock clauses={partial} theme="theme-a-minimal" />
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const text = await blob.text();

    // 有 1 條正常渲染
    expect(text).toContain("不動產經紀業管理條例");

    // 其他 2 條應有 placeholder（而非完全消失）
    expect(text).toContain("法規資料同步中");
  });
});
