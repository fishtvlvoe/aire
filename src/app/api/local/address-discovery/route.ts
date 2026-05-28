import { NextRequest, NextResponse } from "next/server";
import { discoverAddressLocally } from "@/lib/server/local-address-discovery-proxy";

// 本機地址 discovery proxy：在本機 standalone server 上直接呼叫 COP API。
// 設計依據：openspec/changes/browser-local-runtime-mvp/design.md Decision 5, Decision 6
// （舊版在 production 主動回 local_proxy_unavailable、Tauri 走 IPC — 已廢除）
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface DiscoveryRequest {
  address?: string;
  clientId?: string;
  secret?: string;
  allowMockFallback?: boolean;
}

export async function POST(request: NextRequest) {
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
