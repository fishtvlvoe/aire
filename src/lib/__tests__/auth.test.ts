import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/tauri-bridge", () => ({
  safeInvoke: vi.fn(),
}));

vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn(),
}));

import { safeInvoke } from "@/lib/tauri-bridge";
import { mockInvoke } from "@/lib/mock-backend";
import {
  exchangeDesktopBootstrapCode,
  getDeviceSessionStatus,
  getSession,
  isAuthenticated,
  login,
  logout,
} from "@/lib/auth";

const mockSafeInvoke = vi.mocked(safeInvoke);
const mockLocalInvoke = vi.mocked(mockInvoke);

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

  it("falls back to local desktop auth when native auth commands are missing", async () => {
    mockSafeInvoke.mockRejectedValue(new Error("Command login not found"));
    mockLocalInvoke.mockResolvedValue({
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
    expect(mockLocalInvoke).toHaveBeenCalledWith("login", {
      email: "admin@test.aire",
      password: "password",
    });
  });

  it("exchanges bootstrap code and reads device session status", async () => {
    mockSafeInvoke
      .mockResolvedValueOnce({
        success: true,
        user: { email: "admin@test.aire", role: "admin" },
        bootstrapOnly: true,
      })
      .mockResolvedValueOnce({
        status: "active",
        email: "admin@test.aire",
        persistedAt: "2026-05-25T00:00:00.000Z",
      });

    await expect(
      exchangeDesktopBootstrapCode("admin@test.aire", "OTC-ADMIN-2026"),
    ).resolves.toMatchObject({
      success: true,
      bootstrapOnly: true,
    });
    await expect(getDeviceSessionStatus()).resolves.toMatchObject({
      status: "active",
    });
    expect(mockSafeInvoke).toHaveBeenNthCalledWith(1, "exchange_desktop_bootstrap_code", {
      email: "admin@test.aire",
      code: "OTC-ADMIN-2026",
    });
    expect(mockSafeInvoke).toHaveBeenNthCalledWith(2, "get_device_session_status");
  });
});
