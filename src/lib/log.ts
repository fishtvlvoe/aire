/**
 * Frontend log helper
 *
 * 對應 AIRE Phase 1 Group 9.x — 把 frontend 端的操作事件寫到 SQLite operation_log。
 * 真實寫入由 Rust 端 `src-tauri/src/log.rs` 與 `commands/log.rs` 完成（Group 9.1/9.2 subagent）。
 */

"use client";

import { NotInTauriError, safeInvoke } from "@/lib/tauri-bridge";

export type LogAction =
  | "license_activate"
  | "license_verify"
  | "case_create"
  | "case_update"
  | "case_delete"
  | "case_status_change"
  | "draft_save"
  | "pdf_export"
  | "setting_change";

export type LogResult = "ok" | "error";

/** 白名單 — Rust 端會再做一次過濾 */
const ALLOWED_PAYLOAD_KEYS = new Set([
  "case_id",
  "device_id",
  "output_path",
  "reason",
]);

export interface LogPayload {
  case_id?: string;
  device_id?: string;
  output_path?: string;
  reason?: string;
}

export interface LogEntry {
  id: number;
  ts: number;
  action: string;
  payload: string | null;
  result: LogResult;
}

/**
 * 寫一筆 operation log。
 * 非同步、失敗不 throw（只 console.warn）。
 */
export async function writeLog(
  action: LogAction,
  result: LogResult,
  payload?: LogPayload,
): Promise<void> {
  try {
    // 前端先過濾白名單，雙保險
    const sanitized: LogPayload = {};
    if (payload) {
      for (const [k, v] of Object.entries(payload)) {
        if (ALLOWED_PAYLOAD_KEYS.has(k) && v !== undefined) {
          (sanitized as Record<string, unknown>)[k] = v;
        }
      }
    }
    await safeInvoke("write_log", {
      action,
      result,
      payload: Object.keys(sanitized).length > 0 ? sanitized : null,
    });
  } catch (err) {
    console.warn("[writeLog] failed:", err);
  }
}

/**
 * 查詢最近的 log 條目。
 * 用於設定頁的「操作紀錄」分頁、debug 用。
 */
export async function listRecentLogs(limit = 100): Promise<LogEntry[]> {
  try {
    const entries = await safeInvoke<LogEntry[]>("list_recent_logs", { limit });
    return entries;
  } catch (err) {
    if (err instanceof NotInTauriError) {
      return [];
    }
    console.error("[listRecentLogs] failed:", err);
    return [];
  }
}

/**
 * 格式化 log 時間戳為 Asia/Taipei `YYYY-MM-DD HH:mm:ss`
 */
export function formatLogTime(ts: number): string {
  const date = new Date(ts * 1000);
  const fmt = new Intl.DateTimeFormat("zh-TW-u-ca-gregory", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return fmt.format(date).replace(/\//g, "-");
}

/**
 * Log 行動的中文標籤
 */
export const LOG_ACTION_LABELS: Record<LogAction, string> = {
  license_activate: "授權啟用",
  license_verify: "授權驗證",
  case_create: "新增案件",
  case_update: "編輯案件",
  case_delete: "刪除案件",
  case_status_change: "案件狀態變更",
  draft_save: "草稿儲存",
  pdf_export: "匯出 PDF",
  setting_change: "設定變更",
};

export function labelForAction(action: string): string {
  return (LOG_ACTION_LABELS as Record<string, string>)[action] || action;
}
