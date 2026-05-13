/**
 * keyboard-shortcuts hook 單元測試
 * 覆蓋 5 個快捷鍵 + macOS/Windows 平台差異
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useKeyboardShortcuts,
  hasPlatformModifier,
} from "./keyboard-shortcuts";

// 強制 mock 平台:預設 macOS,測試內可改 windows
function setPlatform(platform: string) {
  Object.defineProperty(window.navigator, "platform", {
    value: platform,
    configurable: true,
    writable: true,
  });
}

function fireKey(key: string, opts: { meta?: boolean; ctrl?: boolean } = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    metaKey: opts.meta ?? false,
    ctrlKey: opts.ctrl ?? false,
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
  return event;
}

describe("useKeyboardShortcuts (Mac 平台)", () => {
  beforeEach(() => {
    setPlatform("MacIntel");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Cmd+N 觸發 newCase", () => {
    const newCase = vi.fn();
    renderHook(() => useKeyboardShortcuts({ newCase }));
    fireKey("n", { meta: true });
    expect(newCase).toHaveBeenCalledTimes(1);
  });

  it("Cmd+S 觸發 saveDraft", () => {
    const saveDraft = vi.fn();
    renderHook(() => useKeyboardShortcuts({ saveDraft }));
    fireKey("s", { meta: true });
    expect(saveDraft).toHaveBeenCalledTimes(1);
  });

  it("Cmd+, 觸發 settings", () => {
    const settings = vi.fn();
    renderHook(() => useKeyboardShortcuts({ settings }));
    fireKey(",", { meta: true });
    expect(settings).toHaveBeenCalledTimes(1);
  });

  it("Cmd+K 觸發 commandPalette", () => {
    const commandPalette = vi.fn();
    renderHook(() => useKeyboardShortcuts({ commandPalette }));
    fireKey("k", { meta: true });
    expect(commandPalette).toHaveBeenCalledTimes(1);
  });

  it("Esc 觸發 escape(不需修飾鍵)", () => {
    const escape = vi.fn();
    renderHook(() => useKeyboardShortcuts({ escape }));
    fireKey("Escape");
    expect(escape).toHaveBeenCalledTimes(1);
  });

  it("Mac 下 ctrlKey 不觸發 newCase", () => {
    const newCase = vi.fn();
    renderHook(() => useKeyboardShortcuts({ newCase }));
    fireKey("n", { ctrl: true });
    expect(newCase).not.toHaveBeenCalled();
  });

  it("沒提供 handler 不會 crash", () => {
    renderHook(() => useKeyboardShortcuts({}));
    expect(() => fireKey("n", { meta: true })).not.toThrow();
  });

  it("unmount 後解除監聽", () => {
    const newCase = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ newCase }));
    unmount();
    fireKey("n", { meta: true });
    expect(newCase).not.toHaveBeenCalled();
  });
});

describe("useKeyboardShortcuts (Windows 平台)", () => {
  beforeEach(() => {
    setPlatform("Win32");
  });

  it("Ctrl+N 觸發 newCase", () => {
    const newCase = vi.fn();
    renderHook(() => useKeyboardShortcuts({ newCase }));
    fireKey("n", { ctrl: true });
    expect(newCase).toHaveBeenCalledTimes(1);
  });

  it("Windows 下 metaKey 不觸發 newCase", () => {
    const newCase = vi.fn();
    renderHook(() => useKeyboardShortcuts({ newCase }));
    fireKey("n", { meta: true });
    expect(newCase).not.toHaveBeenCalled();
  });
});

describe("hasPlatformModifier", () => {
  it("Mac: 認 metaKey", () => {
    setPlatform("MacIntel");
    const e = new KeyboardEvent("keydown", { key: "n", metaKey: true });
    expect(hasPlatformModifier(e)).toBe(true);
  });

  it("Windows: 認 ctrlKey", () => {
    setPlatform("Win32");
    const e = new KeyboardEvent("keydown", { key: "n", ctrlKey: true });
    expect(hasPlatformModifier(e)).toBe(true);
  });
});
