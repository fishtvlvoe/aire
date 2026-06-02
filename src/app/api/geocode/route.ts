import { NextResponse, type NextRequest } from "next/server";
import { geocodeAddress } from "@/lib/map-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface GeocodeBody {
  address?: string;
}

export async function POST(request: NextRequest) {
  let body: GeocodeBody;
  try {
    body = (await request.json()) as GeocodeBody;
  } catch {
    return NextResponse.json({ error: "invalid_request_body" }, { status: 400 });
  }

  const address = body.address?.trim();
  if (!address) {
    return NextResponse.json({ error: "address_required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await geocodeAddress(address));
  } catch (error) {
    return NextResponse.json(
      {
        error: "geocode_failed",
        message: error instanceof Error ? error.message : "geocode failed",
      },
      { status: 502 },
    );
  }
}
