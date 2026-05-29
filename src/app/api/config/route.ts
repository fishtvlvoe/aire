import { NextResponse } from "next/server";
import { LOCAL_DEV_TOKEN } from "@/lib/local-api/contract";

/**
 * /api/config — 動態返回運行時環境變數
 *
 * launcher 透過 /api/init 初始化 token 到 globalThis，
 * 前端在應用啟動時調用此 API 讀取 token。
 */
export async function GET() {
  // 從全局記憶讀取（launcher 透過 /api/init 設定）
  const token =
    (globalThis as any).__AIRE_SESSION_TOKEN__ ||
    process.env.AIRE_LOCAL_TOKEN ||
    (process.env.NODE_ENV === "development" ? LOCAL_DEV_TOKEN : "");

  return NextResponse.json({
    token,
    env: process.env.NODE_ENV || "development",
  });
}
