import type { Env } from "../types";

function jsonResponse(status: number, body: any, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

export async function handleRateLimitAndSanitize(
  request: Request,
  env: Env,
  next: () => Promise<Response>
): Promise<Response> {
  // 1. IP Rate Limiting (100 req/min)
  const ip = request.headers.get("CF-Connecting-IP") || "127.0.0.1";
  const minute = Math.floor(Date.now() / 60000);
  const ipKey = `rate:ip:${ip}:${minute}`;

  try {
    let ipCount = 0;
    const ipVal = await env.LICENSES.get(ipKey);
    if (ipVal) {
      ipCount = parseInt(ipVal, 10);
    }

    if (ipCount >= 100) {
      console.warn(`IP rate limit exceeded for ${ip}`);
      return jsonResponse(429, { error: "rate_limit_exceeded", message: "IP rate limit exceeded" }, {
        "Retry-After": "60"
      });
    }

    await env.LICENSES.put(ipKey, String(ipCount + 1), { expirationTtl: 60 });
  } catch (err) {
    // KV failure shouldn't block the request, but log it
    console.error("IP rate limiter KV error:", err);
  }

  // 2. License Rate Limiting (1000 req/day)
  let licenseKey: string | null = null;
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    licenseKey = authHeader.substring(7);
  }

  if (licenseKey) {
    const today = new Date().toISOString().split("T")[0];
    const licKey = `rate:license:${licenseKey}:${today}`;

    try {
      let licCount = 0;
      const licVal = await env.LICENSES.get(licKey);
      if (licVal) {
        licCount = parseInt(licVal, 10);
      }

      if (licCount >= 1000) {
        // Exceeded, check consecutive days for admin alert
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const yesterdayKey = `rate:license:${licenseKey}:${yesterday}`;
        const yesterdayVal = await env.LICENSES.get(yesterdayKey);
        
        if (yesterdayVal && parseInt(yesterdayVal, 10) >= 1000) {
          const consecKey = `rate:license:${licenseKey}:consec_days`;
          const consecVal = await env.LICENSES.get(consecKey);
          let consecDays = consecVal ? parseInt(consecVal, 10) : 1;
          
          consecDays += 1;
          await env.LICENSES.put(consecKey, String(consecDays), { expirationTtl: 86400 * 7 });

          if (consecDays >= 3) {
            console.error(`ADMIN ALERT: License ${licenseKey} exceeded limit for 3 consecutive days (${consecDays} days)`);
          }
        }

        return jsonResponse(429, { error: "rate_limit_exceeded", message: "License daily limit exceeded" });
      }

      await env.LICENSES.put(licKey, String(licCount + 1), { expirationTtl: 86400 * 2 });
    } catch (err) {
      console.error("License rate limiter KV error:", err);
    }
  }

  // 3. Downstream Error Sanitization
  try {
    return await next();
  } catch (error) {
    console.error("Unhandled exception sanitizing:", error);
    return jsonResponse(502, {
      error: "downstream_error",
      message: "An internal downstream error occurred",
    });
  }
}
