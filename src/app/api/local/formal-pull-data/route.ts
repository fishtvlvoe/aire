import { NextRequest, NextResponse } from "next/server";
import { pullFormalRegistryLocally, type LocalFormalPullInput } from "@/lib/server/local-formal-pull-proxy";

export const dynamic = "force-static";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "local_proxy_unavailable", message: "請使用 AIRE 桌面版完成正式資料匯入" },
      { status: 400 },
    );
  }

  let payload: LocalFormalPullInput;
  try {
    payload = (await request.json()) as LocalFormalPullInput;
  } catch {
    return NextResponse.json(
      { error: "invalid_payload", message: "請提供有效的 JSON body" },
      { status: 400 },
    );
  }

  try {
    const result = await pullFormalRegistryLocally(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "local_formal_pull_failed",
        message: error instanceof Error ? error.message : "正式資料匯入失敗",
      },
      { status: 400 },
    );
  }
}
