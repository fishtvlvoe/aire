import { NextRequest, NextResponse } from "next/server";
import { discoverAddressLocally } from "@/lib/server/local-address-discovery-proxy";

// 本 route 只供本機 Web dev/E2E 使用；Tauri production build 走 IPC，
// 因此不可宣告 force-dynamic，避免 static export 被 API route 擋住。
export const dynamic = "force-static";
export const runtime = "nodejs";

interface DiscoveryRequest {
  address?: string;
  clientId?: string;
  secret?: string;
  allowMockFallback?: boolean;
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({
      status: "manual_required",
      source: "local_discovery",
      candidates: [],
      errors: [
        {
          source: "local_discovery",
          code: "local_proxy_unavailable",
          message: "請使用 AIRE 桌面版完成資料補齊",
        },
      ],
      total_cost_cents: 0,
    });
  }

  let payload: DiscoveryRequest;
  try {
    payload = (await request.json()) as DiscoveryRequest;
  } catch {
    return NextResponse.json(
      {
        status: "manual_required",
        source: "local_discovery",
        candidates: [],
        errors: [
          {
            source: "local_discovery",
            code: "invalid_payload",
            message: "請提供有效的 JSON body",
          },
        ],
        total_cost_cents: 0,
      },
      { status: 400 },
    );
  }

  const address = String(payload.address ?? "").trim();
  const discovery = await discoverAddressLocally(address);
  return NextResponse.json(discovery);
}
