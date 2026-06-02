import { NextResponse } from "next/server";
import { queryNearbyAmenitiesWithGoogleFallback, summarizeNearbyAmenities } from "@/lib/overpass-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { lat?: unknown; lng?: unknown; radiusM?: unknown };
    const lat = typeof body.lat === "number" ? body.lat : Number(body.lat);
    const lng = typeof body.lng === "number" ? body.lng : Number(body.lng);
    const radiusM = typeof body.radiusM === "number" ? body.radiusM : Number(body.radiusM ?? 5000);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "invalid_coordinates", message: "lat/lng are required numbers" },
        { status: 400 },
      );
    }

    const amenities = await queryNearbyAmenitiesWithGoogleFallback({
      lat,
      lng,
      radiusM: Number.isFinite(radiusM) ? radiusM : 5000,
      googleApiKey: process.env.GOOGLE_MAPS_API_KEY,
    });

    return NextResponse.json(summarizeNearbyAmenities(amenities));
  } catch (error) {
    return NextResponse.json(
      {
        error: "nearby_amenities_failed",
        message: error instanceof Error ? error.message : "nearby amenities failed",
      },
      { status: 500 },
    );
  }
}
