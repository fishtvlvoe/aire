/**
 * GET    /api/local/cases/[id]  — 讀取單一案件
 * PUT    /api/local/cases/[id]  — 更新案件（部分更新）
 *
 * 設計依據：openspec/changes/browser-local-runtime-mvp/design.md Decision 5
 * 型別來源：contract.ts（UpdateCaseInput）
 */
import { NextRequest, NextResponse } from "next/server";
import type { UpdateCaseInput } from "@/lib/local-api/contract";
import { getCase, updateCase } from "@/lib/local-api/cases-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

/** GET /api/local/cases/[id] → CaseRow */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const row = await getCase(id);

  if (!row) {
    return NextResponse.json(
      { error: "not_found", message: `案件 ${id} 不存在` },
      { status: 404 },
    );
  }

  return NextResponse.json(row);
}

/** PUT /api/local/cases/[id] → CaseRow */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let input: UpdateCaseInput;
  try {
    input = (await request.json()) as UpdateCaseInput;
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "請提供有效的 JSON body" },
      { status: 400 },
    );
  }

  const updated = await updateCase(id, input);

  if (!updated) {
    return NextResponse.json(
      { error: "not_found", message: `案件 ${id} 不存在` },
      { status: 404 },
    );
  }

  return NextResponse.json(updated);
}
