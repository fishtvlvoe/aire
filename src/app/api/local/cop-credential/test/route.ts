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
  const { readCopCredential, readRawCopCredential } = await import(
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

  const startMs = Date.now();
  const raw = await readRawCopCredential();
  if (!raw) {
    return NextResponse.json(
      { error: "not_found", message: "尚未設定 COP 帳密，請先儲存帳密" },
      { status: 409 },
    );
  }

  const tokenEndpoint = process.env.LAND_REGISTRY_TOKEN_ENDPOINT ?? "https://copapi.moi.gov.tw/cp/getToken";
  const tokenResp = await fetch(tokenEndpoint, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${raw.clientId}:${raw.secret}`).toString("base64")}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    signal: AbortSignal.timeout(15000),
  });
  const latencyMs = Date.now() - startMs;
  const text = await tokenResp.text();

  if (!tokenResp.ok) {
    return NextResponse.json({
      success: false,
      message: `COP token 驗證失敗（HTTP ${tokenResp.status}）`,
      latencyMs,
    });
  }

  const body = parseJson(text) as { access_token?: unknown } | null;
  if (!body) {
    const title = text.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
    return NextResponse.json({
      success: false,
      message: `COP token 驗證失敗（HTTP ${tokenResp.status}，回應不是 JSON${title ? `：${title}` : ""}）`,
      latencyMs,
    });
  }
  if (typeof body?.access_token !== "string" || !body.access_token.trim()) {
    return NextResponse.json({
      success: false,
      message: "COP token 回應缺少 access_token",
      latencyMs,
    });
  }

  const result: TestCopCredentialResponse = {
    success: true,
    message: `連線成功（clientId: ${credential.clientIdMasked}）`,
    latencyMs,
  };

  return NextResponse.json(result);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
