/**
 * Wave 1 紅燈 1.5 — 未帶 X-Local-Token 的 /api/local/* 請求應被拒 401
 *
 * 場景：不帶 session token header 的請求打到 /api/local/* → 應回 401。
 * 現況：無 token middleware，呼叫直接成功（2xx）→ 斷言 401 失敗 → 紅燈。
 * 轉綠時機：Wave 3 task 3.4 建立 Next.js middleware 驗證 X-Local-Token。
 *
 * 設計依據：design.md Decision 3（session token 安全邊界）
 *
 * 注意：Next.js middleware 無法在 vitest 直接單元測試，
 * 此測試改為測試 middleware 邏輯函式（純函式，可單元測試）。
 * Wave 3 實作時須把驗證邏輯抽成 validateLocalToken(req) → boolean 並匯出。
 */
/**
 * Wave 1 紅燈 1.5 — 未帶 X-Local-Token 的 /api/local/* 請求應被拒 401
 *
 * 場景：不帶 session token header 的請求打到 /api/local/* → 應被拒絕（validateLocalToken = false）。
 * 現況：session-token.ts stub 拋 SessionTokenNotImplementedError → validateLocalToken 無法呼叫 → 紅燈。
 * 轉綠時機：Wave 3 task 3.4 建立 Next.js middleware 並實作 validateLocalToken / isProtectedLocalPath。
 *
 * 設計依據：design.md Decision 3（session token 安全邊界）
 */
import { describe, expect, it } from "vitest";
import { LOCAL_TOKEN_HEADER } from "@/lib/local-api/contract";
import {
  validateLocalToken,
  isProtectedLocalPath,
  LOCAL_API_PATH_PREFIX,
} from "@/lib/local-api/session-token";

describe("Wave 1 紅燈 1.5 — session token 驗證 middleware", () => {
  it("validateLocalToken：未帶 token 的請求應回 false（現無 middleware → 紅燈）", () => {
    expect(LOCAL_API_PATH_PREFIX).toBe("/api/local");
    expect(LOCAL_TOKEN_HEADER).toBe("X-Local-Token");

    const validToken = "secure-random-token-abc123";

    // ★ 紅燈斷言：validateLocalToken 不能拋錯，且未帶 token 應回 false（現拋 NotImplementedError → 紅燈）
    // Wave 3 task 3.4 實作後，此函式直接回 false/true 而非拋錯。

    // 情境 A：未帶 header → false
    const reqNoToken = new Request("http://localhost:3000/api/local/cases");
    expect(validateLocalToken(reqNoToken, validToken)).toBe(false);

    // 情境 B：帶錯誤 token → false
    const reqWrongToken = new Request("http://localhost:3000/api/local/cases", {
      headers: { [LOCAL_TOKEN_HEADER]: "wrong-token" },
    });
    expect(validateLocalToken(reqWrongToken, validToken)).toBe(false);

    // 情境 C：帶正確 token → true
    const reqValidToken = new Request("http://localhost:3000/api/local/cases", {
      headers: { [LOCAL_TOKEN_HEADER]: validToken },
    });
    expect(validateLocalToken(reqValidToken, validToken)).toBe(true);
  });

  it("isProtectedLocalPath：/api/local/* 應受保護，/api/health 不受保護（現無 middleware → 紅燈）", () => {
    // ★ 紅燈斷言：isProtectedLocalPath 不能拋錯（現拋 NotImplementedError → 紅燈）
    expect(isProtectedLocalPath("/api/local/cases")).toBe(true);
    expect(isProtectedLocalPath("/api/local/address-discovery")).toBe(true);
    expect(isProtectedLocalPath("/api/local/formal-pull-data")).toBe(true);
    expect(isProtectedLocalPath("/api/local/cop-credential")).toBe(true);

    // /api/health 不受保護（launcher polling 用）
    expect(isProtectedLocalPath("/api/health")).toBe(false);
    expect(isProtectedLocalPath("/api/v1/something")).toBe(false);
    expect(isProtectedLocalPath("/")).toBe(false);
  });
});
