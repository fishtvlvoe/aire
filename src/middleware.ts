/**
 * Next.js Edge Middleware — /api/local/* session token 保護
 *
 * 設計依據：design.md Decision 3（session token 安全邊界）
 *
 * Edge Runtime 限制：
 *   - 不可 import node:crypto（Edge 無此 API）
 *   - 不可 import better-sqlite3（Node native addon，Edge 不支援）
 *   - timingSafeEqual 用 Web Crypto SubtleCrypto 替代（see edgeSafeEqual）
 *
 * 保護範圍：/api/local/*（所有本機 API 端點）
 * 不保護：/api/health（launcher polling 判斷 server 就緒）
 */
import { NextRequest, NextResponse } from "next/server";
import { LOCAL_DEV_TOKEN, LOCAL_TOKEN_HEADER } from "@/lib/local-api/contract";

export const config = {
  // 只攔 /api/local/*，/api/health 不在此 matcher 內
  matcher: ["/api/local/:path*"],
};

// ──────────────────────────────────────────────────────────────────────────────
// Edge-safe timing-safe 字串比對
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Edge-safe 時間安全字串比對。
 *
 * Node.js 的 crypto.timingSafeEqual 在 Edge Runtime 無法使用。
 * 改用手動 XOR 累積：長度不符直接 false（short-circuit 攻擊也能防）。
 * 此函式不依賴任何 Node-only 模組。
 *
 * @param a - 待驗證字串
 * @param b - 合法 token 字串
 * @returns true 若相等（時間安全）
 */
function timingSafeEqualEdge(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ──────────────────────────────────────────────────────────────────────────────
// Middleware 主體
// ──────────────────────────────────────────────────────────────────────────────

export default function middleware(request: NextRequest) {
  // 從環境變數讀取合法 token（launcher 啟動時注入）
  const validToken =
    process.env.AIRE_LOCAL_TOKEN ??
    (process.env.NODE_ENV === "development" ? LOCAL_DEV_TOKEN : "");

  // token 未設定（如開發環境未設 env）→ 拒絕所有請求，要求明確設定
  if (!validToken) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "伺服器尚未設定 AIRE_LOCAL_TOKEN，請透過 launcher 啟動 AIRE",
      },
      { status: 401 },
    );
  }

  // 從請求 header 讀取 token
  const provided = request.headers.get(LOCAL_TOKEN_HEADER) ?? "";

  if (!timingSafeEqualEdge(provided, validToken)) {
    return NextResponse.json(
      {
        error: "unauthorized",
        message: "缺少或無效的 X-Local-Token，請透過 AIRE 應用程式存取本機 API",
      },
      { status: 401 },
    );
  }

  // token 驗證通過，繼續執行下游 route handler
  return NextResponse.next();
}
