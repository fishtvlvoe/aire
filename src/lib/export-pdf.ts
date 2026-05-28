/**
 * PDF 匯出整合層（前端 client-only）
 *
 * 流程（park Tauri 後更新版）：
 * 1. renderDisclosurePdf 產出 Uint8Array（前端 @react-pdf/renderer 渲染，保留不動）
 * 2. Uint8Array 轉 base64
 * 3. POST base64 到 /api/local/pdf（Node route 負責原子寫檔到本機資料目錄）
 *    帶 X-Local-Token header（token 從 window.__AIRE_LOCAL_TOKEN__ 讀，讀不到則空字串）
 *
 * 注意：
 * - Tauri plugin-dialog save 對話框已廢棄（park Tauri 後失效），改由 Node 決定寫檔路徑。
 * - Rust export_pdf IPC 已廢棄，Node route 取代（Decision 9）。
 * - middleware 整合（token 驗證）是後續包的事，本包只把呼叫端接好。
 *
 * 失敗回傳 ExportError，UI 用 code 顯示對應訊息。
 */

import {
  renderDisclosurePdf,
  generatePdfFileName,
  TemplateNotFoundError,
  FontNotFoundError,
  type RenderInput,
} from "./pdf-renderer";
import type { PdfWriteResponse } from "@/lib/local-api/contract";
import { localApiFetch } from "@/lib/local-api/client";

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
  /** 寫入成功的絕對路徑（由 Node 決定，位於本機資料目錄） */
  outputPath: string;
}


/**
 * 完整匯出流程（草稿 draft 類型）。失敗 throw ExportError。
 *
 * @returns 寫入成功的 output path（Node 決定，位於本機資料目錄）
 */
export async function exportDisclosurePdf(
  input: RenderInput & { caseId: string },
): Promise<ExportPdfResult> {
  // 1. 前端渲染 PDF（@react-pdf/renderer，保留不動）
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

  // 2. Uint8Array → base64（移除 data URI 前綴，route 端支援兩種格式）
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

  // 3. POST base64 到 Node write route（取代 Rust export_pdf IPC），帶 X-Local-Token
  let response: Response;
  try {
    response = await localApiFetch("/api/local/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "draft",
        caseId: input.caseId,
        pdfBase64,
        // registrySnapshot / propertyType 非必要（由前端渲染時已含，Node 只寫檔）
        registrySnapshot: {},
        propertyType: "residential",
      }),
    });
  } catch (err) {
    throw new ExportError(
      "UNKNOWN",
      err instanceof Error ? err.message : String(err),
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "未知錯誤" }));
    const message = (body as { message?: string }).message ?? `HTTP ${response.status}`;

    // 磁碟相關錯誤（Node 端回傳的錯誤訊息前綴）
    if (message.includes("ENOSPC") || message.includes("磁碟")) {
      throw new ExportError("DISK_FULL", message);
    }
    if (message.includes("EACCES") || message.includes("EPERM") || message.includes("權限")) {
      throw new ExportError("PATH_LOCKED", message);
    }
    throw new ExportError("UNKNOWN", message);
  }

  const result = (await response.json()) as PdfWriteResponse;
  return { outputPath: result.outputPath };
}

/**
 * 在系統檔案總管裡 reveal 一個檔案（Finder / Explorer）。
 * 保留此函式供 UI 層使用（park Tauri 後實作為 no-op，後續包再補 shell open）。
 */
export async function revealInFolder(_filePath: string): Promise<void> {
  // Tauri plugin-opener 已 park，後續補 shell.open 或 Next.js API route
  // 目前不拋錯，避免 UI 層崩潰
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
      return "目標檔案被其他程式鎖定或無寫入權限，請稍後再試";
    case "USER_CANCELLED":
      return "已取消匯出";
    default:
      return err.message || "匯出失敗（未知錯誤）";
  }
}

// generatePdfFileName 重新匯出（供 UI 層用，不改行為）
export { generatePdfFileName };
