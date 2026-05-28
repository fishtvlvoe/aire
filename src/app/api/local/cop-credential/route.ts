/**
 * GET  /api/local/cop-credential  — 讀取帳密（遮罩回傳，不吐明碼）
 * POST /api/local/cop-credential  — 儲存帳密
 *
 * 設計依據：openspec/changes/browser-local-runtime-mvp/design.md Decision 7
 * 型別來源：contract.ts（ReadCopCredentialResponse / SaveCopCredentialRequest）
 */
import { NextRequest, NextResponse } from "next/server";
import type {
  ReadCopCredentialResponse,
  SaveCopCredentialRequest,
} from "@/lib/local-api/contract";
import {
  readCopCredential,
  saveCopCredential,
} from "@/lib/local-api/cop-credential-store";

// Node runtime（AES-GCM 加解密依賴 node:crypto，不可 Edge）
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/local/cop-credential → ReadCopCredentialResponse（或 404） */
export async function GET() {
  const credential = await readCopCredential();
  if (!credential) {
    return NextResponse.json(
      { error: "not_found", message: "尚未設定 COP 帳密" },
      { status: 404 },
    );
  }
  return NextResponse.json(credential satisfies ReadCopCredentialResponse);
}

/** POST /api/local/cop-credential — 儲存帳密，回傳 204 No Content */
export async function POST(request: NextRequest) {
  let body: SaveCopCredentialRequest;
  try {
    body = (await request.json()) as SaveCopCredentialRequest;
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "請提供有效的 JSON body" },
      { status: 400 },
    );
  }

  if (!body.clientId || !body.secret) {
    return NextResponse.json(
      { error: "bad_request", message: "缺少必要欄位：clientId、secret" },
      { status: 400 },
    );
  }

  await saveCopCredential(body.clientId, body.secret);
  // 儲存成功，回傳 204（無 body）
  return new NextResponse(null, { status: 204 });
}
