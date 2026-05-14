/**
 * Phase 2 紅燈測試 — pdf-theme-system (ThemeProvider)
 *
 * PTS-005：useTheme outside provider throws ThemeError::ProviderMissing
 * 所有 import 指向尚未實作的模組 → 編譯失敗 = 紅燈
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";

// ❌ 這個模組還不存在 — 紅燈起點
import { useTheme, ThemeError, ThemeErrorCode } from "../theme-provider";

// ─────────────────────────────────────────────────────────────────────────────
// PTS-005：useTheme 在 ThemeProvider 外部呼叫時丟 ThemeError::ProviderMissing
// ─────────────────────────────────────────────────────────────────────────────
describe("PTS-005 — useTheme outside ThemeProvider throws ThemeError::ProviderMissing", () => {
  it("useTheme 在無 Provider 的環境下丟 ThemeError", () => {
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow(ThemeError);
  });

  it("丟出的 ThemeError.code 是 ProviderMissing", () => {
    let caughtError: unknown;
    try {
      renderHook(() => useTheme());
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(ThemeError);
    expect((caughtError as ThemeError).code).toBe(ThemeErrorCode.ProviderMissing);
  });

  it("ThemeError.message 包含 'ThemeProvider' 提示字", () => {
    let caughtError: unknown;
    try {
      renderHook(() => useTheme());
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(ThemeError);
    expect((caughtError as ThemeError).message).toMatch(/ThemeProvider/i);
  });
});
