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

  it("safeInvoke 在 production 非 Tauri：MVP command 走 Node API（不拋 NotInTauriError）", async () => {
    // Wave 3：production 非 Tauri → 路由 3（Node 本機 API），list_cases 是 MVP command。
    // 會嘗試 fetch /api/local/cases，在 jsdom 環境下 fetch 失敗，但錯誤不是 NotInTauriError。
    vi.stubEnv("NODE_ENV", "production");
    vi.doMock("@tauri-apps/api/core", () => ({
      invoke: undefined,
    }));
    // mock localApiFetch → 模擬 middleware 通過，回傳案件清單
    vi.doMock("../local-api/client", () => ({
      localApiFetch: vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ cases: [] }),
      }),
    }));

    const { safeInvoke, NotInTauriError } = await import("../tauri-bridge");

    // list_cases 是 MVP command → 走 Node API，不拋 NotInTauriError
    const result = await safeInvoke("list_cases");
    expect(result).toEqual([]);
    // 確認舊的 NotInTauriError 不再被拋出
    await expect(safeInvoke("list_cases")).resolves.not.toBeInstanceOf(NotInTauriError);
  });

  it("safeInvoke 在 production 非 Tauri：非 MVP command 拋 LocalApiNotWiredError", async () => {
    // 非 MVP command（如 export_pdf_to_file）→ 拋 LocalApiNotWiredError
    vi.stubEnv("NODE_ENV", "production");
    vi.doMock("@tauri-apps/api/core", () => ({
      invoke: undefined,
    }));

    const { safeInvoke, LocalApiNotWiredError } = await import("../tauri-bridge");

    await expect(safeInvoke("export_pdf_to_file")).rejects.toBeInstanceOf(LocalApiNotWiredError);
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
