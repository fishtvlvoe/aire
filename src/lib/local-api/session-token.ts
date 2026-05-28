/**
 * session token 驗證工具
 *
 * 設計依據：design.md Decision 3（session token 安全邊界）
 *
 * token 來源（優先順序）：
 *   1. 環境變數 AIRE_LOCAL_TOKEN（測試/CI 注入用）
 *   2. launcher 啟動時透過 X-Local-Token header 傳入（Wave 2 整合）
 *
 * 此模組只負責「驗證邏輯」（純函式），不負責生成 token。
 * 生成邏輯由 launcher 負責：crypto.randomBytes(32).toString('hex')。
 * middleware.ts 負責把驗證結果轉成 HTTP 401 回應。
 */

import { timingSafeEqual } from "node:crypto";
import { LOCAL_TOKEN_HEADER } from "./contract";

// ──────────────────────────────────────────────────────────────────────────────
// 常數
// ──────────────────────────────────────────────────────────────────────────────

/** /api/local/* 路徑前綴，middleware 只對此前綴生效 */
export const LOCAL_API_PATH_PREFIX = "/api/local" as const;

// ──────────────────────────────────────────────────────────────────────────────
// 公開 API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 從請求 header 中取出 X-Local-Token，與 validToken 做時間安全比對。
 *
 * 時間安全（timing-safe）：使用 crypto.timingSafeEqual 防止 timing attack。
 * token 長度不符時直接回 false（避免 equal 拋錯）。
 *
 * @param req        - 要驗證的 Request 物件（Next.js Edge / Web API）
 * @param validToken - 合法 token 字串（由 launcher 生成並注入環境）
 * @returns true 若 token 合法；false 若缺少、不符或長度不一致
 */
export function validateLocalToken(req: Request, validToken: string): boolean {
  const provided = req.headers.get(LOCAL_TOKEN_HEADER);
  if (!provided) return false;
  if (!validToken) return false;

  // 長度不符直接拒絕（timingSafeEqual 要求等長）
  if (provided.length !== validToken.length) return false;

  try {
    return timingSafeEqual(
      Buffer.from(provided, "utf8"),
      Buffer.from(validToken, "utf8"),
    );
  } catch {
    // 任何邊緣情況（Buffer 建立失敗等）都視為驗證失敗
    return false;
  }
}

/**
 * 判斷路徑是否需要 token 保護。
 *
 * 受保護：/api/local/*（所有 local API 端點）
 * 不受保護：
 *   - /api/health（launcher polling 判斷 server 就緒）
 *   - 其他非 /api/local/* 路徑
 *
 * @param pathname - URL 路徑部分（不含 query string）
 * @returns true 若此路徑需要 X-Local-Token
 */
export function isProtectedLocalPath(pathname: string): boolean {
  return pathname.startsWith(LOCAL_API_PATH_PREFIX);
}

/**
 * 生成本機 session token（launcher 啟動時呼叫一次）。
 * 回傳 64 個 hex 字元（256-bit 隨機熵）。
 *
 * Wave 2 整合：launcher 呼叫此函式，把結果注入：
 *   - process.env.AIRE_LOCAL_TOKEN（Next.js server 讀取）
 *   - 首頁 <meta name="aire-local-token">（前端讀取放入每次請求 header）
 */
export function generateLocalToken(): string {
  // Node 環境用 require('crypto').randomBytes；
  // 此函式只在 server/launcher 端執行，不在 Edge Runtime 執行。
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require("node:crypto") as typeof import("node:crypto");
  return nodeCrypto.randomBytes(32).toString("hex");
}
