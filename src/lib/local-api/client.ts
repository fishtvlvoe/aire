/**
 * 本機 API fetch helper
 *
 * 自動帶入 X-Local-Token header（從 window.__AIRE_LOCAL_TOKEN__ 讀取）。
 * 所有 /api/local/* 前端呼叫應改用此 helper，確保 middleware 不會回 401。
 *
 * 設計依據：contract.ts LOCAL_TOKEN_HEADER + Decision 3（session token）
 */
import { LOCAL_TOKEN_HEADER } from "./contract";

/**
 * 讀取本機 session token。
 * launcher 啟動時由 root layout 注入 window.__AIRE_LOCAL_TOKEN__。
 * 讀不到（如 SSR 或 token 尚未注入）回傳空字串。
 */
async function getLocalToken(): Promise<string> {
  if (typeof window !== "undefined") {
    const token = (window as unknown as Record<string, unknown>).__AIRE_LOCAL_TOKEN__;
    if (typeof token === "string" && token) return token;

    try {
      const response = await fetch("/api/config");
      if (response.ok) {
        const config = (await response.json()) as { token?: unknown };
        if (typeof config.token === "string" && config.token) {
          (window as unknown as Record<string, unknown>).__AIRE_LOCAL_TOKEN__ = config.token;
          return config.token;
        }
      }
    } catch {
      // 呼叫端會收到 401 或網路錯誤；這裡只負責盡力補 token。
    }
  }
  return "";
}

/**
 * 對 /api/local/* 發出請求，自動注入 X-Local-Token header。
 *
 * @param path  - 請求路徑（如 "/api/local/cases"）
 * @param init  - RequestInit（method、body、headers 等），headers 會與 token header 合併
 * @returns     - fetch Response（呼叫端自行處理 ok 判斷）
 *
 * @example
 *   const res = await localApiFetch("/api/local/cases", { method: "GET" });
 *   const data = await res.json();
 */
export async function localApiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getLocalToken();

  const headers = new Headers(init.headers);
  headers.set(LOCAL_TOKEN_HEADER, token);

  // 若 body 是 JSON 物件字串，確保 Content-Type 已設定
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(path, { ...init, headers });
}
