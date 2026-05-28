/**
 * GET  /api/local/cases  — 列出所有案件
 * POST /api/local/cases  — 建立新案件
 *
 * 設計依據：openspec/changes/browser-local-runtime-mvp/design.md Decision 5
 * 型別來源：contract.ts（ListCasesResponse / CreateCaseInput）
 */
import { NextRequest, NextResponse } from "next/server";
import type { CreateCaseInput, ListCasesResponse } from "@/lib/local-api/contract";
import { createCase, listCases } from "@/lib/local-api/cases-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/local/cases → ListCasesResponse */
export async function GET() {
  const cases = await listCases();
  return NextResponse.json({ cases } satisfies ListCasesResponse);
}

/** POST /api/local/cases → CaseRow */
export async function POST(request: NextRequest) {
  let input: CreateCaseInput;
  try {
    input = (await request.json()) as CreateCaseInput;
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "請提供有效的 JSON body" },
      { status: 400 },
    );
  }

  // 基本欄位驗證
  if (!input.property_type || !input.land_lot_no || !input.address) {
    return NextResponse.json(
      {
        error: "bad_request",
        message: "缺少必要欄位：property_type、land_lot_no、address",
      },
      { status: 400 },
    );
  }

  const created = await createCase(input);
  return NextResponse.json(created, { status: 201 });
}
