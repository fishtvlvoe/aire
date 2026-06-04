import type { Env } from "../types";

interface LicenseRecord {
  status: "active" | "revoked" | "inactive";
  device_id?: string;
}

function jsonResponse(status: number, body: any): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function handleRealtor(request: Request, env: Env): Promise<Response> {
  // 1. Authenticate the license token (jwt)
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse(401, { error: "unauthorized" });
  }

  const licenseKey = authHeader.substring(7);
  let record: LicenseRecord | null = null;
  try {
    record = await env.LICENSES.get<LicenseRecord>(`license:${licenseKey}`, "json");
  } catch (err) {
    // Ignore and fail auth
  }

  if (!record || record.status !== "active") {
    return jsonResponse(401, { error: "unauthorized" });
  }

  // 2. Parse request body and validate
  let requestData: any;
  try {
    requestData = await request.json();
  } catch (e) {
    return jsonResponse(400, { error: "invalid_request" });
  }

  if (!requestData || typeof requestData.license_number !== "string" || requestData.license_number.trim() === "") {
    return jsonResponse(400, { error: "invalid_request" });
  }

  // 3. Forward request to OPCOS realtor verification endpoint
  try {
    const response = await fetch("https://opcos.me/api/realtor/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPCOS_API_TOKEN}`,
      },
      body: JSON.stringify({
        license_number: requestData.license_number,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return jsonResponse(200, data);
    }

    throw new Error(`Downstream API returned status ${response.status}`);
  } catch (error) {
    return jsonResponse(502, {
      error: "downstream_error",
      message: "Failed to verify realtor license",
    });
  }
}
