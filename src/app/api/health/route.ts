/**
 * GET /api/health — 健康檢查端點
 *
 * launcher 啟動後以 polling 呼叫此端點，確認 Next.js server 已就緒。
 * 回 200 + {status:'ok', version}；version 來自 package.json（build/runtime 安全）。
 *
 * version 取得方式：
 *   1. process.env.npm_package_version — pnpm/npm run script 時自動注入（run-time 可用）
 *   2. process.env.BUILD_TIME_VERSION  — next.config.ts 以 env 注入的 build-time 常數（備用）
 *   3. '0.0.0'                         — 最終保底，防止 undefined 破壞 JSON schema
 *
 * 設計依據：
 *   contract.ts HealthResponse
 *   tasks.md Wave 2 task 2.2
 *   design.md Decision 4/5（launcher 以此 route polling 判斷 server 就緒）
 */
import { NextResponse } from "next/server";

import type { HealthResponse } from "@/lib/local-api/contract";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/health — 回 200 {status:'ok', version}，供 launcher polling 用。
 */
export function GET(): NextResponse<HealthResponse> {
  // 優先取 npm 執行環境注入的版本；其次取 build-time 注入；最終備用 '0.0.0'
  const version =
    process.env.npm_package_version ??
    process.env.BUILD_TIME_VERSION ??
    "0.0.0";

  return NextResponse.json(
    {
      status: "ok",
      version,
    } satisfies HealthResponse,
    { status: 200 },
  );
}
