import { NextResponse, type NextRequest } from "next/server";

interface StreetViewBody {
  lat?: number;
  lng?: number;
}

interface MapillaryImage {
  id: string;
  thumb_2048_url: string;
}

interface MapillaryResponse {
  data?: MapillaryImage[];
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

  const token = process.env.MAPILLARY_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "street view not configured" }, { status: 503 });
  }

  try {
    const apiUrl = new URL("https://graph.mapillary.com/images");
    apiUrl.searchParams.set("fields", "id,thumb_2048_url");
    apiUrl.searchParams.set("access_token", token);
    // Mapillary closeto uses lon,lat order
    apiUrl.searchParams.set("closeto", `${lng},${lat}`);
    apiUrl.searchParams.set("radius", "100");
    apiUrl.searchParams.set("limit", "1");

    const metaResp = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(15000),
    });

    if (!metaResp.ok) {
      return NextResponse.json({ error: "mapillary api error" }, { status: 502 });
    }

    const meta = (await metaResp.json()) as MapillaryResponse;

    if (!meta.data?.length || !meta.data[0].thumb_2048_url) {
      return NextResponse.json({ error: "no street view found" }, { status: 404 });
    }

    const imageResp = await fetch(meta.data[0].thumb_2048_url, {
      signal: AbortSignal.timeout(20000),
    });

    if (!imageResp.ok) {
      return NextResponse.json({ error: "image download failed" }, { status: 502 });
    }

    const buffer = await imageResp.arrayBuffer();
    const contentType = imageResp.headers.get("Content-Type") ?? "image/jpeg";

    return new Response(buffer, {
      headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=86400" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[street-view] Error: ${message}`);
    return NextResponse.json({ error: "street view fetch failed" }, { status: 502 });
  }
}
