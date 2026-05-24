import { NextRequest, NextResponse } from "next/server";

import { evaluateLicenseActivation } from "./license-activation";

export const dynamic = "force-static";

export async function POST(request: NextRequest) {
  let body: { serialKey?: unknown; deviceId?: unknown };
  try {
    body = (await request.json()) as { serialKey?: unknown; deviceId?: unknown };
  } catch {
    return NextResponse.json({ error: "無效的請求格式" }, { status: 400 });
  }

  const result = evaluateLicenseActivation(body);
  return NextResponse.json(result.body, { status: result.status });
}
