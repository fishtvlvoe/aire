import { NextRequest, NextResponse } from "next/server";

/**
 * /api/init — Launcher 初始化 API
 *
 * Launcher 啟動 server 後立即調用，傳遞 session token。
 * 存儲到全局記憶，讓 /api/config 讀取返回給前端。
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";

  // 存進全局記憶（避免 build-time env 捕獲）
  (globalThis as any).__AIRE_SESSION_TOKEN__ = token;

  if (token) {
    console.log("[init] Token 已初始化，長度:", token.length);
  } else {
    console.warn("[init] Token 為空");
  }

  return NextResponse.json({ ok: true });
}
