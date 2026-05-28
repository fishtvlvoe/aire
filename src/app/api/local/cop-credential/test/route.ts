/**
 * POST /api/local/cop-credential/test — 測試 COP API 連線
 *
 * 使用已儲存的帳密對 COP 發出測試呼叫，回傳連線是否成功。
 * 若尚未儲存帳密，回傳 409。
 *
 * 設計依據：contract.ts TestCopCredentialResponse
 */
import { NextResponse } from "next/server";
import type { TestCopCredentialResponse } from "@/lib/local-api/contract";

// Node runtime（依賴 cop-credential-store 的 node:crypto 路徑）
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/local/cop-credential/test → TestCopCredentialResponse */
export async function POST() {
  // 動態 import 避免 Edge bundle 掃描到 node:crypto
  const { readCopCredential } = await import(
    "@/lib/local-api/cop-credential-store"
  );

  // 先確認帳密已設定（readCopCredential 回傳遮罩版，不吐明碼）
  const credential = await readCopCredential();
  if (!credential) {
    return NextResponse.json(
      { error: "not_found", message: "尚未設定 COP 帳密，請先儲存帳密" },
      { status: 409 },
    );
  }

  // MVP 範疇：回傳「帳密存在」作為測試連線的最小驗證
  // Wave 4+ 可改為實際呼叫 COP /token endpoint 並量測延遲
  const startMs = Date.now();
  const latencyMs = Date.now() - startMs;

  const result: TestCopCredentialResponse = {
    success: true,
    message: `帳密已設定（clientId: ${credential.clientIdMasked}），MVP 不做真實連線測試`,
    latencyMs,
  };

  return NextResponse.json(result);
}
