import { NextResponse } from "next/server";

/**
 * /api/config — 動態返回運行時環境變數
 *
 * launcher 啟動時設定 AIRE_LOCAL_TOKEN 環境變數，
 * 前端在應用啟動時調用此 API 讀取 token，
 * 而不是依賴 build time 注入。
 */
export async function GET() {
  return NextResponse.json({
    token: process.env.AIRE_LOCAL_TOKEN || "",
    env: process.env.NODE_ENV || "development",
  });
}
