/**
 * Phase 2 紅燈測試 — docs/data-recovery-guide.md 文件驗證
 *
 * 涵蓋失敗點：DRG-001 ~ DRG-014
 * - 文件存在於正確路徑
 * - 使用繁體中文
 * - 4 個情境 section 且順序正確
 * - 紅字警示在頂部 + 情境 3 段首
 * - 3 個保管建議
 * - 衝突 3 動作說明 + 不動產業範例
 * - 步驟為命令式編號
 *
 * 用 vitest 直接讀檔驗證文件結構
 * 預期：文件不存在 → 測試 FAIL = 紅燈
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const GUIDE_PATH = resolve(__dirname, "data-recovery-guide.md");

let guideContent = "";

describe("data-recovery-guide.md — DRG-001 ~ DRG-014", () => {
  // DRG-001: 文件必須存在於 docs/data-recovery-guide.md
  it("DRG-001: 文件存在於 docs/data-recovery-guide.md", () => {
    expect(existsSync(GUIDE_PATH)).toBe(true);
  });

  // 後續測試需要讀取內容
  beforeAll(() => {
    if (existsSync(GUIDE_PATH)) {
      guideContent = readFileSync(GUIDE_PATH, "utf-8");
    }
  });

  // DRG-002: 文件使用繁體中文（不是簡體字）
  it("DRG-002: 文件使用繁體中文", () => {
    // 繁體字特徵：「資料」不是「资料」，「匯入」不是「导入」
    expect(guideContent).toMatch(/資料|匯入|匯出|儲存|確認/);
    // 不應出現簡體字特徵
    expect(guideContent).not.toMatch(/资料|导入|导出|储存|确认/);
  });

  // DRG-003: 文件頂部有紅字警示（HTML 或 Markdown 格式）
  it("DRG-003: 文件頂部（前 500 字）有紅色警示", () => {
    const top = guideContent.slice(0, 500);
    // 支援 HTML <span style="color:red"> 或 Markdown 約定的警示符號
    const hasRedWarning =
      top.includes("color:red") ||
      top.includes("color: red") ||
      top.includes("> ⚠️") ||
      top.includes("> [!WARNING]") ||
      top.includes("**警告**") ||
      top.includes("**重要警示**");

    expect(hasRedWarning).toBe(true);
  });

  // DRG-004: 必須包含 4 個情境 section（情境 1 ~ 情境 4）
  it("DRG-004: 文件包含 4 個情境 section（順序正確）", () => {
    const scenario1Pos = guideContent.indexOf("情境 1");
    const scenario2Pos = guideContent.indexOf("情境 2");
    const scenario3Pos = guideContent.indexOf("情境 3");
    const scenario4Pos = guideContent.indexOf("情境 4");

    expect(scenario1Pos).toBeGreaterThan(-1);
    expect(scenario2Pos).toBeGreaterThan(-1);
    expect(scenario3Pos).toBeGreaterThan(-1);
    expect(scenario4Pos).toBeGreaterThan(-1);

    // 順序正確
    expect(scenario1Pos).toBeLessThan(scenario2Pos);
    expect(scenario2Pos).toBeLessThan(scenario3Pos);
    expect(scenario3Pos).toBeLessThan(scenario4Pos);
  });

  // DRG-005: 情境 3 的段首有紅字警示
  it("DRG-005: 情境 3 段首（情境 3 後 300 字內）有紅色警示", () => {
    const scenario3Pos = guideContent.indexOf("情境 3");
    expect(scenario3Pos).toBeGreaterThan(-1);

    const scenario3Section = guideContent.slice(scenario3Pos, scenario3Pos + 300);
    const hasRedWarning =
      scenario3Section.includes("color:red") ||
      scenario3Section.includes("color: red") ||
      scenario3Section.includes("> [!WARNING]") ||
      scenario3Section.includes("**警告**") ||
      scenario3Section.includes("**注意**");

    expect(hasRedWarning).toBe(true);
  });

  // DRG-006: 包含 3 個保管建議（1. 2. 3. 格式）
  it("DRG-006: 文件包含至少 3 個保管建議", () => {
    // 搜尋保管建議的 section
    const storageSection = guideContent.match(/保管.*[\s\S]*?(?=##|情境|\Z)/m);
    expect(storageSection).not.toBeNull();

    // 在保管 section 中找到 3 個編號項目
    const sectionContent = storageSection![0];
    const numberedItems = sectionContent.match(/^\d+\./gm) || [];
    expect(numberedItems.length).toBeGreaterThanOrEqual(3);
  });

  // DRG-007: 包含衝突處理的 3 個動作說明
  it("DRG-007: 文件說明衝突處理的 3 個動作（覆蓋/保留較新/跳過）", () => {
    expect(guideContent).toMatch(/覆蓋|overwrite/i);
    expect(guideContent).toMatch(/保留較新|keep newer/i);
    expect(guideContent).toMatch(/跳過|skip/i);
  });

  // DRG-008: 包含不動產業範例
  it("DRG-008: 文件包含不動產業的具體範例", () => {
    const hasRealEstateExample =
      guideContent.includes("不動產") ||
      guideContent.includes("房屋") ||
      guideContent.includes("土地") ||
      guideContent.includes("說明書");

    expect(hasRealEstateExample).toBe(true);
  });

  // DRG-009: 步驟為命令式編號（1. 動詞 ...）
  it("DRG-009: 操作步驟使用命令式編號格式", () => {
    // 命令式：以動詞開頭的編號步驟
    const commandSteps = guideContent.match(/^\d+\.\s*(點擊|開啟|選擇|輸入|確認|按下|前往|找到)/gm);
    expect(commandSteps).not.toBeNull();
    expect(commandSteps!.length).toBeGreaterThanOrEqual(3);
  });

  // DRG-010: 標題層級結構正確（h1 > h2 > h3）
  it("DRG-010: 文件有正確的標題層級結構", () => {
    expect(guideContent).toMatch(/^# /m); // h1
    expect(guideContent).toMatch(/^## /m); // h2
  });

  // DRG-011: 文件總長度合理（不少於 500 字）
  it("DRG-011: 文件內容充分（至少 500 字）", () => {
    expect(guideContent.length).toBeGreaterThanOrEqual(500);
  });

  // DRG-012: 情境 2 包含主密碼遺忘相關說明
  it("DRG-012: 情境 2 說明主密碼遺忘的處理方式", () => {
    const scenario2Pos = guideContent.indexOf("情境 2");
    const scenario3Pos = guideContent.indexOf("情境 3");

    if (scenario2Pos === -1 || scenario3Pos === -1) {
      throw new Error("找不到情境 2 或 情境 3");
    }

    const scenario2Content = guideContent.slice(scenario2Pos, scenario3Pos);
    expect(scenario2Content).toMatch(/主密碼|救援碼|recovery/i);
  });

  // DRG-013: 情境 1 包含資料匯出/備份說明
  it("DRG-013: 情境 1 說明正常備份/匯出流程", () => {
    const scenario1Pos = guideContent.indexOf("情境 1");
    const scenario2Pos = guideContent.indexOf("情境 2");

    if (scenario1Pos === -1 || scenario2Pos === -1) {
      throw new Error("找不到情境 1 或 情境 2");
    }

    const scenario1Content = guideContent.slice(scenario1Pos, scenario2Pos);
    expect(scenario1Content).toMatch(/匯出|備份|export/i);
  });

  // DRG-014: 情境 4 包含衝突解決說明
  it("DRG-014: 情境 4 說明衝突解決流程", () => {
    const scenario4Pos = guideContent.indexOf("情境 4");
    if (scenario4Pos === -1) {
      throw new Error("找不到情境 4");
    }

    const scenario4Content = guideContent.slice(scenario4Pos);
    expect(scenario4Content).toMatch(/衝突|conflict/i);
    expect(scenario4Content).toMatch(/覆蓋|保留|跳過/);
  });
});
