import { NextResponse, type NextRequest } from "next/server";

interface StreetViewBody {
  lat?: number;
  lng?: number;
}

interface StreetViewMetadata {
  status: string;
}

export async function POST(request: NextRequest) {
  let body: StreetViewBody;
  try {
    body = (await request.json()) as StreetViewBody;
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  const { lat, lng } = body;

  if (
    lat === undefined || lng === undefined ||
    isNaN(lat) || isNaN(lng) ||
    lat < -90 || lat > 90 ||
    lng < -180 || lng > 180
  ) {
    return NextResponse.json({ error: "invalid coordinates" }, { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "street view not configured" }, { status: 503 });
  }

  try {
    const location = `${lat},${lng}`;

    // 先查 metadata 確認該位置有沒有街景（避免拿到灰色佔位圖）
    const metaUrl = new URL("https://maps.googleapis.com/maps/api/streetview/metadata");
    metaUrl.searchParams.set("location", location);
    metaUrl.searchParams.set("key", key);

    const metaResp = await fetch(metaUrl.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (!metaResp.ok) {
      return NextResponse.json({ error: "street view api error" }, { status: 502 });
    }

    const meta = (await metaResp.json()) as StreetViewMetadata;

    if (meta.status !== "OK") {
      return NextResponse.json({ error: "no street view found" }, { status: 404 });
    }

    // 取得 600×400 街景靜態圖
    const imgUrl = new URL("https://maps.googleapis.com/maps/api/streetview");
    imgUrl.searchParams.set("size", "600x400");
    imgUrl.searchParams.set("location", location);
    imgUrl.searchParams.set("key", key);

    const imgResp = await fetch(imgUrl.toString(), {
      signal: AbortSignal.timeout(15000),
    });

    if (!imgResp.ok) {
      return NextResponse.json({ error: "image download failed" }, { status: 502 });
    }

    const buffer = await imgResp.arrayBuffer();

    return new Response(buffer, {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[street-view] Error: ${message}`);
    return NextResponse.json({ error: "street view fetch failed" }, { status: 502 });
  }
}
