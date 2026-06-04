import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleRealtor } from "../realtor";

describe("handleRealtor", () => {
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
    const request = new Request("https://aire.opcos.me/api/realtor/verify", {
      method: "POST",
      body: JSON.stringify({ license_number: "12345" }),
    });

    const response = await handleRealtor(request, mockEnv);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("should return 401 if license is invalid or inactive", async () => {
    mockEnv.LICENSES.get.mockResolvedValue(null);

    const request = new Request("https://aire.opcos.me/api/realtor/verify", {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid-license",
      },
      body: JSON.stringify({ license_number: "12345" }),
    });

    const response = await handleRealtor(request, mockEnv);
    expect(response.status).toBe(401);
  });

  it("should return 400 if request body is invalid", async () => {
    mockEnv.LICENSES.get.mockResolvedValue({ status: "active" });

    const request = new Request("https://aire.opcos.me/api/realtor/verify", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-license",
      },
      body: JSON.stringify({}), // missing license_number
    });

    const response = await handleRealtor(request, mockEnv);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "invalid_request" });
  });

  it("should forward request to OPCOS realtor endpoint and return result on success", async () => {
    mockEnv.LICENSES.get.mockResolvedValue({ status: "active" });

    const mockResult = { valid: true, name: "John Doe" };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const request = new Request("https://aire.opcos.me/api/realtor/verify", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-license",
      },
      body: JSON.stringify({ license_number: "12345" }),
    });

    const response = await handleRealtor(request, mockEnv);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockResult);

    expect(fetchSpy).toHaveBeenCalledWith("https://opcos.me/api/realtor/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-opcos-token",
      },
      body: JSON.stringify({ license_number: "12345" }),
    });
  });

  it("should sanitize error and return 502 if downstream API fails", async () => {
    mockEnv.LICENSES.get.mockResolvedValue({ status: "active" });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Downstream breakdown", { status: 500 })
    );

    const request = new Request("https://aire.opcos.me/api/realtor/verify", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-license",
      },
      body: JSON.stringify({ license_number: "12345" }),
    });

    const response = await handleRealtor(request, mockEnv);
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toEqual({
      error: "downstream_error",
      message: "Failed to verify realtor license",
    });
  });
});
