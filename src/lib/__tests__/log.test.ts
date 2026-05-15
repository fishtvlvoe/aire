import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../tauri-bridge", () => {
  class NotInTauriError extends Error {}
  return {
    safeInvoke: vi.fn(),
    NotInTauriError,
  };
});

import { listRecentLogs } from "../log";
import { safeInvoke, NotInTauriError } from "../tauri-bridge";

const mockSafeInvoke = vi.mocked(safeInvoke);

describe("listRecentLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when NotInTauriError is thrown", async () => {
    mockSafeInvoke.mockRejectedValue(new NotInTauriError("not in tauri"));

    await expect(listRecentLogs()).resolves.toEqual([]);
  });
});
