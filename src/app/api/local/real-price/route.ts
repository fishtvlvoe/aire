import { NextResponse } from "next/server";
import { queryTwinkleRealPrice } from "@/lib/server/twinkle-real-price";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      district?: unknown;
      keyword?: unknown;
      limit?: unknown;
      address?: unknown;
    };

    const district = typeof body.district === "string" ? body.district.trim() : "";
    const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const limit = typeof body.limit === "number" && Number.isFinite(body.limit)
      ? Math.max(1, Math.min(50, Math.trunc(body.limit)))
      : 20;

    if (!district || !keyword) {
      return NextResponse.json({ message: "district 與 keyword 為必填" }, { status: 400 });
    }

    const records = await queryTwinkleRealPrice(district, keyword, limit, address);
    return NextResponse.json({ records });
  } catch (error) {
    const message = error instanceof Error ? error.message : "real price query failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
