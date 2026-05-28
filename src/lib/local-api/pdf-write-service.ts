/**
 * Node PDF 寫檔服務（server-only）
 *
 * 職責：接收前端已渲染的 PDF bytes（base64）→ 原子寫檔到本機資料目錄。
 *
 * Design Decision 9（強制遵守）：
 *   - 前端 pdf-lib（@react-pdf/renderer）負責渲染，Node 端絕不可 import pdf-engine 渲染鏈。
 *   - Node 只做「解碼 base64 → 原子寫 .tmp → rename」，取代 Rust `export_pdf` IPC。
 *   - draft：寫到 pdf/draft/<caseId>-<timestamp>.pdf
 *   - official：寫到 pdf/official/<caseId>-<timestamp>.pdf（多了補件與簽名頁，bytes 較大）
 *   - 兩階段差異只在子目錄/檔名，不在 Node 端渲染。
 *
 * ⚠️ 此模組使用 Node.js `fs`，禁止被前端 client bundle import。
 */

import fs from "node:fs";
import path from "node:path";
import type { DraftPdfRequest, OfficialPdfRequest, PdfWriteResponse } from "./contract";
import { atomicWriteFile, getPdfDir } from "./data-dir";

// ──────────────────────────────────────────────────────────────────────────────
// 目錄管理
// ──────────────────────────────────────────────────────────────────────────────

/** 取得 pdf/draft/ 目錄路徑（已確保存在） */
function getDraftDir(): string {
  const dir = path.join(getPdfDir(), "draft");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** 取得 pdf/official/ 目錄路徑（已確保存在） */
function getOfficialDir(): string {
  const dir = path.join(getPdfDir(), "official");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ──────────────────────────────────────────────────────────────────────────────
// bytes 解碼
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 將前端傳入的 base64 字串解碼為 Buffer。
 * 若輸入為空或非有效 base64，拋出 Error（由 route 層轉為 400）。
 */
function decodeBase64(pdfBase64: string): Buffer {
  if (!pdfBase64) {
    throw new Error("pdfBase64 不得為空");
  }
  // 移除 data URI 前綴（如 data:application/pdf;base64,...）
  const base64Data = pdfBase64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length === 0) {
    throw new Error("pdfBase64 解碼後為空，請確認前端渲染是否成功");
  }
  return buffer;
}

// ──────────────────────────────────────────────────────────────────────────────
// 公開 API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 草稿 PDF 寫檔：接收前端已渲染的 PDF bytes（base64）→ 原子寫到 pdf/draft/。
 *
 * @param req - 含 pdfBase64（前端渲染輸出）與案件識別資訊
 * @returns PdfWriteResponse（outputPath、sizeBytes、writtenAt）
 */
export async function writeDraftPdf(req: DraftPdfRequest): Promise<PdfWriteResponse> {
  // 解碼前端渲染的 PDF bytes
  const buffer = decodeBase64(req.pdfBase64);

  // 原子寫檔到 pdf/draft/
  const ts = Date.now();
  const fileName = `draft-${req.caseId}-${ts}.pdf`;
  const outputPath = path.join(getDraftDir(), fileName);
  await atomicWriteFile(outputPath, buffer);

  const stat = fs.statSync(outputPath);
  return {
    outputPath,
    sizeBytes: stat.size,
    writtenAt: new Date().toISOString(),
  };
}

/**
 * 說明書 PDF 寫檔：接收前端已渲染的 PDF bytes（base64）→ 原子寫到 pdf/official/。
 *
 * 說明書由前端在草稿基礎上加補件嵌入頁 + 客戶簽名頁，渲染完成後同樣以 base64 傳入。
 * Decision 9：前面內容不變，Node 端不知道也不管渲染細節，只負責寫檔。
 *
 * @param req - 含 pdfBase64（前端渲染輸出）+ supplements + signaturePage（供日誌用）
 * @returns PdfWriteResponse（outputPath、sizeBytes、writtenAt）
 */
export async function writeOfficialPdf(req: OfficialPdfRequest): Promise<PdfWriteResponse> {
  // 解碼前端渲染的 PDF bytes（說明書 bytes 應大於草稿）
  const buffer = decodeBase64(req.pdfBase64);

  // 原子寫檔到 pdf/official/
  const ts = Date.now();
  const fileName = `official-${req.caseId}-${ts}.pdf`;
  const outputPath = path.join(getOfficialDir(), fileName);
  await atomicWriteFile(outputPath, buffer);

  const stat = fs.statSync(outputPath);
  return {
    outputPath,
    sizeBytes: stat.size,
    writtenAt: new Date().toISOString(),
  };
}
