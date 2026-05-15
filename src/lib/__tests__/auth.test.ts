import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/tauri-bridge", () => ({
  safeInvoke: vi.fn(),
}));

import { safeInvoke } from "@/lib/tauri-bridge";
import { getSession, isAuthenticated, login, logout } from "@/lib/auth";

const mockSafeInvoke = vi.mocked(safeInvoke);

describe("auth helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls login command with email/password", async () => {
    mockSafeInvoke.mockResolvedValue({
      success: true,
      user: { email: "admin@test.aire", role: "admin" },
    });

    await expect(login("admin@test.aire", "password")).resolves.toEqual({
      success: true,
      user: { email: "admin@test.aire", role: "admin" },
    });
    expect(mockSafeInvoke).toHaveBeenCalledWith("login", {
      email: "admin@test.aire",
      password: "password",
    });
  });

  it("calls logout command", async () => {
    mockSafeInvoke.mockResolvedValue({ success: true });

    await expect(logout()).resolves.toEqual({ success: true });
    expect(mockSafeInvoke).toHaveBeenCalledWith("logout");
  });

  it("gets session and maps auth status", async () => {
    mockSafeInvoke.mockResolvedValueOnce({
      authenticated: true,
      user: { email: "admin@test.aire", role: "admin" },
    });
    mockSafeInvoke.mockResolvedValueOnce({
      authenticated: false,
    });

    await expect(getSession()).resolves.toEqual({
      authenticated: true,
      user: { email: "admin@test.aire", role: "admin" },
    });
    await expect(isAuthenticated()).resolves.toBe(false);

    expect(mockSafeInvoke).toHaveBeenNthCalledWith(1, "get_session");
    expect(mockSafeInvoke).toHaveBeenNthCalledWith(2, "get_session");
  });
});
