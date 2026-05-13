// GET /api/health — container liveness + Codex CLI status check

import { NextResponse } from "next/server";
import { checkCodexStatus } from "@/lib/codex-client";

export async function GET(): Promise<NextResponse> {
  const codex = await checkCodexStatus();

  return NextResponse.json(
    {
      status: "ok",
      codex,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
