import "@testing-library/jest-dom/vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getSession: vi.fn(),
}));

import { useAuth } from "@/hooks/useAuth";
import { getSession, login, logout } from "@/lib/auth";

const mockGetSession = vi.mocked(getSession);
const mockLogin = vi.mocked(login);
const mockLogout = vi.mocked(logout);

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads initial session and becomes authenticated", async () => {
    mockGetSession.mockResolvedValue({
      authenticated: true,
      user: { email: "admin@test.aire", role: "admin" },
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ email: "admin@test.aire", role: "admin" });
  });

  it("handles login error and keeps unauthenticated state", async () => {
    mockGetSession.mockResolvedValue({ authenticated: false });
    mockLogin.mockRejectedValue(new Error("INVALID_CREDENTIALS"));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.login("wrong@example.com", "wrong");
      }),
    ).rejects.toThrow("INVALID_CREDENTIALS");

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("logs out and clears user", async () => {
    mockGetSession.mockResolvedValue({
      authenticated: true,
      user: { email: "admin@test.aire", role: "admin" },
    });
    mockLogout.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
