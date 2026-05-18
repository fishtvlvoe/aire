import type { Env, LicenseRecord } from "../types";

type ActivateRequestBody = {
  license_key: string;
  device_id: string;
  device_name: string;
  os_version: string;
};

type ActivateSuccessResponse = {
  status: "active";
  token: string;
  valid_until: null;
};

type ErrorResponse = { error: string };

function jsonResponse(status: number, body: ActivateSuccessResponse | ErrorResponse): Response {
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

function parseActivateBody(value: unknown): ActivateRequestBody | null {
  if (!isRecord(value)) return null;

  const license_key = value.license_key;
  const device_id = value.device_id;
  const device_name = value.device_name;
  const os_version = value.os_version;

  if (
    typeof license_key !== "string" ||
    typeof device_id !== "string" ||
    typeof device_name !== "string" ||
    typeof os_version !== "string"
  ) {
    return null;
  }

  return { license_key, device_id, device_name, os_version };
}

export async function handleActivate(request: Request, env: Env): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonResponse(400, { error: "invalid_request" });
  }

  const body = parseActivateBody(rawBody);
  if (!body) {
    return jsonResponse(400, { error: "invalid_request" });
  }

  const kvKey = `license:${body.license_key}`;
  const record = await env.LICENSES.get<LicenseRecord>(kvKey, "json");

  if (!record || record.status === "revoked") {
    return jsonResponse(404, { error: "invalid_license" });
  }

  if (record.status === "active") {
    if (record.device_id === body.device_id) {
      return jsonResponse(200, {
        status: "active",
        token: body.license_key,
        valid_until: null,
      });
    }

    return jsonResponse(409, { error: "device_locked" });
  }

  const updated: LicenseRecord = {
    ...record,
    status: "active",
    device_id: body.device_id,
    device_name: body.device_name,
    os_version: body.os_version,
    activated_at: new Date().toISOString(),
  };

  await env.LICENSES.put(kvKey, JSON.stringify(updated));

  return jsonResponse(200, {
    status: "active",
    token: body.license_key,
    valid_until: null,
  });
}
