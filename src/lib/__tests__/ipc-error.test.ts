import { describe, expect, it } from "vitest";
import {
  formatIpcError,
  isIpcError,
  parseIpcError,
} from "@/lib/ipc-error";

describe("parseIpcError", () => {
  it("JSON 字串輸入 → 回傳 IpcError", () => {
    const raw = '{"code":"not_found","message":"case not found"}';
    const result = parseIpcError(raw);
    expect(result).toEqual({ code: "not_found", message: "case not found" });
  });

  it("plain object 輸入 → 回傳 IpcError", () => {
    const raw = { code: "db_error", message: "sqlite failed" };
    const result = parseIpcError(raw);
    expect(result).toEqual({ code: "db_error", message: "sqlite failed" });
  });

  it("null 輸入 → 回傳 null", () => {
    expect(parseIpcError(null)).toBeNull();
  });
});

describe("formatIpcError", () => {
  it("已知 code 回傳對應中文訊息", () => {
    expect(formatIpcError("not_found")).toBe("找不到指定的資源");
    expect(formatIpcError("missing_field")).toBe("請填寫所有必填欄位");
    expect(formatIpcError("db_error")).toBe("資料庫操作失敗，請重試");
    expect(formatIpcError("validation_error")).toBe("資料驗證未通過，請確認輸入");
    expect(formatIpcError("forbidden")).toBe("您沒有執行此操作的權限");
    expect(formatIpcError("internal")).toBe("系統發生錯誤，請聯絡技術支援");
  });

  it("未知 code → fallback 訊息", () => {
    expect(formatIpcError("some_unknown_code")).toBe("操作失敗，請稍後再試");
  });
});

describe("isIpcError", () => {
  it("含 code 欄位的 object → true", () => {
    expect(isIpcError({ code: "not_found", message: "x" })).toBe(true);
  });
});
