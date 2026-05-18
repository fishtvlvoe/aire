import type { Env } from "./types";
import { handleActivate } from "./handlers/activate";
import { handleVerify } from "./handlers/verify";

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
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/license/activate") {
      return handleActivate(request, env);
    }

    if (request.method === "POST" && url.pathname === "/api/license/verify") {
      return handleVerify(request, env);
    }

    return jsonResponse(404, { error: "not_found" });
  },
};
