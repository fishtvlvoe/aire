/**
 * POST /api/local/pdf
 *
 * 兩階段 PDF 產出端點（Wave 3 task 3.10）。
 * 依 `type` 欄位分流草稿與說明書：
 *   - type: "draft"    → writeDraftPdf   → 草稿書（地政資料快照）
 *   - type: "official" → writeOfficialPdf → 說明書（草稿 + 補件 + 簽名頁）
 *
 * 設計依據：design.md Decision 9（Node 端取代 Rust export_pdf IPC）
 * 型別定義：src/lib/local-api/contract.ts（DraftPdfRequest / OfficialPdfRequest / PdfWriteResponse）
 */

import { NextRequest, NextResponse } from "next/server";
import type { DraftPdfRequest, LocalApiError, OfficialPdfRequest } from "@/lib/local-api/contract";
import { writeDraftPdf, writeOfficialPdf } from "@/lib/local-api/pdf-write-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 請求 body 聯合型別：draft 或 official */
type PdfRouteRequest =
  | ({ type: "draft" } & DraftPdfRequest)
  | ({ type: "official" } & OfficialPdfRequest);

export async function POST(request: NextRequest) {
  let payload: PdfRouteRequest;

  // 解析 request body
  try {
    payload = (await request.json()) as PdfRouteRequest;
  } catch {
    const error: LocalApiError = {
      error: "invalid_payload",
      message: "請提供有效的 JSON body（type: 'draft' | 'official'）",
      status: 400,
    };
    return NextResponse.json(error, { status: 400 });
  }

  // 驗證必要欄位
  if (!payload.type || !["draft", "official"].includes(payload.type)) {
    const error: LocalApiError = {
      error: "invalid_type",
      message: "type 欄位必須為 'draft' 或 'official'",
      status: 400,
    };
    return NextResponse.json(error, { status: 400 });
  }

  if (!payload.caseId) {
    const error: LocalApiError = {
      error: "missing_case_id",
      message: "caseId 為必填欄位",
      status: 400,
    };
    return NextResponse.json(error, { status: 400 });
  }

  // Decision 9：Node 端不渲染，pdfBase64 必填（前端已渲染的 PDF bytes）
  if (!payload.pdfBase64) {
    const error: LocalApiError = {
      error: "missing_pdf_bytes",
      message: "pdfBase64 為必填欄位（前端已渲染的 PDF bytes，base64 編碼）",
      status: 400,
    };
    return NextResponse.json(error, { status: 400 });
  }

  // 依 type 分流
  try {
    if (payload.type === "draft") {
      const result = await writeDraftPdf(payload);
      return NextResponse.json(result);
    } else {
      // official
      const officialReq = payload as { type: "official" } & OfficialPdfRequest;
      if (!officialReq.supplements || !officialReq.signaturePage) {
        const error: LocalApiError = {
          error: "missing_official_fields",
          message: "official 類型需要 supplements 與 signaturePage 欄位",
          status: 400,
        };
        return NextResponse.json(error, { status: 400 });
      }
      const result = await writeOfficialPdf(officialReq);
      return NextResponse.json(result);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const error: LocalApiError = {
      error: "pdf_write_failed",
      message: `PDF 產出失敗：${message}`,
      status: 500,
    };
    return NextResponse.json(error, { status: 500 });
  }
}
