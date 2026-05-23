import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const STORE_PATH = join(process.cwd(), ".aire-dev", "branding-text-settings.json");

const BRAND_TEXT_KEYS = [
  "agent_name",
  "agent_cert_no",
  "company_name",
  "company_license_no",
  "company_address",
  "company_phone",
  "realtor_name",
] as const;

type BrandTextKey = (typeof BRAND_TEXT_KEYS)[number];
type BrandTextSettings = Partial<Record<BrandTextKey, string>>;

function normalizeSettings(value: unknown): BrandTextSettings {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const normalized: BrandTextSettings = {};
  for (const key of BRAND_TEXT_KEYS) {
    const raw = source[key];
    normalized[key] = typeof raw === "string" ? raw : "";
  }
  return normalized;
}

async function readSettings(): Promise<BrandTextSettings> {
  try {
    return normalizeSettings(JSON.parse(await readFile(STORE_PATH, "utf8")));
  } catch {
    return normalizeSettings({});
  }
}

async function writeSettings(settings: BrandTextSettings): Promise<void> {
  await mkdir(dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, `${JSON.stringify(normalizeSettings(settings), null, 2)}\n`, "utf8");
}

export async function GET() {
  return NextResponse.json(await readSettings());
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  const payload =
    body && typeof body === "object" && "settings" in body
      ? (body as { settings?: unknown }).settings
      : body;
  const current = await readSettings();
  const next = { ...current, ...normalizeSettings(payload) };
  await writeSettings(next);
  return NextResponse.json(next);
}
