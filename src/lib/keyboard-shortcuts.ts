"use client";

import { useEffect } from "react";

export interface KeyboardShortcutHandlers {
  /** Cmd/Ctrl + N — 新增案件 */
  newCase?: () => void;
  /** Cmd/Ctrl + S — 強制 flush 草稿自動儲存 */
  saveDraft?: () => void;
  /** Cmd/Ctrl + , — 開啟設定 */
  settings?: () => void;
  /** Esc — 關閉 modal / 取消 */
  escape?: () => void;
  /** Cmd/Ctrl + K — 開啟命令面板 */
  commandPalette?: () => void;
}

/**
 * 偵測平台:macOS 用 metaKey(Cmd),其他用 ctrlKey
 * 抽成 function 方便測試 mock
 */
export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.platform.toUpperCase().includes("MAC");
}

/**
 * 判斷事件是否帶有「平台主修飾鍵」(Mac=meta,其他=ctrl)
 */
export function hasPlatformModifier(e: KeyboardEvent): boolean {
  return isMacPlatform() ? e.metaKey : e.ctrlKey;
}

/**
 * 全域鍵盤快捷鍵 hook
 * 對齊 docs/ux-patterns.md 第六節
 *
 * 用法:
 * useKeyboardShortcuts({
 *   newCase: () => router.push("/cases/new"),
 *   saveDraft: () => flushDraft(),
 *   escape: () => closeModal(),
 * });
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = hasPlatformModifier(e);
      const key = e.key.toLowerCase();

      // Esc — 不需修飾鍵
      if (key === "escape" && handlers.escape) {
        handlers.escape();
        return;
      }

      // 其他快捷鍵需平台修飾鍵
      if (!mod) return;

      if (key === "n" && handlers.newCase) {
        e.preventDefault();
        handlers.newCase();
      } else if (key === "s" && handlers.saveDraft) {
        e.preventDefault();
        handlers.saveDraft();
      } else if (key === "," && handlers.settings) {
        e.preventDefault();
        handlers.settings();
      } else if (key === "k" && handlers.commandPalette) {
        e.preventDefault();
        handlers.commandPalette();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
