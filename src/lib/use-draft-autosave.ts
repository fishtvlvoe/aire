/**
 * useDraftAutosave hook
 *
 * 對應 AIRE Phase 1 Group 6.3 + 6.4 + 7.x。
 * 通用草稿自動儲存：debounce 1000ms、視窗關閉強制 flush、狀態指示。
 *
 * 使用：
 *   const { state, savedAt, flush } = useDraftAutosave({
 *     caseId,
 *     payload: form.watch(),
 *     debounceMs: 1000,
 *   });
 *
 * 配合 <AutosaveIndicator state={state} savedAt={savedAt} />
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type AutosaveState = "idle" | "saving" | "saved" | "error";

export interface UseDraftAutosaveOptions {
  caseId: string;
  payload: Record<string, unknown>;
  /** debounce 毫秒數，預設 1000 */
  debounceMs?: number;
  /** 啟用旗標。false 時 hook 不動作（例如載入中） */
  enabled?: boolean;
  /** schema 版本，預設 1 */
  schemaVersion?: number;
}

export interface UseDraftAutosaveResult {
  state: AutosaveState;
  /** 上次成功儲存的時間（local Date） */
  savedAt: Date | null;
  /** 手動強制觸發儲存（例如 Cmd+S） */
  flush: () => Promise<void>;
}

const DEFAULT_DEBOUNCE_MS = 1000;

export function useDraftAutosave(
  options: UseDraftAutosaveOptions,
): UseDraftAutosaveResult {
  const {
    caseId,
    payload,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    enabled = true,
    schemaVersion = 1,
  } = options;

  const [state, setState] = useState<AutosaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // payload 用 ref 避免閉包抓到舊值
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  const caseIdRef = useRef(caseId);
  caseIdRef.current = caseId;

  const schemaVersionRef = useRef(schemaVersion);
  schemaVersionRef.current = schemaVersion;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef(false);

  // 核心存檔函式
  async function performSave(): Promise<void> {
    if (!caseIdRef.current) return;
    if (inflightRef.current) return;
    inflightRef.current = true;
    setState("saving");
    try {
      await invoke("save_draft", {
        caseId: caseIdRef.current,
        payload: payloadRef.current,
        schemaVersion: schemaVersionRef.current,
      });
      setState("saved");
      setSavedAt(new Date());
    } catch (err) {
      console.error("[useDraftAutosave] save failed:", err);
      setState("error");
    } finally {
      inflightRef.current = false;
    }
  }

  // 監聽 payload 變化 → debounce → save
  useEffect(() => {
    if (!enabled) return;
    if (!caseId) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void performSave();
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // 故意只依賴 payload reference，每次 payload 變動都重設 timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, enabled, caseId, debounceMs]);

  // 視窗關閉時強制 flush（Tauri onCloseRequested）
  useEffect(() => {
    if (!enabled) return;
    let unlisten: UnlistenFn | null = null;
    void (async () => {
      try {
        unlisten = await listen("tauri://close-requested", async () => {
          if (timerRef.current) clearTimeout(timerRef.current);
          await performSave();
        });
      } catch (err) {
        console.warn("[useDraftAutosave] could not subscribe to close-requested:", err);
      }
    })();
    return () => {
      if (unlisten) unlisten();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  async function flush(): Promise<void> {
    if (timerRef.current) clearTimeout(timerRef.current);
    await performSave();
  }

  return { state, savedAt, flush };
}

/**
 * 載入既有草稿（從 SQLite）。
 * 對應 Group 6.4 + 7.x「載入既有草稿」task。
 */
export async function loadDraft<T = Record<string, unknown>>(
  caseId: string,
): Promise<T | null> {
  try {
    const result = await invoke<{ payload_json: string } | null>("get_draft", {
      caseId,
    });
    if (!result) return null;
    return JSON.parse(result.payload_json) as T;
  } catch (err) {
    console.error("[loadDraft] failed:", err);
    return null;
  }
}
