/**
 * PDF 匯出整合層（Group 8.4 / 8.5）
 *
 * 流程：
 * 1. renderDisclosurePdf 產出 Uint8Array
 * 2. 開系統檔案對話框讓用戶選輸出路徑
 * 3. invoke('export_pdf', { args }) 由 Rust 端寫檔 + 更新 case 狀態 + 寫 log
 *
 * 失敗回傳 ExportError，UI 用 code 顯示對應訊息。
 */

import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import {
  renderDisclosurePdf,
  generatePdfFileName,
  TemplateNotFoundError,
  FontNotFoundError,
  type RenderInput,
} from "./pdf-renderer";

export type ExportErrorCode =
  | "TEMPLATE_MISSING"
  | "FONT_LOAD_FAILED"
  | "DISK_FULL"
  | "PATH_LOCKED"
  | "USER_CANCELLED"
  | "UNKNOWN";

export class ExportError extends Error {
  constructor(
    public code: ExportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ExportError";
  }
}

export interface ExportPdfResult {
  /** 寫入成功的絕對路徑 */
  outputPath: string;
}

/**
 * 完整匯出流程。失敗 throw ExportError。
 *
 * @returns 寫入成功的 output path（用於顯示「開啟所在資料夾」按鈕）
 */
export async function exportDisclosurePdf(
  input: RenderInput & { caseId: string },
): Promise<ExportPdfResult> {
  // 1. 渲染 PDF
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await renderDisclosurePdf(input);
  } catch (err) {
    if (err instanceof TemplateNotFoundError) {
      throw new ExportError("TEMPLATE_MISSING", err.message);
    }
    if (err instanceof FontNotFoundError) {
      throw new ExportError("FONT_LOAD_FAILED", err.message);
    }
    throw new ExportError(
      "UNKNOWN",
      err instanceof Error ? err.message : String(err),
    );
  }

  // 2. 取得輸出路徑（系統檔案對話框）
  const defaultName = generatePdfFileName(input);
  let chosen: string | null;
  try {
    chosen = await save({
      defaultPath: defaultName,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
      title: "選擇輸出位置",
    });
  } catch (err) {
    throw new ExportError(
      "UNKNOWN",
      err instanceof Error ? err.message : String(err),
    );
  }
  if (!chosen) {
    // 用戶取消 — 不寫 log（spec：cancel 不算失敗）
    throw new ExportError("USER_CANCELLED", "已取消匯出");
  }

  // 3. invoke 寫檔
  try {
    const outputPath = await invoke<string>("export_pdf", {
      args: {
        caseId: input.caseId,
        pdfBytes: Array.from(pdfBytes),
        outputPath: chosen,
      },
    });
    return { outputPath };
  } catch (err) {
    // Tauri error 物件帶 code/message
    const e = err as { code?: string; message?: string };
    const code = (e.code as ExportErrorCode) ?? "UNKNOWN";
    const message = e.message ?? String(err);
    throw new ExportError(code, message);
  }
}

/**
 * 在系統檔案總管裡 reveal 一個檔案（Finder / Explorer）。
 */
export async function revealInFolder(path: string): Promise<void> {
  const { revealItemInDir } = await import("@tauri-apps/plugin-opener");
  await revealItemInDir(path);
}

/** UI 用：把 ExportErrorCode 對應成中文訊息 */
export function exportErrorMessage(err: ExportError): string {
  switch (err.code) {
    case "TEMPLATE_MISSING":
      return "PDF 底板檔案缺失，請聯絡支援團隊補檔";
    case "FONT_LOAD_FAILED":
      return "字型載入失敗，請聯絡支援團隊重新安裝";
    case "DISK_FULL":
      return "磁碟空間不足，無法寫入 PDF";
    case "PATH_LOCKED":
      return "目標檔案被其他程式鎖定或無寫入權限，請選擇其他位置";
    case "USER_CANCELLED":
      return "已取消匯出";
    default:
      return err.message || "匯出失敗（未知錯誤）";
  }
}
