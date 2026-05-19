import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  listen: vi.fn(() => Promise.resolve(() => undefined)),
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
vi.mock("@tauri-apps/api/event", () => ({ listen: mocks.listen }));

describe("useDraftAutosave — interval heartbeat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.invoke.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls save_draft every 15 seconds via interval (independent of user input)", async () => {
    const { useDraftAutosave } = await import("../use-draft-autosave");
    const { rerender } = renderHook(
      ({ payload }: { payload: Record<string, unknown> }) =>
        useDraftAutosave({ caseId: "case-interval-001", payload, debounceMs: 999999 }),
      { initialProps: { payload: { agent_name: "test" } } }
    );

    // 先等 mount 穩定
    await act(async () => {
      await Promise.resolve();
    });

    const callsBefore = mocks.invoke.mock.calls.filter((c) => c[0] === "save_draft").length;

    // 推進 15 秒（interval 應觸發一次）
    await act(async () => {
      vi.advanceTimersByTime(15000);
      await Promise.resolve();
    });

    const callsAfter = mocks.invoke.mock.calls.filter((c) => c[0] === "save_draft").length;
    expect(callsAfter).toBeGreaterThan(callsBefore);
  });

  it("flushes on unmount (cleanup saves immediately)", async () => {
    const { useDraftAutosave } = await import("../use-draft-autosave");
    const { unmount } = renderHook(() =>
      useDraftAutosave({
        caseId: "case-flush-001",
        payload: { agent_name: "flush-test" },
        debounceMs: 999999,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    const callsBefore = mocks.invoke.mock.calls.filter((c) => c[0] === "save_draft").length;

    // unmount — should trigger flush
    unmount();

    await act(async () => {
      await Promise.resolve();
    });

    const callsAfter = mocks.invoke.mock.calls.filter((c) => c[0] === "save_draft").length;
    expect(callsAfter).toBeGreaterThan(callsBefore);
  });
});
