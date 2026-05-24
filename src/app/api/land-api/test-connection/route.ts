import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";

const LAND_API_AUTH_ENDPOINT = "https://cop.land.moi.gov.tw/Landing/api/Auth/Token";
const TIMEOUT_MS = 8000;

export async function POST(request: NextRequest) {
  let body: { clientId?: string; secret?: string };
  try {
    body = (await request.json()) as { clientId?: string; secret?: string };
  } catch {
    return NextResponse.json({ success: false, error: "無效的請求格式" }, { status: 400 });
  }

  const { clientId, secret } = body;

  if (!clientId || !secret) {
    return NextResponse.json({ success: false, error: "clientId 和 secret 為必填" }, { status: 400 });
  }

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let upstream: Response;
    try {
      upstream = await fetch(LAND_API_AUTH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret: secret }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const latency_ms = Date.now() - start;

    if (upstream.ok) {
      return NextResponse.json({ success: true, latency_ms });
    }

    return NextResponse.json({ success: false, latency_ms, error: "認證失敗" });
  } catch (err) {
    const latency_ms = Date.now() - start;
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ success: false, latency_ms, error: "連線逾時" });
    }
    return NextResponse.json({ success: false, latency_ms, error: "連線失敗" });
  }
}
