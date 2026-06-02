import { NextRequest, NextResponse } from "next/server";
import { pullFormalRegistryLocally, type LocalFormalPullInput } from "@/lib/server/local-formal-pull-proxy";

// 本機正式地籍資料 pull proxy：在本機 standalone server 上直接呼叫 COP API。
// 設計依據：openspec/changes/browser-local-runtime-mvp/design.md Decision 5, Decision 6
// （舊版在 production 主動回 local_proxy_unavailable、Tauri 走 IPC — 已廢除）
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: LocalFormalPullInput;
  try {
    payload = (await request.json()) as LocalFormalPullInput;
  } catch {
    return NextResponse.json(
      { error: "invalid_payload", message: "請提供有效的 JSON body" },
      { status: 400 },
    );
  }

  try {
    if (!payload.clientId?.trim() || !payload.secret?.trim()) {
      const { readRawCopCredential } = await import("@/lib/local-api/cop-credential-store");
      const credential = await readRawCopCredential();
      if (credential) {
        payload = {
          ...payload,
          clientId: credential.clientId,
          secret: credential.secret,
        };
      }
    }
    const result = await pullFormalRegistryLocally(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "local_formal_pull_failed",
        message: error instanceof Error ? error.message : "正式資料匯入失敗",
      },
      { status: 400 },
    );
  }
}
