import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleLegalClauses } from "../legal-clauses";

describe("handleLegalClauses", () => {
  let mockEnv: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockEnv = {
      LICENSES: {
        get: vi.fn(),
        put: vi.fn(),
      },
      OPCOS_API_TOKEN: "test-opcos-token",
    };
  });

  it("should return 401 if Authorization header is missing", async () => {
    const request = new Request("https://aire.opcos.me/api/legal-clauses/sync", {
      method: "POST",
    });

    const response = await handleLegalClauses(request, mockEnv);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("should return 401 if license is invalid or inactive", async () => {
    mockEnv.LICENSES.get.mockResolvedValue(null);

    const request = new Request("https://aire.opcos.me/api/legal-clauses/sync", {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid-license",
      },
    });

    const response = await handleLegalClauses(request, mockEnv);
    expect(response.status).toBe(401);
    expect(mockEnv.LICENSES.get).toHaveBeenCalledWith("license:invalid-license", "json");
  });

  it("should forward request to OPCOS legal-clauses endpoint and return list on success", async () => {
    mockEnv.LICENSES.get.mockResolvedValue({ status: "active" });

    const mockClauses = [{ id: "1", content: "Test Clause" }];
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockClauses), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const request = new Request("https://aire.opcos.me/api/legal-clauses/sync", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-license",
      },
    });

    const response = await handleLegalClauses(request, mockEnv);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockClauses);

    expect(fetchSpy).toHaveBeenCalledWith("https://opcos.aiver.me/v1/legal-clauses/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-opcos-token",
      },
    });
  });

  it("should return stale cache if downstream API fails and cache exists within 24h", async () => {
    mockEnv.LICENSES.get.mockImplementation(async (key: string, format: string) => {
      if (key === "license:valid-license") return { status: "active" };
      if (key === "cache:legal-clauses") {
        return {
          timestamp: new Date().toISOString(),
          data: [{ id: "1", content: "Cached Clause" }],
        };
      }
      return null;
    });

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const request = new Request("https://aire.opcos.me/api/legal-clauses/sync", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-license",
      },
    });

    const response = await handleLegalClauses(request, mockEnv);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Cache")).toBe("stale");
    const body = await response.json();
    expect(body).toEqual([{ id: "1", content: "Cached Clause" }]);
  });

  it("should sanitize error and return 502 if downstream API fails and no cache exists", async () => {
    mockEnv.LICENSES.get.mockImplementation(async (key: string) => {
      if (key === "license:valid-license") return { status: "active" };
      return null;
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Internal Server Error with stack trace", { status: 500 })
    );

    const request = new Request("https://aire.opcos.me/api/legal-clauses/sync", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-license",
      },
    });

    const response = await handleLegalClauses(request, mockEnv);
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toEqual({
      error: "downstream_error",
      message: "Failed to synchronize legal clauses",
    });
  });
});
