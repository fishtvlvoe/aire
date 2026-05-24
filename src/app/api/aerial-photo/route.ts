import { NextResponse, type NextRequest } from "next/server";
import { fetchAerialMap } from "@/lib/nlsc-aerial-map";

export const dynamic = "force-static";

interface AerialPhotoBody {
  lat?: number;
  lng?: number;
  zoom?: number;
}

export async function POST(request: NextRequest) {
  let body: AerialPhotoBody;
  try {
    body = (await request.json()) as AerialPhotoBody;
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  const { lat, lng, zoom = 17 } = body;

  if (
    lat === undefined || lng === undefined ||
    isNaN(lat) || isNaN(lng) ||
    lat < -90 || lat > 90 ||
    lng < -180 || lng > 180
  ) {
    return NextResponse.json({ error: "invalid coordinates" }, { status: 400 });
  }

  const bytes = await fetchAerialMap({ lat, lng, zoom });

  if (bytes.length === 0) {
    return NextResponse.json({ error: "map fetch failed" }, { status: 502 });
  }

  return new Response(Buffer.from(bytes), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
  });
}
