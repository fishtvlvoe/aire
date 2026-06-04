import { describe, it, expect, vi, beforeEach } from "vitest";
import worker from "../index";

describe("CF Worker Rate Limiting and Error Sanitization", () => {
  let mockEnv: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockEnv = {
      LICENSES: {
        get: vi.fn(),
        put: vi.fn(),
      },
      OPCOS_API_TOKEN: "mock-token",
    };
  });

  it("should return 429 with Retry-After: 60 if IP rate limit is exceeded", async () => {
    // Mock KV to return 100 for IP rate limit
    mockEnv.LICENSES.get.mockImplementation(async (key: string) => {
      if (key.startsWith("rate:ip:")) {
        return "100";
      }
      return null;
    });

    const request = new Request("https://aire.opcos.me/api/legal-clauses/sync", {
      method: "POST",
      headers: {
        "CF-Connecting-IP": "1.2.3.4",
      },
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
  });

  it("should return 429 if License rate limit is exceeded", async () => {
    // Mock license to be active, but daily request limit exceeded
    mockEnv.LICENSES.get.mockImplementation(async (key: string) => {
      if (key === "license:valid-license") {
        return { status: "active" };
      }
      if (key.startsWith("rate:license:valid-license:")) {
        return "1000";
      }
      return null;
    });

    const request = new Request("https://aire.opcos.me/api/legal-clauses/sync", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-license",
        "CF-Connecting-IP": "1.2.3.4",
      },
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(429);
  });

  it("should notify admin if license abuse persists for 3 consecutive days", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockEnv.LICENSES.get.mockImplementation(async (key: string) => {
      if (key === "license:valid-license") {
        return { status: "active" };
      }
      if (key.startsWith("rate:license:valid-license:")) {
        return "1000"; // Trigger rate limit
      }
      if (key.includes("consec_days")) {
        return "2"; // 2 days before today, making today the 3rd consecutive day
      }
      return null;
    });

    const request = new Request("https://aire.opcos.me/api/legal-clauses/sync", {
      method: "POST",
      headers: {
        "Authorization": "Bearer valid-license",
        "CF-Connecting-IP": "1.2.3.4",
      },
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(429);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("ADMIN ALERT: License valid-license exceeded limit for 3 consecutive days"));
  });

  it("should sanitize unhandled downstream exceptions into structured 502 error", async () => {
    // Mock handleVerify to throw an error
    mockEnv.LICENSES.get.mockImplementation(async () => {
      throw new Error("Secret database breakdown");
    });

    const request = new Request("https://aire.opcos.me/api/license/verify", {
      method: "POST",
      body: JSON.stringify({ license_key: "abc", device_id: "def" }),
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toEqual({
      error: "downstream_error",
      message: "An internal downstream error occurred",
    });
  });
});
