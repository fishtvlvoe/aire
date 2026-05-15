import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../tauri-bridge", () => {
  class NotInTauriError extends Error {}
  return {
    safeInvoke: vi.fn(),
    NotInTauriError,
  };
});

import { casesApi } from "../cases-api";
import { safeInvoke, NotInTauriError } from "../tauri-bridge";

const mockSafeInvoke = vi.mocked(safeInvoke);

describe("casesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses safeInvoke for list_cases", async () => {
    mockSafeInvoke.mockResolvedValue([]);

    await casesApi.list();

    expect(mockSafeInvoke).toHaveBeenCalledWith("list_cases", undefined);
  });

  it("throws NotInTauriError in browser env", async () => {
    const error = new NotInTauriError("not in tauri");
    mockSafeInvoke.mockRejectedValue(error);

    await expect(casesApi.list()).rejects.toBe(error);
  });
});
