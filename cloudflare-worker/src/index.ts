import type { Env } from "./types";
import { handleRateLimitAndSanitize } from "./handlers/middleware";
import { handleActivate } from "./handlers/activate";
import { handleVerify } from "./handlers/verify";
import { handleLegalClauses } from "./handlers/legal-clauses";
import { handleRealtor } from "./handlers/realtor";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "https://app.aire.tw",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function handleOptions(): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

function wrapCors(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  const cors = corsHeaders();
  for (const [key, value] of Object.entries(cors)) {
    newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

function jsonResponse(status: number, body: { error: string }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return handleOptions();
    }

    const url = new URL(request.url);

    const executeRoute = async () => {
      if (request.method === "POST" && url.pathname === "/api/license/activate") {
        return handleActivate(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/license/verify") {
        return handleVerify(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/legal-clauses/sync") {
        return handleLegalClauses(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/realtor/verify") {
        return handleRealtor(request, env);
      } else {
        return jsonResponse(404, { error: "not_found" });
      }
    };

    const response = await handleRateLimitAndSanitize(request, env, executeRoute);
    return wrapCors(response);
  },
};
