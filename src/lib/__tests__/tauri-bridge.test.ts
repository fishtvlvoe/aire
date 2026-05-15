import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("tauri-bridge", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("isTauriEnv returns true when invoke is a function", async () => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    vi.doMock("@tauri-apps/api/core", () => ({
      invoke: vi.fn(),
    }));

    const { isTauriEnv } = await import("../tauri-bridge");
    await expect(isTauriEnv()).resolves.toBe(true);
  });

  it("isTauriEnv returns false when invoke is undefined", async () => {
    vi.doMock("@tauri-apps/api/core", () => ({
      invoke: undefined,
    }));

    const { isTauriEnv } = await import("../tauri-bridge");
    await expect(isTauriEnv()).resolves.toBe(false);
  });

  it("safeInvoke uses mockInvoke in development browser env", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const mockInvoke = vi.fn().mockResolvedValue({ status: "none" });

    vi.doMock("@tauri-apps/api/core", () => ({
      invoke: undefined,
    }));
    vi.doMock("../mock-backend", () => ({
      mockInvoke,
    }));

    const { safeInvoke } = await import("../tauri-bridge");
    const result = await safeInvoke("get_license_status");

    expect(mockInvoke).toHaveBeenCalledWith("get_license_status", undefined);
    expect(result).toEqual({ status: "none" });
  });

  it("safeInvoke throws NotInTauriError in production browser env", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.doMock("@tauri-apps/api/core", () => ({
      invoke: undefined,
    }));

    const { safeInvoke, NotInTauriError } = await import("../tauri-bridge");

    await expect(safeInvoke("list_cases")).rejects.toBeInstanceOf(NotInTauriError);
  });

  it("safeInvoke delegates to invoke in Tauri env", async () => {
    (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    const mockInvoke = vi.fn().mockResolvedValue([{ id: "c1" }]);

    vi.doMock("@tauri-apps/api/core", () => ({
      invoke: mockInvoke,
    }));

    const { safeInvoke } = await import("../tauri-bridge");
    const result = await safeInvoke("list_cases");

    expect(mockInvoke).toHaveBeenCalledWith("list_cases", undefined);
    expect(result).toEqual([{ id: "c1" }]);
  });
});
