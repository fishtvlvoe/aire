/**
 * middleware 整合測試：token 驗證行為
 *
 * 測試 middleware.ts 的核心邏輯（Edge-safe timingSafeEqualEdge + 路由判斷）。
 * Next.js middleware 無法在 vitest 直接以 HTTP 層測試，
 * 改為測試 session-token.ts 公開函式（middleware 直接呼叫的邏輯）。
 *
 * 涵蓋場景：
 *   A. 帶正確 token → validateLocalToken = true（middleware 放行）
 *   B. 不帶 token   → validateLocalToken = false（middleware 回 401）
 *   C. 帶錯誤 token → validateLocalToken = false（middleware 回 401）
 *   D. token 長度不符 → false（timing-safe 短路保護）
 *   E. 路徑判斷：/api/local/* 受保護，/api/health 不受保護
 */
import { describe, expect, it } from "vitest";
import {
  validateLocalToken,
  isProtectedLocalPath,
} from "@/lib/local-api/session-token";
import { LOCAL_TOKEN_HEADER } from "@/lib/local-api/contract";

const VALID_TOKEN = "a".repeat(64); // 64 hex chars（256-bit）

describe("middleware 整合測試：token 驗證行為", () => {
  it("A. 帶正確 token → validateLocalToken 回 true（middleware 放行）", () => {
    const req = new Request("http://localhost:3000/api/local/cases", {
      headers: { [LOCAL_TOKEN_HEADER]: VALID_TOKEN },
    });
    expect(validateLocalToken(req, VALID_TOKEN)).toBe(true);
  });

  it("B. 不帶 token → validateLocalToken 回 false（middleware 回 401）", () => {
    const req = new Request("http://localhost:3000/api/local/cases");
    expect(validateLocalToken(req, VALID_TOKEN)).toBe(false);
  });

  it("C. 帶錯誤 token → validateLocalToken 回 false（middleware 回 401）", () => {
    const wrongToken = "b".repeat(64);
    const req = new Request("http://localhost:3000/api/local/cases", {
      headers: { [LOCAL_TOKEN_HEADER]: wrongToken },
    });
    expect(validateLocalToken(req, VALID_TOKEN)).toBe(false);
  });

  it("D. token 長度不符 → false（timing-safe 短路保護）", () => {
    const shortToken = "abc";
    const req = new Request("http://localhost:3000/api/local/cases", {
      headers: { [LOCAL_TOKEN_HEADER]: shortToken },
    });
    expect(validateLocalToken(req, VALID_TOKEN)).toBe(false);
  });

  it("E-1. /api/local/* 路徑受 middleware 保護", () => {
    expect(isProtectedLocalPath("/api/local/cases")).toBe(true);
    expect(isProtectedLocalPath("/api/local/cop-credential")).toBe(true);
    expect(isProtectedLocalPath("/api/local/address-discovery")).toBe(true);
    expect(isProtectedLocalPath("/api/local/formal-pull-data")).toBe(true);
    expect(isProtectedLocalPath("/api/local/pdf")).toBe(true);
    expect(isProtectedLocalPath("/api/local/pdf/draft")).toBe(true);
  });

  it("E-2. /api/health 不受 middleware 保護（launcher polling 可自由存取）", () => {
    expect(isProtectedLocalPath("/api/health")).toBe(false);
    expect(isProtectedLocalPath("/api/v1/something")).toBe(false);
    expect(isProtectedLocalPath("/")).toBe(false);
    expect(isProtectedLocalPath("")).toBe(false);
  });

  it("F. validToken 為空時，任何 token 都應回 false", () => {
    const req = new Request("http://localhost:3000/api/local/cases", {
      headers: { [LOCAL_TOKEN_HEADER]: VALID_TOKEN },
    });
    // validToken 空 → session-token.ts 直接回 false
    expect(validateLocalToken(req, "")).toBe(false);
  });
});
