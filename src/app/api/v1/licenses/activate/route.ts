import { NextRequest, NextResponse } from "next/server";

const ALREADY_USED_KEYS = new Set(["AIRE-TEST-USED-001"]);

export async function POST(request: NextRequest) {
  let body: { serialKey?: string; deviceId?: string };
  try {
    body = (await request.json()) as { serialKey?: string; deviceId?: string };
  } catch {
    return NextResponse.json({ error: "無效的請求格式" }, { status: 400 });
  }

  const { serialKey } = body;

  if (!serialKey || typeof serialKey !== "string") {
    return NextResponse.json({ error: "MISSING_KEY" }, { status: 400 });
  }

  if (!serialKey.startsWith("AIRE-")) {
    return NextResponse.json({ error: "INVALID_KEY" }, { status: 422 });
  }

  if (ALREADY_USED_KEYS.has(serialKey)) {
    return NextResponse.json({ error: "ALREADY_ACTIVATED_OTHER_DEVICE" }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
