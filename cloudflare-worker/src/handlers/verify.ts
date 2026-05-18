import type { Env, LicenseRecord } from "../types";

type VerifyRequestBody = {
  license_key: string;
  device_id: string;
};

type VerifySuccessResponse = {
  status: "active";
  valid_until: null;
  last_verified_at: string;
};

type ErrorResponse = { error: string };

function jsonResponse(status: number, body: VerifySuccessResponse | ErrorResponse): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseVerifyBody(value: unknown): VerifyRequestBody | null {
  if (!isRecord(value)) return null;

  const license_key = value.license_key;
  const device_id = value.device_id;

  if (typeof license_key !== "string" || typeof device_id !== "string") {
    return null;
  }

  return { license_key, device_id };
}

export async function handleVerify(request: Request, env: Env): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonResponse(400, { error: "invalid_request" });
  }

  const body = parseVerifyBody(rawBody);
  if (!body) {
    return jsonResponse(400, { error: "invalid_request" });
  }

  const kvKey = `license:${body.license_key}`;
  const record = await env.LICENSES.get<LicenseRecord>(kvKey, "json");

  if (!record || record.status !== "active") {
    return jsonResponse(404, { error: "invalid_license" });
  }

  if (record.device_id !== body.device_id) {
    return jsonResponse(403, { error: "device_mismatch" });
  }

  return jsonResponse(200, {
    status: "active",
    valid_until: null,
    last_verified_at: new Date().toISOString(),
  });
}
