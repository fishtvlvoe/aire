import type { Env } from "../types";

interface LicenseRecord {
  status: "active" | "revoked" | "inactive";
  device_id?: string;
}

interface LegalClausesCache {
  timestamp: string;
  data: any;
}

function jsonResponse(status: number, body: any, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

export async function handleLegalClauses(request: Request, env: Env): Promise<Response> {
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

  // 2. Proxy request to OPCOS legal-clauses API
  try {
    const response = await fetch("https://opcos.aiver.me/v1/legal-clauses/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPCOS_API_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      
      // Save cache in background (LICENSES KV is globally writeable here)
      const cacheValue: LegalClausesCache = {
        timestamp: new Date().toISOString(),
        data,
      };
      await env.LICENSES.put("cache:legal-clauses", JSON.stringify(cacheValue));

      return jsonResponse(200, data);
    }

    throw new Error(`Downstream API returned status ${response.status}`);
  } catch (error) {
    // 3. Fallback to cache if downstream fails
    try {
      const cache = await env.LICENSES.get<LegalClausesCache>("cache:legal-clauses", "json");
      if (cache && cache.timestamp && cache.data) {
        const cacheTime = new Date(cache.timestamp).getTime();
        const now = new Date().getTime();
        const diffMs = now - cacheTime;

        if (diffMs < 24 * 60 * 60 * 1000) { // 24 hours
          return jsonResponse(200, cache.data, { "X-Cache": "stale" });
        }
      }
    } catch (cacheErr) {
      // Ignore cache fetch errors
    }

    // 4. Sanitized error response
    return jsonResponse(502, {
      error: "downstream_error",
      message: "Failed to synchronize legal clauses",
    });
  }
}
