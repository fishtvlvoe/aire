/**
 * Phase 2 紅燈測試 — 台灣日期格式工具函數
 *
 * 對應失敗矩陣 LPB-010：month/day zero-padding；LRV-010：台灣時區日期顯示
 * 所有 import 指向尚未實作的模組 → 編譯/import 失敗 = 紅燈
 */

import { describe, it, expect } from "vitest";

// ❌ 這個模組還不存在 — 紅燈起點
import {
  toRocYear,
  formatDateTwn,
  formatDateTwnShort,
  toLocalTwDate,
  type TwnDateParts,
} from "../date-format-twn";

// ─────────────────────────────────────────────────────────────────────────────
// toRocYear — 西元年轉民國年
// ─────────────────────────────────────────────────────────────────────────────
describe("toRocYear — Convert Western year to ROC year", () => {
  it("2024 → 113", () => {
    // ❌ toRocYear 尚未實作 → import 失敗 = 紅燈
    expect(toRocYear(2024)).toBe(113);
  });

  it("1912 → 1（民國元年）", () => {
    expect(toRocYear(1912)).toBe(1);
  });

  it("1911 → 0（民國前 1 年 — 不合法，應 throw 或返回 null）", () => {
    // 1911 = 民國 0 年，不合法
    expect(() => toRocYear(1911)).toThrow();
  });

  it("2026 → 115", () => {
    expect(toRocYear(2026)).toBe(115);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatDateTwn — 完整格式（西元 + 民國雙列）
// ─────────────────────────────────────────────────────────────────────────────
describe("formatDateTwn — Full format with both year systems", () => {
  it("'2024-08-15' → '2024 年 08 月 15 日（民國 113 年 08 月 15 日）'", () => {
    // ❌ formatDateTwn 尚未實作 → import 失敗 = 紅燈
    const result = formatDateTwn("2024-08-15");
    expect(result).toBe("2024 年 08 月 15 日（民國 113 年 08 月 15 日）");
  });

  it("月份 zero-padding：'2024-01-05' → '2024 年 01 月 05 日（...）'", () => {
    const result = formatDateTwn("2024-01-05");
    expect(result).toContain("01 月");
    expect(result).toContain("05 日");
  });

  it("無效日期字串不 throw，返回 fallback", () => {
    expect(() => formatDateTwn("not-a-date")).not.toThrow();
    const fallback = formatDateTwn("not-a-date");
    expect(typeof fallback).toBe("string");
    expect(fallback.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatDateTwnShort — 短格式（民國年格式，供 UI 顯示）
// ─────────────────────────────────────────────────────────────────────────────
describe("formatDateTwnShort — Short ROC format", () => {
  it("'2026-05-14' → '民國 115 年 05 月 14 日'", () => {
    // ❌ formatDateTwnShort 尚未實作 → import 失敗 = 紅燈
    const result = formatDateTwnShort("2026-05-14");
    expect(result).toBe("民國 115 年 05 月 14 日");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// toLocalTwDate — UTC ISO 8601 轉台灣本地日期（UTC+8）
// 對應失敗矩陣 RLV-010：台灣 UTC+8 日期邊界
// ─────────────────────────────────────────────────────────────────────────────
describe("toLocalTwDate — Convert UTC timestamp to Taiwan local date string", () => {
  it("'2026-05-14T15:30:00Z' → '2026-05-14'（台灣 23:30，仍是 5/14）", () => {
    // ❌ toLocalTwDate 尚未實作 → import 失敗 = 紅燈
    const result = toLocalTwDate("2026-05-14T15:30:00Z");
    expect(result).toBe("2026-05-14");
  });

  it("台灣 UTC+8 日期邊界：UTC '2026-05-13T16:00:00Z' = 台灣 '2026-05-14T00:00:00+08:00' → '2026-05-14'", () => {
    const result = toLocalTwDate("2026-05-13T16:00:00Z");
    expect(result).toBe("2026-05-14");
  });

  it("UTC '2026-05-13T15:59:59Z' = 台灣 '2026-05-13T23:59:59+08:00' → '2026-05-13'", () => {
    const result = toLocalTwDate("2026-05-13T15:59:59Z");
    expect(result).toBe("2026-05-13");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TwnDateParts type 存在性驗證
// ─────────────────────────────────────────────────────────────────────────────
describe("TwnDateParts type structure", () => {
  it("TwnDateParts 必須包含 year, rocYear, month, day 欄位", () => {
    // ❌ TwnDateParts type 尚未定義 → import 失敗 = 紅燈
    const parts: TwnDateParts = {
      year: 2024,
      rocYear: 113,
      month: 8,
      day: 15,
      monthPadded: "08",
      dayPadded: "15",
    };

    expect(parts.year).toBe(2024);
    expect(parts.rocYear).toBe(113);
    expect(parts.monthPadded).toBe("08");
    expect(parts.dayPadded).toBe("15");
  });
});
