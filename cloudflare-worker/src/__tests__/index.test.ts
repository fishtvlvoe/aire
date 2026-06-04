import { describe, it, expect, vi } from "vitest";
import worker from "../index";

describe("CF Worker router and CORS", () => {
  const mockEnv: any = {
    LICENSES: {
      get: vi.fn(),
      put: vi.fn(),
    },
    OPCOS_API_TOKEN: "mock-token",
  };

  it("should handle OPTIONS requests with CORS headers", async () => {
    const request = new Request("https://aire.opcos.me/api/legal-clauses/sync", {
      method: "OPTIONS",
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://app.aire.tw");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Authorization");
  });

  it("should route POST /api/legal-clauses/sync", async () => {
    // Should fail with 401 because header is missing, but route exists
    const request = new Request("https://aire.opcos.me/api/legal-clauses/sync", {
      method: "POST",
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(401);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://app.aire.tw");
  });

  it("should route POST /api/realtor/verify", async () => {
    const request = new Request("https://aire.opcos.me/api/realtor/verify", {
      method: "POST",
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(401);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://app.aire.tw");
  });
});
