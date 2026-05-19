export interface IpcError {
  code: string;
  message: string;
}

export function isIpcError(e: unknown): e is IpcError {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as Record<string, unknown>).code === "string"
  );
}

export function parseIpcError(raw: unknown): IpcError | null {
  if (isIpcError(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isIpcError(parsed)) return parsed;
    } catch {
      // not JSON
    }
  }
  return null;
}

const IPC_ERROR_MESSAGES: Record<string, string> = {
  not_found: "找不到指定的資源",
  missing_field: "請填寫所有必填欄位",
  db_error: "資料庫操作失敗，請重試",
  validation_error: "資料驗證未通過，請確認輸入",
  forbidden: "您沒有執行此操作的權限",
  internal: "系統發生錯誤，請聯絡技術支援",
};

export function formatIpcError(code: string): string {
  return IPC_ERROR_MESSAGES[code] ?? "操作失敗，請稍後再試";
}
