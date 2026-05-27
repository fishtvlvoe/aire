import { NextRequest, NextResponse } from "next/server";
import { discoverAddressLocally } from "@/lib/server/local-address-discovery-proxy";
import type { ParcelInfo } from "@/lib/land-registry-api";

export const dynamic = "force-static";

interface DiscoveryRequest {
  address?: string;
  clientId?: string;
  secret?: string;
  allowMockFallback?: boolean;
}

interface CopAddressLookupResponse {
  STATUS?: number;
  RESPONSE?: Array<{
    ADDRESS?: string;
    BLDGREG?: {
      UNIT?: string;
      SEC?: string;
      NO?: string;
    } | null;
  }>;
}

function cityCodeFromAddress(address: string): string {
  if (address.startsWith("台北市")) return "A";
  if (address.startsWith("台中市")) return "B";
  if (address.startsWith("台南市")) return "D";
  if (address.startsWith("高雄市")) return "E";
  if (address.startsWith("新北市")) return "F";
  if (address.startsWith("桃園市")) return "H";
  return "A";
}

function parseCopResponse(address: string, payload: CopAddressLookupResponse): ParcelInfo[] {
  if (payload?.STATUS !== 1 || !Array.isArray(payload.RESPONSE)) {
    return [];
  }

  return payload.RESPONSE.flatMap((entry) => {
    const bldg = entry?.BLDGREG;
    if (!bldg) return [];
    const unit = String(bldg.UNIT ?? "").trim();
    const sec = String(bldg.SEC ?? "").trim();
    const no = String(bldg.NO ?? "").trim();
    if (!sec && !no) return [];
    return [
      {
        parcel_id: `${unit}-${sec}-${no}`,
        address: String(entry.ADDRESS ?? address),
        lot_number: sec,
        building_number: no,
        source: "cop_moi",
        trusted_for_pdf: true,
      } satisfies ParcelInfo,
    ];
  });
}

async function queryCopAddressLookup(input: {
  address: string;
  clientId: string;
  secret: string;
}): Promise<ParcelInfo[]> {
  const baseUrl = process.env.LAND_REGISTRY_COP_BASE_URL?.trim() || "https://cop.moi.gov.tw";
  const endpoint = `${baseUrl.replace(/\/+$/, "")}/BuildingNo/1.0/QueryByAddress`;
  const auth = Buffer.from(`${input.clientId}:${input.secret}`).toString("base64");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify([{ CITY: cityCodeFromAddress(input.address), ADDRESS: input.address }]),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as CopAddressLookupResponse;
  return parseCopResponse(input.address, payload);
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
  const clientId = String(payload.clientId ?? "").trim();
  const secret = String(payload.secret ?? "").trim();
  const allowMockFallback = payload.allowMockFallback !== false;

  if (address && clientId && secret) {
    try {
      const candidates = await queryCopAddressLookup({ address, clientId, secret });
      if (candidates.length > 0) {
        return NextResponse.json({
          status: "candidate_found",
          source: "cop_moi",
          candidates,
          errors: [],
          total_cost_cents: 0,
        });
      }
    } catch {
      // keep fallback path
    }
  }

  if (!allowMockFallback) {
    return NextResponse.json({
      status: "manual_required",
      source: "local_discovery",
      candidates: [],
      errors: [
        {
          source: "local_discovery",
          code: "cop_lookup_unavailable",
          message: "未取得可信候選，請人工確認地段、地號、建號",
        },
      ],
      total_cost_cents: 0,
    });
  }

  const discovery = await discoverAddressLocally(address);
  return NextResponse.json(discovery);
}
